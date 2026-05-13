-- Allow anyone with the public app key to edit ideas.
-- This matches the existing public add/delete room behavior.

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'ideas'
      and policyname = 'public update ideas'
  ) then
    create policy "public update ideas"
      on public.ideas
      for update
      using (true)
      with check (true);
  end if;
end $$;
