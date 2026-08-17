create table if not exists library.libraries (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null,
  public_access_enabled boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint libraries_slug_check check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')
);

create unique index if not exists libraries_slug_unique_ci
  on library.libraries (lower(slug));

create table if not exists library.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  display_name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists profiles_email_unique_ci
  on library.profiles (lower(email));

create table if not exists library.library_members (
  id uuid primary key default gen_random_uuid(),
  library_id uuid not null references library.libraries(id) on delete cascade,
  user_id uuid null references auth.users(id) on delete set null,
  email text null,
  display_name text not null,
  role text not null default 'member',
  can_view_member_activity boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint library_members_role_check check (role in ('admin', 'editor', 'member')),
  constraint library_members_identity_check check (user_id is not null or email is not null)
);

create unique index if not exists library_members_library_user_unique
  on library.library_members (library_id, user_id)
  where user_id is not null;

create unique index if not exists library_members_library_email_unique_ci
  on library.library_members (library_id, lower(email))
  where email is not null;

update library.libraries
set
  name = 'Jenkins Library',
  public_access_enabled = true,
  updated_at = now()
where lower(slug) = 'jenkins';

insert into library.libraries (name, slug, public_access_enabled)
select 'Jenkins Library', 'jenkins', true
where not exists (
  select 1
  from library.libraries
  where lower(slug) = 'jenkins'
);

insert into library.profiles (user_id, email, display_name)
select id, email, 'Dane'
from auth.users
where lower(email) = 'danerogerjenkins@gmail.com'
on conflict (user_id) do update
set
  email = excluded.email,
  display_name = excluded.display_name,
  updated_at = now();

insert into library.profiles (user_id, email, display_name)
select id, email, 'Emma'
from auth.users
where lower(email) = 'ecsloan3@gmail.com'
on conflict (user_id) do update
set
  email = excluded.email,
  display_name = excluded.display_name,
  updated_at = now();

with seed as (
  select
    libraries.id as library_id,
    users.id as user_id
  from library.libraries
  left join auth.users users
    on lower(users.email) = 'danerogerjenkins@gmail.com'
  where libraries.slug = 'jenkins'
)
update library.library_members members
set
  user_id = seed.user_id,
  display_name = 'Dane',
  role = 'admin',
  can_view_member_activity = true,
  updated_at = now()
from seed
where members.library_id = seed.library_id
  and lower(members.email) = 'danerogerjenkins@gmail.com';

with seed as (
  select
    libraries.id as library_id,
    users.id as user_id
  from library.libraries
  left join auth.users users
    on lower(users.email) = 'danerogerjenkins@gmail.com'
  where libraries.slug = 'jenkins'
)
insert into library.library_members (
  library_id,
  user_id,
  email,
  display_name,
  role,
  can_view_member_activity
)
select
  seed.library_id,
  seed.user_id,
  'danerogerjenkins@gmail.com',
  'Dane',
  'admin',
  true
from seed
where not exists (
  select 1
  from library.library_members members
  where members.library_id = seed.library_id
    and lower(members.email) = 'danerogerjenkins@gmail.com'
);

with seed as (
  select
    libraries.id as library_id,
    users.id as user_id
  from library.libraries
  left join auth.users users
    on lower(users.email) = 'ecsloan3@gmail.com'
  where libraries.slug = 'jenkins'
)
update library.library_members members
set
  user_id = coalesce(seed.user_id, members.user_id),
  display_name = 'Emma',
  can_view_member_activity = true,
  updated_at = now()
from seed
where members.library_id = seed.library_id
  and lower(members.email) = 'ecsloan3@gmail.com';

with seed as (
  select
    libraries.id as library_id,
    users.id as user_id
  from library.libraries
  left join auth.users users
    on lower(users.email) = 'ecsloan3@gmail.com'
  where libraries.slug = 'jenkins'
)
insert into library.library_members (
  library_id,
  user_id,
  email,
  display_name,
  role,
  can_view_member_activity
)
select
  seed.library_id,
  seed.user_id,
  'ecsloan3@gmail.com',
  'Emma',
  'member',
  true
from seed
where not exists (
  select 1
  from library.library_members members
  where members.library_id = seed.library_id
    and lower(members.email) = 'ecsloan3@gmail.com'
);

alter table library.books
  add column if not exists library_id uuid references library.libraries(id) on delete restrict;

update library.books
set library_id = (select id from library.libraries where slug = 'jenkins')
where library_id is null;

alter table library.books
  alter column library_id set not null;

alter table library.series
  add column if not exists library_id uuid references library.libraries(id) on delete cascade;

update library.series
set library_id = (select id from library.libraries where slug = 'jenkins')
where library_id is null;

alter table library.series
  alter column library_id set not null;

drop index if exists library.books_unique_title_author_active;
create unique index if not exists books_unique_library_title_author_active
  on library.books (library_id, title, author)
  where deleted_at is null;

drop index if exists library.series_name_unique_ci;
create unique index if not exists series_library_name_unique_ci
  on library.series (library_id, lower(name));

create index if not exists books_library_id_idx
  on library.books (library_id);

create index if not exists series_library_id_idx
  on library.series (library_id);

create table if not exists library.user_book_reads (
  book_id uuid not null references library.books(id) on delete cascade,
  member_id uuid not null references library.library_members(id) on delete cascade,
  read_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  primary key (book_id, member_id)
);

create index if not exists user_book_reads_member_id_idx
  on library.user_book_reads (member_id);

create table if not exists library.tbr_items (
  library_id uuid not null references library.libraries(id) on delete cascade,
  member_id uuid not null references library.library_members(id) on delete cascade,
  book_id uuid not null references library.books(id) on delete cascade,
  position integer not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (member_id, book_id),
  constraint tbr_items_position_check check (position > 0)
);

create unique index if not exists tbr_items_member_position_unique
  on library.tbr_items (member_id, position);

create index if not exists tbr_items_library_id_idx
  on library.tbr_items (library_id);

insert into library.user_book_reads (book_id, member_id, read_at)
select books.id, members.id, coalesce(books.updated_at, books.created_at, now())
from library.books
join library.library_members members
  on members.library_id = books.library_id
  and lower(members.email) = 'danerogerjenkins@gmail.com'
where books.read_by_dane is true
on conflict (book_id, member_id) do nothing;

insert into library.user_book_reads (book_id, member_id, read_at)
select books.id, members.id, coalesce(books.updated_at, books.created_at, now())
from library.books
join library.library_members members
  on members.library_id = books.library_id
  and lower(members.email) = 'ecsloan3@gmail.com'
where books.read_by_emma is true
on conflict (book_id, member_id) do nothing;

insert into library.tbr_items (library_id, member_id, book_id, position)
select
  members.library_id,
  members.id,
  queue.book_id,
  queue.position::integer
from library.reading_lists
join library.library_members members
  on lower(members.display_name) = library.reading_lists.reader_id
cross join lateral unnest(library.reading_lists.book_ids) with ordinality as queue(book_id, position)
join library.books
  on books.id = queue.book_id
  and books.library_id = members.library_id
on conflict (member_id, book_id) do update
set
  position = excluded.position,
  updated_at = now();

create or replace function library.current_library_member_id(p_library_id uuid)
returns uuid
language sql
stable
security definer
set search_path = library, auth, pg_temp
as $$
  select member.id
  from library.library_members member
  where member.library_id = p_library_id
    and member.user_id = (select auth.uid())
  limit 1;
$$;

create or replace function library.current_user_library_role(p_library_id uuid)
returns text
language sql
stable
security definer
set search_path = library, auth, pg_temp
as $$
  select member.role
  from library.library_members member
  where member.library_id = p_library_id
    and member.user_id = (select auth.uid())
  limit 1;
$$;

create or replace function library.current_user_can_edit_library(p_library_id uuid)
returns boolean
language sql
stable
security definer
set search_path = library, auth, pg_temp
as $$
  select exists (
    select 1
    from library.library_members member
    where member.library_id = p_library_id
      and member.user_id = (select auth.uid())
      and member.role in ('admin', 'editor')
  );
$$;

create or replace function library.current_user_can_edit_library()
returns boolean
language sql
stable
security definer
set search_path = library, auth, pg_temp
as $$
  select exists (
    select 1
    from library.library_members member
    where member.user_id = (select auth.uid())
      and member.role in ('admin', 'editor')
  );
$$;

create or replace function library.current_user_can_admin_library(p_library_id uuid)
returns boolean
language sql
stable
security definer
set search_path = library, auth, pg_temp
as $$
  select exists (
    select 1
    from library.library_members member
    where member.library_id = p_library_id
      and member.user_id = (select auth.uid())
      and member.role = 'admin'
  );
$$;

create or replace function library.current_user_can_create_library()
returns boolean
language sql
stable
security definer
set search_path = library, auth, pg_temp
as $$
  select exists (
    select 1
    from library.library_members member
    where member.user_id = (select auth.uid())
      and member.role = 'admin'
  );
$$;

create or replace function library.current_user_can_view_member_activity(p_library_id uuid)
returns boolean
language sql
stable
security definer
set search_path = library, auth, pg_temp
as $$
  select exists (
    select 1
    from library.library_members member
    where member.library_id = p_library_id
      and member.user_id = (select auth.uid())
      and member.can_view_member_activity
  );
$$;

revoke all on function library.current_library_member_id(uuid) from public;
revoke all on function library.current_user_library_role(uuid) from public;
revoke all on function library.current_user_can_edit_library(uuid) from public;
revoke all on function library.current_user_can_edit_library() from public;
revoke all on function library.current_user_can_admin_library(uuid) from public;
revoke all on function library.current_user_can_create_library() from public;
revoke all on function library.current_user_can_view_member_activity(uuid) from public;

grant execute on function library.current_library_member_id(uuid) to authenticated;
grant execute on function library.current_user_library_role(uuid) to authenticated;
grant execute on function library.current_user_can_edit_library(uuid) to authenticated;
grant execute on function library.current_user_can_edit_library() to authenticated;
grant execute on function library.current_user_can_admin_library(uuid) to authenticated;
grant execute on function library.current_user_can_create_library() to authenticated;
grant execute on function library.current_user_can_view_member_activity(uuid) to authenticated;

grant usage on schema library to anon, authenticated;

grant select on table library.libraries to anon, authenticated;
grant insert, update, delete on table library.libraries to authenticated;

grant select, insert, update, delete on table library.profiles to authenticated;
grant select, insert, update, delete on table library.library_members to authenticated;
grant select on table library.library_members to anon;

grant select on table library.user_book_reads to authenticated;
grant insert, update, delete on table library.user_book_reads to authenticated;

grant select on table library.tbr_items to authenticated;
grant insert, update, delete on table library.tbr_items to authenticated;

alter table library.libraries enable row level security;
alter table library.profiles enable row level security;
alter table library.library_members enable row level security;
alter table library.user_book_reads enable row level security;
alter table library.tbr_items enable row level security;

drop policy if exists "Anyone can read public libraries" on library.libraries;
drop policy if exists "Members can read their libraries" on library.libraries;
drop policy if exists "Admins can insert libraries" on library.libraries;
drop policy if exists "Admins can update their libraries" on library.libraries;
drop policy if exists "Admins can delete their libraries" on library.libraries;

create policy "Anyone can read public libraries"
on library.libraries
for select
to anon, authenticated
using (public_access_enabled);

create policy "Members can read their libraries"
on library.libraries
for select
to authenticated
using (library.current_library_member_id(id) is not null);

create policy "Admins can insert libraries"
on library.libraries
for insert
to authenticated
with check (library.current_user_can_create_library());

create policy "Admins can update their libraries"
on library.libraries
for update
to authenticated
using (library.current_user_can_admin_library(id))
with check (library.current_user_can_admin_library(id));

create policy "Admins can delete their libraries"
on library.libraries
for delete
to authenticated
using (library.current_user_can_admin_library(id));

drop policy if exists "Users can read own profile" on library.profiles;
drop policy if exists "Users can upsert own profile" on library.profiles;
drop policy if exists "Users can update own profile" on library.profiles;
drop policy if exists "Admins can read member profiles" on library.profiles;

create policy "Users can read own profile"
on library.profiles
for select
to authenticated
using (user_id = (select auth.uid()));

create policy "Users can upsert own profile"
on library.profiles
for insert
to authenticated
with check (user_id = (select auth.uid()));

create policy "Users can update own profile"
on library.profiles
for update
to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

create policy "Admins can read member profiles"
on library.profiles
for select
to authenticated
using (
  exists (
    select 1
    from library.library_members admin_member
    join library.library_members target_member
      on target_member.library_id = admin_member.library_id
    where admin_member.user_id = (select auth.uid())
      and admin_member.role = 'admin'
      and target_member.user_id = profiles.user_id
  )
);

drop policy if exists "Members can read visible members" on library.library_members;
drop policy if exists "Admins can insert members" on library.library_members;
drop policy if exists "Admins can update members" on library.library_members;
drop policy if exists "Admins can delete members" on library.library_members;

create policy "Members can read visible members"
on library.library_members
for select
to authenticated
using (
  user_id = (select auth.uid())
  or library.current_user_can_admin_library(library_id)
  or (
    can_view_member_activity
    and library.current_user_can_view_member_activity(library_id)
  )
);

create policy "Public can read public library display members"
on library.library_members
for select
to anon
using (
  can_view_member_activity
  and exists (
    select 1
    from library.libraries libraries
    where libraries.id = library_members.library_id
      and libraries.public_access_enabled
  )
);

create policy "Admins can insert members"
on library.library_members
for insert
to authenticated
with check (library.current_user_can_admin_library(library_id));

create policy "Admins can update members"
on library.library_members
for update
to authenticated
using (library.current_user_can_admin_library(library_id))
with check (library.current_user_can_admin_library(library_id));

create policy "Admins can delete members"
on library.library_members
for delete
to authenticated
using (library.current_user_can_admin_library(library_id));

drop policy if exists "Anyone can read active books" on library.books;
drop policy if exists "Library editors can insert books" on library.books;
drop policy if exists "Library editors can update books" on library.books;
drop policy if exists "Library editors can delete books" on library.books;

create policy "Anyone can read active public library books"
on library.books
for select
to anon, authenticated
using (
  deleted_at is null
  and exists (
    select 1
    from library.libraries libraries
    where libraries.id = books.library_id
      and libraries.public_access_enabled
  )
);

create policy "Members can read active library books"
on library.books
for select
to authenticated
using (
  deleted_at is null
  and library.current_library_member_id(library_id) is not null
);

create policy "Library editors can insert books"
on library.books
for insert
to authenticated
with check (library.current_user_can_edit_library(library_id));

create policy "Library editors can update books"
on library.books
for update
to authenticated
using (library.current_user_can_edit_library(library_id))
with check (library.current_user_can_edit_library(library_id));

create policy "Library editors can delete books"
on library.books
for delete
to authenticated
using (library.current_user_can_edit_library(library_id));

drop policy if exists "Anyone can read series" on library.series;
drop policy if exists "Library editors can insert series" on library.series;
drop policy if exists "Library editors can update series" on library.series;
drop policy if exists "Library editors can delete series" on library.series;

create policy "Anyone can read public library series"
on library.series
for select
to anon, authenticated
using (
  exists (
    select 1
    from library.libraries libraries
    where libraries.id = series.library_id
      and libraries.public_access_enabled
  )
);

create policy "Members can read library series"
on library.series
for select
to authenticated
using (library.current_library_member_id(library_id) is not null);

create policy "Library editors can insert series"
on library.series
for insert
to authenticated
with check (library.current_user_can_edit_library(library_id));

create policy "Library editors can update series"
on library.series
for update
to authenticated
using (library.current_user_can_edit_library(library_id))
with check (library.current_user_can_edit_library(library_id));

create policy "Library editors can delete series"
on library.series
for delete
to authenticated
using (library.current_user_can_edit_library(library_id));

drop policy if exists "Anyone can read book series" on library.book_series;
drop policy if exists "Library editors can insert book series" on library.book_series;
drop policy if exists "Library editors can update book series" on library.book_series;
drop policy if exists "Library editors can delete book series" on library.book_series;

create policy "Anyone can read visible book series"
on library.book_series
for select
to anon, authenticated
using (
  exists (
    select 1
    from library.books books
    where books.id = book_series.book_id
      and books.deleted_at is null
      and (
        exists (
          select 1
          from library.libraries libraries
          where libraries.id = books.library_id
            and libraries.public_access_enabled
        )
        or library.current_library_member_id(books.library_id) is not null
      )
  )
);

create policy "Library editors can insert book series"
on library.book_series
for insert
to authenticated
with check (
  exists (
    select 1
    from library.books books
    where books.id = book_series.book_id
      and library.current_user_can_edit_library(books.library_id)
  )
);

create policy "Library editors can update book series"
on library.book_series
for update
to authenticated
using (
  exists (
    select 1
    from library.books books
    where books.id = book_series.book_id
      and library.current_user_can_edit_library(books.library_id)
  )
)
with check (
  exists (
    select 1
    from library.books books
    where books.id = book_series.book_id
      and library.current_user_can_edit_library(books.library_id)
  )
);

create policy "Library editors can delete book series"
on library.book_series
for delete
to authenticated
using (
  exists (
    select 1
    from library.books books
    where books.id = book_series.book_id
      and library.current_user_can_edit_library(books.library_id)
  )
);

drop policy if exists "Members can read visible read status" on library.user_book_reads;
drop policy if exists "Members can insert own read status" on library.user_book_reads;
drop policy if exists "Members can update own read status" on library.user_book_reads;
drop policy if exists "Members can delete own read status" on library.user_book_reads;

create policy "Members can read visible read status"
on library.user_book_reads
for select
to authenticated
using (
  exists (
    select 1
    from library.books books
    join library.library_members target_member
      on target_member.id = user_book_reads.member_id
    where books.id = user_book_reads.book_id
      and books.library_id = target_member.library_id
      and (
        target_member.user_id = (select auth.uid())
        or library.current_user_can_admin_library(books.library_id)
        or (
          target_member.can_view_member_activity
          and library.current_user_can_view_member_activity(books.library_id)
        )
      )
  )
);

create policy "Members can insert own read status"
on library.user_book_reads
for insert
to authenticated
with check (
  exists (
    select 1
    from library.books books
    join library.library_members member
      on member.id = user_book_reads.member_id
    where books.id = user_book_reads.book_id
      and books.library_id = member.library_id
      and member.user_id = (select auth.uid())
  )
);

create policy "Members can update own read status"
on library.user_book_reads
for update
to authenticated
using (
  exists (
    select 1
    from library.library_members member
    where member.id = user_book_reads.member_id
      and member.user_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1
    from library.books books
    join library.library_members member
      on member.id = user_book_reads.member_id
    where books.id = user_book_reads.book_id
      and books.library_id = member.library_id
      and member.user_id = (select auth.uid())
  )
);

create policy "Members can delete own read status"
on library.user_book_reads
for delete
to authenticated
using (
  exists (
    select 1
    from library.library_members member
    where member.id = user_book_reads.member_id
      and member.user_id = (select auth.uid())
  )
);

drop policy if exists "Members can read visible tbr" on library.tbr_items;
drop policy if exists "Members can insert own tbr" on library.tbr_items;
drop policy if exists "Members can update own tbr" on library.tbr_items;
drop policy if exists "Members can delete own tbr" on library.tbr_items;

create policy "Members can read visible tbr"
on library.tbr_items
for select
to authenticated
using (
  exists (
    select 1
    from library.library_members target_member
    where target_member.id = tbr_items.member_id
      and target_member.library_id = tbr_items.library_id
      and (
        target_member.user_id = (select auth.uid())
        or library.current_user_can_admin_library(tbr_items.library_id)
        or (
          target_member.can_view_member_activity
          and library.current_user_can_view_member_activity(tbr_items.library_id)
        )
      )
  )
);

create policy "Members can insert own tbr"
on library.tbr_items
for insert
to authenticated
with check (
  exists (
    select 1
    from library.books books
    join library.library_members member
      on member.id = tbr_items.member_id
    where books.id = tbr_items.book_id
      and books.library_id = tbr_items.library_id
      and member.library_id = tbr_items.library_id
      and member.user_id = (select auth.uid())
  )
);

create policy "Members can update own tbr"
on library.tbr_items
for update
to authenticated
using (
  exists (
    select 1
    from library.library_members member
    where member.id = tbr_items.member_id
      and member.user_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1
    from library.books books
    join library.library_members member
      on member.id = tbr_items.member_id
    where books.id = tbr_items.book_id
      and books.library_id = tbr_items.library_id
      and member.library_id = tbr_items.library_id
      and member.user_id = (select auth.uid())
  )
);

create policy "Members can delete own tbr"
on library.tbr_items
for delete
to authenticated
using (
  exists (
    select 1
    from library.library_members member
    where member.id = tbr_items.member_id
      and member.user_id = (select auth.uid())
  )
);

create or replace view library.books_with_series
with (security_invoker = true) as
select
  b.id,
  b.title,
  b.author,
  b.genre,
  b.finished,
  b.cover_url,
  b.created_at,
  b.updated_at,
  b.isbn,
  b.read_by_dane,
  b.read_by_emma,
  b.description,
  b.format,
  b.deleted_at,
  b.ownership_status,
  s.id as series_id,
  s.name as series_name,
  bs.series_label,
  bs.series_sort,
  b.most_wanted,
  b.published_year,
  b.cover_drive_file_id,
  b.pages,
  b.library_id
from library.books b
left join library.book_series bs
  on bs.book_id = b.id
left join library.series s
  on s.id = bs.series_id;

revoke all on table library.books_with_series from anon;
revoke all on table library.books_with_series from authenticated;
grant select on table library.books_with_series to anon, authenticated;

drop policy if exists "Library editors can insert book cover objects" on storage.objects;
drop policy if exists "Library editors can update book cover objects" on storage.objects;
drop policy if exists "Library editors can delete book cover objects" on storage.objects;

create policy "Library editors can insert book cover objects"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'book-covers'
  and (storage.foldername(name))[1] = 'covers'
  and library.current_user_can_edit_library()
);

create policy "Library editors can update book cover objects"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'book-covers'
  and (storage.foldername(name))[1] = 'covers'
  and library.current_user_can_edit_library()
)
with check (
  bucket_id = 'book-covers'
  and (storage.foldername(name))[1] = 'covers'
  and library.current_user_can_edit_library()
);

create policy "Library editors can delete book cover objects"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'book-covers'
  and (storage.foldername(name))[1] = 'covers'
  and library.current_user_can_edit_library()
);
