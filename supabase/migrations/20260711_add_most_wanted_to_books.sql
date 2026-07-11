alter table library.books
  add column if not exists most_wanted boolean not null default false;

create or replace view library.books_with_series as
select
  books.id,
  books.title,
  books.author,
  books.genre,
  books.description,
  books.isbn,
  books.published_year,
  books.cover_url,
  books.cover_drive_file_id,
  books.finished,
  books.format,
  books.pages,
  books.read_by_dane,
  books.read_by_emma,
  books.ownership_status,
  books.created_at,
  books.updated_at,
  books.deleted_at,
  book_series.series_id,
  series.name as series_name,
  book_series.series_label,
  book_series.series_sort,
  books.most_wanted
from library.books
left join library.book_series
  on book_series.book_id = books.id
left join library.series
  on series.id = book_series.series_id;

grant select on library.books_with_series to anon;
