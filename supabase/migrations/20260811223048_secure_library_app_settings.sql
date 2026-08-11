do $$
begin
  if to_regclass('library.app_settings') is not null then
    execute 'alter table library.app_settings enable row level security';
    execute 'revoke all on table library.app_settings from anon';
    execute 'revoke all on table library.app_settings from authenticated';
    execute 'grant select, insert, update, delete on table library.app_settings to authenticated';

    execute 'drop policy if exists "Library editors can read app settings" on library.app_settings';
    execute 'drop policy if exists "Library editors can insert app settings" on library.app_settings';
    execute 'drop policy if exists "Library editors can update app settings" on library.app_settings';
    execute 'drop policy if exists "Library editors can delete app settings" on library.app_settings';

    execute 'create policy "Library editors can read app settings" on library.app_settings for select to authenticated using (library.current_user_can_edit_library())';
    execute 'create policy "Library editors can insert app settings" on library.app_settings for insert to authenticated with check (library.current_user_can_edit_library())';
    execute 'create policy "Library editors can update app settings" on library.app_settings for update to authenticated using (library.current_user_can_edit_library()) with check (library.current_user_can_edit_library())';
    execute 'create policy "Library editors can delete app settings" on library.app_settings for delete to authenticated using (library.current_user_can_edit_library())';
  end if;
end $$;
