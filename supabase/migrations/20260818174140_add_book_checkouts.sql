create table if not exists library.book_checkouts (
  id uuid primary key default gen_random_uuid(),
  library_id uuid not null references library.libraries(id) on delete cascade,
  book_id uuid not null references library.books(id) on delete cascade,
  borrower_member_id uuid null references library.library_members(id) on delete set null,
  borrower_name text not null,
  checked_out_at timestamptz not null default now(),
  returned_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint book_checkouts_borrower_name_check check (length(btrim(borrower_name)) > 0),
  constraint book_checkouts_returned_after_checkout_check check (
    returned_at is null or returned_at >= checked_out_at
  )
);

create unique index if not exists book_checkouts_one_active_per_book
  on library.book_checkouts (book_id)
  where returned_at is null;

create index if not exists book_checkouts_library_active_idx
  on library.book_checkouts (library_id, checked_out_at desc)
  where returned_at is null;

create index if not exists book_checkouts_borrower_member_id_idx
  on library.book_checkouts (borrower_member_id)
  where borrower_member_id is not null;

alter table library.book_checkouts enable row level security;

grant select, insert, update, delete on table library.book_checkouts to authenticated;
grant select, insert, update, delete on table library.book_checkouts to service_role;

drop policy if exists "Library editors can read checkouts" on library.book_checkouts;
drop policy if exists "Library editors can insert checkouts" on library.book_checkouts;
drop policy if exists "Library editors can update checkouts" on library.book_checkouts;
drop policy if exists "Library editors can delete checkouts" on library.book_checkouts;

create policy "Library editors can read checkouts"
on library.book_checkouts
for select
to authenticated
using (library.current_user_can_edit_library(library_id));

create policy "Library editors can insert checkouts"
on library.book_checkouts
for insert
to authenticated
with check (
  library.current_user_can_edit_library(library_id)
  and exists (
    select 1
    from library.books books
    where books.id = book_checkouts.book_id
      and books.library_id = book_checkouts.library_id
      and books.deleted_at is null
      and coalesce(books.ownership_status, 'owned') = 'owned'
  )
  and (
    borrower_member_id is null
    or exists (
      select 1
      from library.library_members members
      where members.id = book_checkouts.borrower_member_id
        and members.library_id = book_checkouts.library_id
    )
  )
);

create policy "Library editors can update checkouts"
on library.book_checkouts
for update
to authenticated
using (library.current_user_can_edit_library(library_id))
with check (
  library.current_user_can_edit_library(library_id)
  and exists (
    select 1
    from library.books books
    where books.id = book_checkouts.book_id
      and books.library_id = book_checkouts.library_id
      and books.deleted_at is null
  )
  and (
    borrower_member_id is null
    or exists (
      select 1
      from library.library_members members
      where members.id = book_checkouts.borrower_member_id
        and members.library_id = book_checkouts.library_id
    )
  )
);

create policy "Library editors can delete checkouts"
on library.book_checkouts
for delete
to authenticated
using (library.current_user_can_edit_library(library_id));
