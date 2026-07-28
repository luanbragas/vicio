-- Strike: schema inicial no Supabase (substitui Firestore)

create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  nome text,
  email text unique not null,
  foto_perfil text,
  amigos uuid[] not null default '{}',
  streak_atual int not null default 0,
  total_checkins int not null default 0,
  taxa_aprovacao int not null default 100,
  criado_em timestamptz not null default now()
);

create table public.desafios (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  participantes uuid[] not null,
  criado_por uuid not null,
  aceitos uuid[] not null default '{}',
  duracao_dias int,
  aposta text,
  status text not null default 'pendente',
  streak_atual_por_usuario jsonb not null default '{}',
  streak_freezes jsonb not null default '{}',
  streak_freezes_usados jsonb not null default '{}',
  criado_em timestamptz not null default now()
);

create table public.checkins (
  id uuid primary key default gen_random_uuid(),
  desafio_id uuid not null references public.desafios(id) on delete cascade,
  user_id uuid not null,
  foto_url text,
  horario_inicio timestamptz,
  horario_fim timestamptz,
  duracao_minutos int,
  status text not null default 'pendente',
  avaliado_por uuid,
  motivo_reprovacao text,
  avaliado_em timestamptz,
  criado_em timestamptz not null default now()
);

create table public.convites (
  id uuid primary key default gen_random_uuid(),
  de uuid not null,
  para_email text not null,
  status text not null default 'pendente',
  criado_em timestamptz not null default now()
);

alter table public.users enable row level security;
alter table public.desafios enable row level security;
alter table public.checkins enable row level security;
alter table public.convites enable row level security;

-- users: leitura livre pra autenticado, escrita só do próprio
create policy "users_select" on public.users
  for select using (auth.uid() is not null);

create policy "users_update_self" on public.users
  for update using (auth.uid() = id) with check (auth.uid() = id);

-- desafios: participante pode ler/atualizar; criar exige ser participante
create policy "desafios_select" on public.desafios
  for select using (auth.uid() = any(participantes));

create policy "desafios_insert" on public.desafios
  for insert with check (auth.uid() = criado_por and auth.uid() = any(participantes));

create policy "desafios_update" on public.desafios
  for update using (auth.uid() = any(participantes));

-- checkins: só participante do desafio pai
create policy "checkins_select" on public.checkins
  for select using (
    exists (select 1 from public.desafios d where d.id = desafio_id and auth.uid() = any(d.participantes))
  );

create policy "checkins_insert" on public.checkins
  for insert with check (
    exists (select 1 from public.desafios d where d.id = desafio_id and auth.uid() = any(d.participantes))
  );

create policy "checkins_update" on public.checkins
  for update using (
    exists (select 1 from public.desafios d where d.id = desafio_id and auth.uid() = any(d.participantes))
  );

-- convites: dono ou destinatário (por email) pode ler; só quem convida cria; sem update direto (via RPC accept_convite)
create policy "convites_select" on public.convites
  for select using (de = auth.uid() or para_email = (auth.jwt() ->> 'email'));

create policy "convites_insert" on public.convites
  for insert with check (de = auth.uid() and para_email <> (auth.jwt() ->> 'email'));

-- cria a linha em public.users automaticamente no signup (substitui ensureUserDoc)
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, nome, email, foto_perfil)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'nome', split_part(new.email, '@', 1)),
    new.email,
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- aceitar convite de amizade + atualizar os dois lados, atomicamente
create function public.accept_convite(convite_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_de uuid;
  v_para_email text;
  v_status text;
begin
  select de, para_email, status into v_de, v_para_email, v_status
  from public.convites where id = convite_id;

  if v_status is null then
    raise exception 'convite não encontrado';
  end if;

  if v_status <> 'pendente' or v_para_email <> (auth.jwt() ->> 'email') then
    raise exception 'convite inválido';
  end if;

  update public.users set amigos = array_append(amigos, v_de)
    where id = auth.uid() and not (v_de = any(amigos));
  update public.users set amigos = array_append(amigos, auth.uid())
    where id = v_de and not (auth.uid() = any(amigos));
  update public.convites set status = 'aceito' where id = convite_id;
end;
$$;

-- habilita Realtime (postgres_changes) nessas tabelas — sem isso o padrão
-- "refetch on change" do client não recebe nenhum evento
alter publication supabase_realtime add table public.users;
alter publication supabase_realtime add table public.desafios;
alter publication supabase_realtime add table public.checkins;
alter publication supabase_realtime add table public.convites;

-- storage buckets + policies
insert into storage.buckets (id, name, public) values ('checkins', 'checkins', true);
insert into storage.buckets (id, name, public) values ('perfis', 'perfis', true);

create policy "checkins_write" on storage.objects
  for insert with check (bucket_id = 'checkins' and auth.role() = 'authenticated');

create policy "perfis_write" on storage.objects
  for insert with check (bucket_id = 'perfis' and auth.uid()::text = split_part(name, '.', 1));
