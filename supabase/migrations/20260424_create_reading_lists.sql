create table if not exists library.reading_lists (
  reader_id text primary key,
  book_ids uuid[] not null default '{}'::uuid[],
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint reading_lists_reader_id_check check (reader_id in ('dane', 'emma'))
);

grant usage on schema library to anon;
grant select, insert, update, delete on table library.reading_lists to anon;

alter table library.reading_lists enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'library'
      and tablename = 'reading_lists'
      and policyname = 'Allow anon read reading lists'
  ) then
    create policy "Allow anon read reading lists"
      on library.reading_lists
      for select
      to anon
      using (true);
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'library'
      and tablename = 'reading_lists'
      and policyname = 'Allow anon insert reading lists'
  ) then
    create policy "Allow anon insert reading lists"
      on library.reading_lists
      for insert
      to anon
      with check (true);
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'library'
      and tablename = 'reading_lists'
      and policyname = 'Allow anon update reading lists'
  ) then
    create policy "Allow anon update reading lists"
      on library.reading_lists
      for update
      to anon
      using (true)
      with check (true);
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'library'
      and tablename = 'reading_lists'
      and policyname = 'Allow anon delete reading lists'
  ) then
    create policy "Allow anon delete reading lists"
      on library.reading_lists
      for delete
      to anon
      using (true);
  end if;
end $$;
