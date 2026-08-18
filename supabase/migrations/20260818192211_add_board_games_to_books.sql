alter table library.books
  add column if not exists media_type text not null default 'book',
  add column if not exists publisher text null,
  add column if not exists min_players integer null,
  add column if not exists max_players integer null,
  add column if not exists play_time_minutes integer null,
  add column if not exists min_age integer null,
  add column if not exists complexity numeric(3,1) null,
  add column if not exists category text null;

alter table library.books
  drop constraint if exists books_media_type_check,
  add constraint books_media_type_check check (media_type in ('book', 'board_game'));

alter table library.books
  drop constraint if exists books_board_game_players_check,
  add constraint books_board_game_players_check check (
    (min_players is null or min_players > 0)
    and (max_players is null or max_players > 0)
    and (min_players is null or max_players is null or max_players >= min_players)
  );

alter table library.books
  drop constraint if exists books_board_game_play_time_check,
  add constraint books_board_game_play_time_check check (
    play_time_minutes is null or play_time_minutes > 0
  );

alter table library.books
  drop constraint if exists books_board_game_min_age_check,
  add constraint books_board_game_min_age_check check (
    min_age is null or min_age >= 0
  );

alter table library.books
  drop constraint if exists books_board_game_complexity_check,
  add constraint books_board_game_complexity_check check (
    complexity is null or (complexity >= 1 and complexity <= 5)
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
  b.library_id,
  b.media_type,
  b.publisher,
  b.min_players,
  b.max_players,
  b.play_time_minutes,
  b.min_age,
  b.complexity,
  b.category
from library.books b
left join library.book_series bs
  on bs.book_id = b.id
left join library.series s
  on s.id = bs.series_id;

revoke all on table library.books_with_series from anon;
revoke all on table library.books_with_series from authenticated;
grant select on table library.books_with_series to anon, authenticated;

insert into library.books (
  library_id,
  title,
  author,
  genre,
  description,
  ownership_status,
  media_type,
  publisher,
  min_players,
  max_players,
  play_time_minutes,
  min_age,
  complexity,
  category
)
select
  libraries.id,
  seed.title,
  seed.author,
  seed.category,
  seed.description,
  'owned',
  'board_game',
  seed.publisher,
  seed.min_players,
  seed.max_players,
  seed.play_time_minutes,
  seed.min_age,
  seed.complexity,
  seed.category
from library.libraries libraries
cross join (
  values
    (
      'Settlers of Catan',
      'Klaus Teuber',
      'Catan Studio',
      3,
      4,
      60,
      10,
      2.3::numeric,
      'Strategy',
      'Trade, build, and settle the island of Catan while competing for victory points.'
    ),
    (
      'Chess',
      'Traditional',
      null,
      2,
      2,
      30,
      6,
      3.7::numeric,
      'Abstract Strategy',
      'Classic two-player abstract strategy game focused on tactics, planning, and checkmate.'
    )
) as seed(
  title,
  author,
  publisher,
  min_players,
  max_players,
  play_time_minutes,
  min_age,
  complexity,
  category,
  description
)
where libraries.slug = 'jenkins'
  and not exists (
    select 1
    from library.books existing
    where existing.library_id = libraries.id
      and lower(existing.title) = lower(seed.title)
      and existing.media_type = 'board_game'
      and existing.deleted_at is null
  );
