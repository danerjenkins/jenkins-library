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
  b.pages
from library.books b
left join library.book_series bs
  on bs.book_id = b.id
left join library.series s
  on s.id = bs.series_id;

revoke all on table library.books_with_series from anon;
revoke all on table library.books_with_series from authenticated;
grant select on table library.books_with_series to anon, authenticated;
