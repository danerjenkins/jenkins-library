alter table library.library_members
add column if not exists can_view_ratings_reviews boolean not null default true;

drop policy if exists "Members can read visible members" on library.library_members;

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
  or (
    can_view_ratings_reviews
    and library.current_library_member_id(library_id) is not null
  )
);

create table if not exists library.user_book_reviews (
  book_id uuid not null references library.books(id) on delete cascade,
  member_id uuid not null references library.library_members(id) on delete cascade,
  rating integer not null,
  review text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (book_id, member_id),
  constraint user_book_reviews_rating_check check (rating between 1 and 5)
);

create index if not exists user_book_reviews_book_id_idx
  on library.user_book_reviews (book_id);

create index if not exists user_book_reviews_member_id_idx
  on library.user_book_reviews (member_id);

create index if not exists user_book_reviews_updated_at_idx
  on library.user_book_reviews (updated_at desc);

alter table library.user_book_reviews enable row level security;

grant select, insert, update, delete on table library.user_book_reviews to authenticated;
grant select, insert, update, delete on table library.user_book_reviews to service_role;

drop policy if exists "Members can read visible reviews" on library.user_book_reviews;
drop policy if exists "Members can insert own reviews" on library.user_book_reviews;
drop policy if exists "Members can update own reviews" on library.user_book_reviews;
drop policy if exists "Members can delete own reviews" on library.user_book_reviews;

create policy "Members can read visible reviews"
on library.user_book_reviews
for select
to authenticated
using (
  exists (
    select 1
    from library.books books
    join library.library_members target_member
      on target_member.id = user_book_reviews.member_id
    join library.library_members viewer_member
      on viewer_member.library_id = books.library_id
      and viewer_member.user_id = (select auth.uid())
    where books.id = user_book_reviews.book_id
      and books.library_id = target_member.library_id
      and (
        target_member.user_id = (select auth.uid())
        or library.current_user_can_admin_library(books.library_id)
        or target_member.can_view_ratings_reviews
      )
  )
);

create policy "Members can insert own reviews"
on library.user_book_reviews
for insert
to authenticated
with check (
  exists (
    select 1
    from library.books books
    join library.library_members member
      on member.id = user_book_reviews.member_id
    where books.id = user_book_reviews.book_id
      and books.library_id = member.library_id
      and member.user_id = (select auth.uid())
  )
);

create policy "Members can update own reviews"
on library.user_book_reviews
for update
to authenticated
using (
  exists (
    select 1
    from library.library_members member
    where member.id = user_book_reviews.member_id
      and member.user_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1
    from library.books books
    join library.library_members member
      on member.id = user_book_reviews.member_id
    where books.id = user_book_reviews.book_id
      and books.library_id = member.library_id
      and member.user_id = (select auth.uid())
  )
);

create policy "Members can delete own reviews"
on library.user_book_reviews
for delete
to authenticated
using (
  exists (
    select 1
    from library.library_members member
    where member.id = user_book_reviews.member_id
      and member.user_id = (select auth.uid())
  )
);
