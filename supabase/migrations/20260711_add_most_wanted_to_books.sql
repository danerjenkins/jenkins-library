alter table library.books
  add column if not exists most_wanted boolean not null default false;

create or replace view library.books_with_series as
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

grant select on library.books_with_series to anon;
