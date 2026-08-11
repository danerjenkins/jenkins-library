insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'book-covers',
  'book-covers',
  true,
  10485760,
  array[
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/heic',
    'image/heif',
    'image/gif'
  ]
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'Allow public read book cover objects'
  ) then
    create policy "Allow public read book cover objects"
      on storage.objects
      for select
      to anon, authenticated
      using (
        bucket_id = 'book-covers'
        and (storage.foldername(name))[1] = 'covers'
      );
  end if;
end $$;
