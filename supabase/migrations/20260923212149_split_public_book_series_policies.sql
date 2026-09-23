drop policy if exists "Anyone can read visible book series" on library.book_series;

create policy "Anyone can read public book series"
on library.book_series
for select
to anon
using (
  exists (
    select 1
    from library.books books
    join library.libraries libraries
      on libraries.id = books.library_id
    where books.id = book_series.book_id
      and books.deleted_at is null
      and libraries.public_access_enabled
  )
);

create policy "Members can read visible book series"
on library.book_series
for select
to authenticated
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
