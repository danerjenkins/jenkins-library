create table if not exists library.library_editors (
  user_id uuid primary key references auth.users(id) on delete cascade,
  label text null,
  created_at timestamptz not null default now()
);

alter table library.library_editors enable row level security;

revoke all on table library.library_editors from anon;
revoke all on table library.library_editors from authenticated;
grant select, insert, update, delete on table library.library_editors to service_role;

create or replace function library.current_user_can_edit_library()
returns boolean
language sql
stable
security definer
set search_path = library, auth, pg_temp
as $$
  select exists (
    select 1
    from library.library_editors editor
    where editor.user_id = auth.uid()
  );
$$;

revoke all on function library.current_user_can_edit_library() from public;
revoke all on function library.current_user_can_edit_library() from anon;
grant execute on function library.current_user_can_edit_library() to authenticated;

alter table library.books enable row level security;
alter table library.series enable row level security;
alter table library.book_series enable row level security;
alter table library.reading_lists enable row level security;

grant usage on schema library to anon, authenticated;

revoke insert, update, delete on table library.books from anon;
revoke insert, update, delete on table library.series from anon;
revoke insert, update, delete on table library.book_series from anon;
revoke all on table library.reading_lists from anon;

grant select on table library.books to anon, authenticated;
grant select on table library.series to anon, authenticated;
grant select on table library.book_series to anon, authenticated;
grant select, insert, update, delete on table library.reading_lists to authenticated;

grant insert, update, delete on table library.books to authenticated;
grant insert, update, delete on table library.series to authenticated;
grant insert, update, delete on table library.book_series to authenticated;

drop policy if exists "books_delete" on library.books;
drop policy if exists "books_delete_auth" on library.books;
drop policy if exists "books_insert" on library.books;
drop policy if exists "books_insert_auth" on library.books;
drop policy if exists "books_select" on library.books;
drop policy if exists "books_select_auth" on library.books;
drop policy if exists "books_update" on library.books;
drop policy if exists "books_update_auth" on library.books;
drop policy if exists "read books" on library.books;

drop policy if exists "delete series" on library.series;
drop policy if exists "insert series" on library.series;
drop policy if exists "read series" on library.series;
drop policy if exists "update series" on library.series;

drop policy if exists "book_series_delete_all" on library.book_series;
drop policy if exists "book_series_insert_all" on library.book_series;
drop policy if exists "book_series_read_all" on library.book_series;
drop policy if exists "book_series_update_all" on library.book_series;
drop policy if exists "read book_series" on library.book_series;

drop policy if exists "Allow anon delete reading lists" on library.reading_lists;
drop policy if exists "Allow anon insert reading lists" on library.reading_lists;
drop policy if exists "Allow anon read reading lists" on library.reading_lists;
drop policy if exists "Allow anon update reading lists" on library.reading_lists;

create policy "Anyone can read active books"
on library.books
for select
to anon, authenticated
using (deleted_at is null);

create policy "Library editors can insert books"
on library.books
for insert
to authenticated
with check (library.current_user_can_edit_library());

create policy "Library editors can update books"
on library.books
for update
to authenticated
using (library.current_user_can_edit_library())
with check (library.current_user_can_edit_library());

create policy "Library editors can delete books"
on library.books
for delete
to authenticated
using (library.current_user_can_edit_library());

create policy "Anyone can read series"
on library.series
for select
to anon, authenticated
using (true);

create policy "Library editors can insert series"
on library.series
for insert
to authenticated
with check (library.current_user_can_edit_library());

create policy "Library editors can update series"
on library.series
for update
to authenticated
using (library.current_user_can_edit_library())
with check (library.current_user_can_edit_library());

create policy "Library editors can delete series"
on library.series
for delete
to authenticated
using (library.current_user_can_edit_library());

create policy "Anyone can read book series"
on library.book_series
for select
to anon, authenticated
using (true);

create policy "Library editors can insert book series"
on library.book_series
for insert
to authenticated
with check (library.current_user_can_edit_library());

create policy "Library editors can update book series"
on library.book_series
for update
to authenticated
using (library.current_user_can_edit_library())
with check (library.current_user_can_edit_library());

create policy "Library editors can delete book series"
on library.book_series
for delete
to authenticated
using (library.current_user_can_edit_library());

create policy "Library editors can read reading lists"
on library.reading_lists
for select
to authenticated
using (library.current_user_can_edit_library());

create policy "Library editors can insert reading lists"
on library.reading_lists
for insert
to authenticated
with check (library.current_user_can_edit_library());

create policy "Library editors can update reading lists"
on library.reading_lists
for update
to authenticated
using (library.current_user_can_edit_library())
with check (library.current_user_can_edit_library());

create policy "Library editors can delete reading lists"
on library.reading_lists
for delete
to authenticated
using (library.current_user_can_edit_library());

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
  b.most_wanted
from library.books b
left join library.book_series bs
  on bs.book_id = b.id
left join library.series s
  on s.id = bs.series_id;

revoke all on table library.books_with_series from anon;
revoke all on table library.books_with_series from authenticated;
grant select on table library.books_with_series to anon, authenticated;

drop policy if exists "Allow anon read book cover objects" on storage.objects;
drop policy if exists "Allow public read book cover objects" on storage.objects;
drop policy if exists "Allow anon insert book cover objects" on storage.objects;
drop policy if exists "Allow anon update book cover objects" on storage.objects;
drop policy if exists "Allow anon delete book cover objects" on storage.objects;
drop policy if exists "Library editors can insert book cover objects" on storage.objects;
drop policy if exists "Library editors can update book cover objects" on storage.objects;
drop policy if exists "Library editors can delete book cover objects" on storage.objects;

create policy "Allow public read book cover objects"
on storage.objects
for select
to anon, authenticated
using (
  bucket_id = 'book-covers'
  and (storage.foldername(name))[1] = 'covers'
);

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
