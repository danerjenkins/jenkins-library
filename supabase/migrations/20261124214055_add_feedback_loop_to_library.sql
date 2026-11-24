-- In-app feedback loop: reports, two-way thread, audit log, private screenshot bucket.
-- Adapted from the agent-team-kit FEEDBACK-LOOP-SPEC. Intake is the feedback-report edge
-- function (service role). Every later transition goes through the feedback_* functions
-- below, so the admin inbox, the CLI and the post-commit hook share one close path.

-- The app owner's inbox is not a per-library role: reports carry screenshots from any
-- library, so access is an explicit allowlist that only the service role can change.
create table library.feedback_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

insert into library.feedback_admins (user_id)
select member.user_id
from library.library_members member
join library.libraries libraries
  on libraries.id = member.library_id
where libraries.slug = 'jenkins'
  and member.role = 'admin'
  and member.user_id is not null
on conflict (user_id) do nothing;

create table library.bug_reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null, -- null = public visitor
  source text not null default 'user' check (length(source) <= 40),
  kind text not null default 'bug' check (kind in ('bug', 'confusing', 'idea')),
  expectation text check (length(expectation) <= 2000),
  route text check (length(route) <= 256),
  app_version text check (length(app_version) <= 40),
  app_commit text check (length(app_commit) <= 40),
  session_id text check (length(session_id) <= 80),
  context jsonb not null default '{}'::jsonb check (jsonb_typeof(context) = 'object'),
  screenshot_path text,
  library_id uuid references library.libraries(id) on delete set null,
  reporter_role text check (reporter_role in ('admin', 'editor', 'member', 'guest')),

  severity text check (severity in ('low', 'med', 'high')),
  summary text check (length(summary) <= 280),

  status text not null default 'open' check (status in ('open', 'triaged', 'resolved')),
  created_at timestamptz not null default now(),
  triaged_at timestamptz,
  resolved_at timestamptz,
  resolved_by uuid references auth.users(id) on delete set null,
  resolved_via text check (resolved_via in ('admin', 'cli', 'commit', 'system')),

  resolution text check (resolution in ('fixed', 'noise', 'duplicate', 'wontfix', 'by_design')),
  fixed_commit text check (length(fixed_commit) <= 40),
  duplicate_of uuid references library.bug_reports(id) on delete set null,
  reporter_note text check (length(reporter_note) <= 600),

  -- Thread state, kept current by a trigger on bug_messages.
  last_message_at timestamptz,
  last_message_role text check (last_message_role in ('reporter', 'team')),

  -- In-app notification: unread while notice_at is newer than reporter_seen_at.
  notice_at timestamptz,
  reporter_seen_at timestamptz,

  constraint bug_reports_resolution_requires_resolved
    check (resolution is null or status = 'resolved'),
  constraint bug_reports_fixed_requires_note
    check (resolution is distinct from 'fixed' or reporter_note is not null),
  constraint bug_reports_no_self_duplicate
    check (duplicate_of is null or duplicate_of <> id)
);

create index bug_reports_created_idx on library.bug_reports (created_at desc);
create index bug_reports_user_idx on library.bug_reports (user_id, created_at desc);
create index bug_reports_open_idx on library.bug_reports (created_at desc) where status = 'open';
create index bug_reports_kind_idx on library.bug_reports (kind, created_at desc);
create index bug_reports_status_idx on library.bug_reports (status, created_at desc);
create index bug_reports_session_idx on library.bug_reports (session_id, created_at desc);
create index bug_reports_library_idx on library.bug_reports (library_id)
  where library_id is not null;
create index bug_reports_duplicate_of_idx on library.bug_reports (duplicate_of)
  where duplicate_of is not null;

create table library.bug_messages (
  id uuid primary key default gen_random_uuid(),
  bug_id uuid not null references library.bug_reports(id) on delete cascade,
  sender_role text not null check (sender_role in ('reporter', 'team')),
  sender_id uuid references auth.users(id) on delete set null,
  body text not null check (length(btrim(body)) > 0 and length(body) <= 2000),
  created_at timestamptz not null default now()
);

create index bug_messages_bug_id_created_idx on library.bug_messages (bug_id, created_at);

create table library.bug_events (
  id uuid primary key default gen_random_uuid(),
  bug_id uuid not null references library.bug_reports(id) on delete cascade,
  at timestamptz not null default now(),
  kind text not null check (kind in ('created', 'triaged', 'resolved', 'reopened')),
  from_status text,
  to_status text,
  via text check (via in ('admin', 'cli', 'commit', 'system', 'reporter')),
  actor_id uuid references auth.users(id) on delete set null,
  resolution text,
  fixed_commit text,
  note text,
  metadata jsonb not null default '{}'::jsonb
);

create index bug_events_bug_id_at_idx on library.bug_events (bug_id, at);

create function library.bug_messages_touch_parent()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update library.bug_reports
  set
    last_message_at = new.created_at,
    last_message_role = new.sender_role
  where id = new.bug_id;
  return new;
end;
$$;

create trigger bug_messages_touch_parent
after insert on library.bug_messages
for each row execute function library.bug_messages_touch_parent();

create function library.current_user_is_feedback_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from library.feedback_admins admins
    where admins.user_id = (select auth.uid())
  );
$$;

-- Who is acting? Service-role callers may name cli/commit/system; admins are always 'admin'.
create function library.feedback_operator_via(p_via text)
returns text
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if auth.role() = 'service_role' then
    return case when p_via in ('cli', 'commit', 'system') then p_via else 'cli' end;
  end if;
  if library.current_user_is_feedback_admin() then
    return 'admin';
  end if;
  raise exception 'Not authorized.' using errcode = '42501';
end;
$$;

-- The single close path.
create function library.feedback_resolve(
  p_id uuid,
  p_resolution text,
  p_reporter_note text default null,
  p_fixed_commit text default null,
  p_duplicate_of uuid default null,
  p_via text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_via text := library.feedback_operator_via(p_via);
  v_note text := nullif(left(btrim(coalesce(p_reporter_note, '')), 600), '');
  v_commit text;
  v_duplicate uuid;
  v_bug library.bug_reports;
  v_notify boolean;
begin
  if p_resolution is null
    or p_resolution not in ('fixed', 'noise', 'duplicate', 'wontfix', 'by_design') then
    raise exception 'Unknown resolution: %', p_resolution;
  end if;
  if p_resolution = 'fixed' and v_note is null then
    raise exception 'A fixed resolution needs a note for the reporter.';
  end if;

  select * into v_bug from library.bug_reports where id = p_id for update;
  if not found then
    raise exception 'Report not found.';
  end if;

  if p_resolution = 'fixed' then
    v_commit := nullif(left(btrim(coalesce(p_fixed_commit, '')), 40), '');
  end if;
  if p_resolution = 'duplicate' and p_duplicate_of is not null then
    if p_duplicate_of = p_id then
      raise exception 'A report cannot duplicate itself.';
    end if;
    if not exists (select 1 from library.bug_reports where id = p_duplicate_of) then
      raise exception 'The original report was not found.';
    end if;
    v_duplicate := p_duplicate_of;
  end if;

  -- Agent findings have no reader, and an amended commit must not notify twice.
  v_notify := v_bug.source = 'user' and (
    v_bug.status <> 'resolved'
    or v_bug.resolution is distinct from p_resolution
    or v_bug.reporter_note is distinct from v_note
  );

  update library.bug_reports
  set
    status = 'resolved',
    resolution = p_resolution,
    fixed_commit = v_commit,
    duplicate_of = v_duplicate,
    reporter_note = v_note,
    resolved_at = now(),
    resolved_by = auth.uid(),
    resolved_via = v_via,
    notice_at = case when v_notify then now() else notice_at end
  where id = p_id;

  insert into library.bug_events
    (bug_id, kind, from_status, to_status, via, actor_id, resolution, fixed_commit, note)
  values
    (p_id, 'resolved', v_bug.status, 'resolved', v_via, auth.uid(), p_resolution, v_commit, v_note);

  return jsonb_build_object('id', p_id, 'status', 'resolved', 'resolution', p_resolution);
end;
$$;

-- Operators may reopen anything; a reporter may reopen their own report.
create function library.feedback_reopen(p_id uuid, p_via text default null)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_via text;
  v_bug library.bug_reports;
begin
  select * into v_bug from library.bug_reports where id = p_id for update;

  if v_bug.user_id is not null
    and v_bug.user_id = auth.uid()
    and not library.current_user_is_feedback_admin() then
    v_via := 'reporter';
  else
    v_via := library.feedback_operator_via(p_via);
  end if;

  if v_bug.id is null then
    raise exception 'Report not found.';
  end if;
  if v_bug.status <> 'resolved' then
    raise exception 'Only resolved reports can be reopened.';
  end if;

  update library.bug_reports
  set
    status = 'open',
    triaged_at = null,
    resolution = null,
    fixed_commit = null,
    duplicate_of = null,
    reporter_note = null,
    resolved_at = null,
    resolved_by = null,
    resolved_via = null,
    notice_at = null
  where id = p_id;

  insert into library.bug_events (bug_id, kind, from_status, to_status, via, actor_id)
  values (p_id, 'reopened', 'resolved', 'open', v_via, auth.uid());

  return jsonb_build_object('id', p_id, 'status', 'open');
end;
$$;

create function library.feedback_triage(
  p_id uuid,
  p_severity text default null,
  p_summary text default null,
  p_via text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_via text := library.feedback_operator_via(p_via);
  v_summary text := nullif(left(btrim(coalesce(p_summary, '')), 280), '');
  v_bug library.bug_reports;
begin
  select * into v_bug from library.bug_reports where id = p_id for update;
  if not found then
    raise exception 'Report not found.';
  end if;
  if v_bug.status = 'resolved' then
    raise exception 'Reopen this report before triaging it.';
  end if;

  update library.bug_reports
  set
    severity = p_severity,
    summary = v_summary,
    status = 'triaged',
    triaged_at = coalesce(triaged_at, now())
  where id = p_id;

  insert into library.bug_events
    (bug_id, kind, from_status, to_status, via, actor_id, metadata)
  values
    (p_id, 'triaged', v_bug.status, 'triaged', v_via, auth.uid(),
      jsonb_build_object('severity', p_severity, 'summary', v_summary));

  return jsonb_build_object('id', p_id, 'status', 'triaged');
end;
$$;

create function library.feedback_ask(p_id uuid, p_body text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform library.feedback_operator_via(null);

  insert into library.bug_messages (bug_id, sender_role, sender_id, body)
  values (p_id, 'team', auth.uid(), left(btrim(p_body), 2000));

  update library.bug_reports
  set notice_at = now()
  where id = p_id
    and source = 'user';
end;
$$;

create function library.feedback_reply(p_id uuid, p_body text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not exists (
    select 1
    from library.bug_reports reports
    where reports.id = p_id
      and reports.user_id = (select auth.uid())
  ) then
    raise exception 'Not authorized.' using errcode = '42501';
  end if;

  insert into library.bug_messages (bug_id, sender_role, sender_id, body)
  values (p_id, 'reporter', auth.uid(), left(btrim(p_body), 2000));
end;
$$;

create function library.feedback_mark_seen()
returns void
language sql
security definer
set search_path = ''
as $$
  update library.bug_reports
  set reporter_seen_at = now()
  where user_id = (select auth.uid())
    and notice_at is not null
    and (reporter_seen_at is null or reporter_seen_at < notice_at);
$$;

create function library.feedback_unread_count()
returns integer
language sql
stable
security definer
set search_path = ''
as $$
  select count(*)::integer
  from library.bug_reports reports
  where reports.user_id = (select auth.uid())
    and reports.notice_at is not null
    and (reports.reporter_seen_at is null or reports.reporter_seen_at < reports.notice_at);
$$;

-- Short-id lookup for the CLI and the inbox. Invoker rights: RLS decides what can match.
create function library.feedback_report_ids_by_prefix(p_prefix text)
returns setof uuid
language sql
stable
set search_path = ''
as $$
  select reports.id
  from library.bug_reports reports
  where p_prefix ~* '^[0-9a-f-]{6,36}$'
    and reports.id::text like lower(p_prefix) || '%'
  limit 2;
$$;

revoke all on function library.bug_messages_touch_parent() from public, anon, authenticated;
revoke all on function library.current_user_is_feedback_admin() from public, anon;
revoke all on function library.feedback_operator_via(text) from public, anon, authenticated;
revoke all on function library.feedback_resolve(uuid, text, text, text, uuid, text) from public, anon;
revoke all on function library.feedback_reopen(uuid, text) from public, anon;
revoke all on function library.feedback_triage(uuid, text, text, text) from public, anon;
revoke all on function library.feedback_ask(uuid, text) from public, anon;
revoke all on function library.feedback_reply(uuid, text) from public, anon;
revoke all on function library.feedback_mark_seen() from public, anon;
revoke all on function library.feedback_unread_count() from public, anon;
revoke all on function library.feedback_report_ids_by_prefix(text) from public, anon;

grant execute on function library.current_user_is_feedback_admin() to authenticated;
grant execute on function library.feedback_resolve(uuid, text, text, text, uuid, text)
  to authenticated, service_role;
grant execute on function library.feedback_reopen(uuid, text) to authenticated, service_role;
grant execute on function library.feedback_triage(uuid, text, text, text)
  to authenticated, service_role;
grant execute on function library.feedback_ask(uuid, text) to authenticated, service_role;
grant execute on function library.feedback_reply(uuid, text) to authenticated;
grant execute on function library.feedback_mark_seen() to authenticated;
grant execute on function library.feedback_unread_count() to authenticated;
grant execute on function library.feedback_report_ids_by_prefix(text)
  to authenticated, service_role;

-- Clients only read; every write is a function above or the service-role intake.
alter table library.feedback_admins enable row level security;
alter table library.bug_reports enable row level security;
alter table library.bug_messages enable row level security;
alter table library.bug_events enable row level security;

revoke all on table library.feedback_admins from anon, authenticated;
revoke all on table library.bug_reports from anon, authenticated;
revoke all on table library.bug_messages from anon, authenticated;
revoke all on table library.bug_events from anon, authenticated;

grant select on table library.bug_reports to authenticated;
grant select on table library.bug_messages to authenticated;
grant select on table library.bug_events to authenticated;

grant usage on schema library to service_role;
grant select, insert, update, delete on table library.feedback_admins to service_role;
grant select, insert, update, delete on table library.bug_reports to service_role;
grant select, insert on table library.bug_messages to service_role;
grant select, insert on table library.bug_events to service_role;
grant select on table library.libraries to service_role;

create policy "Reporters and feedback admins can read reports"
on library.bug_reports
for select
to authenticated
using (
  user_id = (select auth.uid())
  or (select library.current_user_is_feedback_admin())
);

create policy "Reporters and feedback admins can read threads"
on library.bug_messages
for select
to authenticated
using (
  exists (
    select 1
    from library.bug_reports reports
    where reports.id = bug_messages.bug_id
      and (
        reports.user_id = (select auth.uid())
        or (select library.current_user_is_feedback_admin())
      )
  )
);

create policy "Feedback admins can read events"
on library.bug_events
for select
to authenticated
using ((select library.current_user_is_feedback_admin()));

-- Private screenshots at '{report_id}/screenshot.png', uploaded by the service role.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('library-feedback', 'library-feedback', false, 6291456, array['image/png'])
on conflict (id) do nothing;

create policy "Reporters and feedback admins can read library screenshots"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'library-feedback'
  and exists (
    select 1
    from library.bug_reports reports
    where reports.id::text = (storage.foldername(objects.name))[1]
      and (
        reports.user_id = (select auth.uid())
        or (select library.current_user_is_feedback_admin())
      )
  )
);
