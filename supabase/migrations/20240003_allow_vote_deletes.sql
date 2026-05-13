-- Allow users to clear their saved votes when all allocations are removed.

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'votes'
      and policyname = 'public delete votes'
  ) then
    create policy "public delete votes"
      on public.votes
      for delete
      using (true);
  end if;
end $$;
