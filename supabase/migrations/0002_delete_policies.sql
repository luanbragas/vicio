-- Faltava policy de delete: sem ela o RLS bloqueia silenciosamente
-- (delete "funciona" mas afeta 0 linhas, sem erro nenhum).

create policy "desafios_delete" on public.desafios
  for delete using (auth.uid() = any(participantes));

create policy "checkins_delete" on public.checkins
  for delete using (
    exists (select 1 from public.desafios d where d.id = desafio_id and auth.uid() = any(d.participantes))
  );
