-- Public book-series reads evaluate this helper in an RLS policy. For anon
-- requests auth.uid() is null, so the function returns no member ID.
grant execute on function library.current_library_member_id(uuid) to anon;
