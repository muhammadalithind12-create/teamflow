-- ============================================================================
-- TeamFlow — multi-tenant Kanban schema with RLS tenant isolation
-- Run this file in the Supabase SQL editor (project "portfolio-backend").
-- Idempotent: safe to re-run.
-- ============================================================================

-- Extensions
create extension if not exists "pgcrypto";

-- ----------------------------------------------------------------------------
-- Tables
-- ----------------------------------------------------------------------------

-- Tenants
create table if not exists tf_workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  created_at timestamptz not null default now()
);

-- Memberships: which auth users belong to which workspace.
-- user_id is nullable so the public demo workspace needs no login.
create table if not exists tf_members (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references tf_workspaces(id) on delete cascade,
  user_id uuid,
  role text not null default 'member' check (role in ('owner', 'member')),
  created_at timestamptz not null default now(),
  unique (workspace_id, user_id)
);

-- Boards belong to exactly one workspace (tenant)
create table if not exists tf_boards (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references tf_workspaces(id) on delete cascade,
  title text not null,
  created_at timestamptz not null default now()
);

-- Columns belong to exactly one board
create table if not exists tf_columns (
  id uuid primary key default gen_random_uuid(),
  board_id uuid not null references tf_boards(id) on delete cascade,
  title text not null,
  position int not null default 0,
  created_at timestamptz not null default now()
);

-- Cards. board_id is denormalized so RLS can scope cards without
-- an extra join through tf_columns.
create table if not exists tf_cards (
  id uuid primary key default gen_random_uuid(),
  column_id uuid not null references tf_columns(id) on delete cascade,
  board_id uuid not null references tf_boards(id) on delete cascade,
  title text not null,
  description text not null default '',
  assignee text not null default '',
  labels text[] not null default '{}',
  position double precision not null default 0,
  created_at timestamptz not null default now()
);

-- Helpful indexes
create index if not exists tf_columns_board_idx on tf_columns (board_id, position);
create index if not exists tf_cards_column_idx on tf_cards (column_id, position);
create index if not exists tf_cards_board_idx on tf_cards (board_id);
create index if not exists tf_members_workspace_idx on tf_members (workspace_id);
create index if not exists tf_members_user_idx on tf_members (user_id);
create index if not exists tf_boards_workspace_idx on tf_boards (workspace_id);

-- ----------------------------------------------------------------------------
-- Helper functions (SECURITY DEFINER so policies never recurse into RLS)
-- ----------------------------------------------------------------------------

create or replace function tf_is_member(ws_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from tf_members
    where workspace_id = ws_id
      and user_id = auth.uid()
  );
$$;

create or replace function tf_is_demo_workspace(ws_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from tf_workspaces
    where id = ws_id and slug = 'demo'
  );
$$;

-- ----------------------------------------------------------------------------
-- Row Level Security
--
-- Model:
--   * The workspace with slug = 'demo' is PUBLIC: anyone (anon included) can
--     read it, and anyone can read/write its boards, columns and cards.
--     This powers the no-login live demo at /board.
--   * Every other workspace is fully isolated: only authenticated members
--     (tf_members) can touch its rows. Tenant A can never see Tenant B.
-- ----------------------------------------------------------------------------

alter table tf_workspaces enable row level security;
alter table tf_members   enable row level security;
alter table tf_boards    enable row level security;
alter table tf_columns   enable row level security;
alter table tf_cards     enable row level security;

-- tf_workspaces ---------------------------------------------------------------
drop policy if exists tf_workspaces_select on tf_workspaces;
create policy tf_workspaces_select on tf_workspaces
  for select
  using (slug = 'demo' or tf_is_member(id));

drop policy if exists tf_workspaces_insert on tf_workspaces;
create policy tf_workspaces_insert on tf_workspaces
  for insert
  with check (auth.uid() is not null);

drop policy if exists tf_workspaces_update on tf_workspaces;
create policy tf_workspaces_update on tf_workspaces
  for update
  using (tf_is_member(id))
  with check (tf_is_member(id));

drop policy if exists tf_workspaces_delete on tf_workspaces;
create policy tf_workspaces_delete on tf_workspaces
  for delete
  using (tf_is_member(id));

-- tf_members ------------------------------------------------------------------
drop policy if exists tf_members_select on tf_members;
create policy tf_members_select on tf_members
  for select
  using (tf_is_demo_workspace(workspace_id) or tf_is_member(workspace_id));

drop policy if exists tf_members_write on tf_members;
create policy tf_members_write on tf_members
  for all
  using (tf_is_member(workspace_id))
  with check (tf_is_member(workspace_id));

-- tf_boards -------------------------------------------------------------------
drop policy if exists tf_boards_select on tf_boards;
create policy tf_boards_select on tf_boards
  for select
  using (tf_is_demo_workspace(workspace_id) or tf_is_member(workspace_id));

drop policy if exists tf_boards_write on tf_boards;
create policy tf_boards_write on tf_boards
  for all
  using (tf_is_demo_workspace(workspace_id) or tf_is_member(workspace_id))
  with check (tf_is_demo_workspace(workspace_id) or tf_is_member(workspace_id));

-- tf_columns (scoped through their board's workspace) --------------------------
drop policy if exists tf_columns_select on tf_columns;
create policy tf_columns_select on tf_columns
  for select
  using (
    exists (
      select 1 from tf_boards b
      where b.id = tf_columns.board_id
        and (tf_is_demo_workspace(b.workspace_id) or tf_is_member(b.workspace_id))
    )
  );

drop policy if exists tf_columns_write on tf_columns;
create policy tf_columns_write on tf_columns
  for all
  using (
    exists (
      select 1 from tf_boards b
      where b.id = tf_columns.board_id
        and (tf_is_demo_workspace(b.workspace_id) or tf_is_member(b.workspace_id))
    )
  )
  with check (
    exists (
      select 1 from tf_boards b
      where b.id = tf_columns.board_id
        and (tf_is_demo_workspace(b.workspace_id) or tf_is_member(b.workspace_id))
    )
  );

-- tf_cards (board_id is denormalized for a join-free policy) --------------------
drop policy if exists tf_cards_select on tf_cards;
create policy tf_cards_select on tf_cards
  for select
  using (
    exists (
      select 1 from tf_boards b
      where b.id = tf_cards.board_id
        and (tf_is_demo_workspace(b.workspace_id) or tf_is_member(b.workspace_id))
    )
  );

drop policy if exists tf_cards_write on tf_cards;
create policy tf_cards_write on tf_cards
  for all
  using (
    exists (
      select 1 from tf_boards b
      where b.id = tf_cards.board_id
        and (tf_is_demo_workspace(b.workspace_id) or tf_is_member(b.workspace_id))
    )
  )
  with check (
    exists (
      select 1 from tf_boards b
      where b.id = tf_cards.board_id
        and (tf_is_demo_workspace(b.workspace_id) or tf_is_member(b.workspace_id))
    )
  );

-- ----------------------------------------------------------------------------
-- Grants: table privileges are checked BEFORE RLS policies, so the anon and
-- authenticated roles need explicit grants (RLS then narrows what they can do).
-- ----------------------------------------------------------------------------

grant usage on schema public to anon, authenticated;

grant select, insert, update, delete on tf_workspaces to anon, authenticated;
grant select, insert, update, delete on tf_members   to anon, authenticated;
grant select, insert, update, delete on tf_boards    to anon, authenticated;
grant select, insert, update, delete on tf_columns   to anon, authenticated;
grant select, insert, update, delete on tf_cards     to anon, authenticated;

grant execute on function tf_is_member(uuid) to anon, authenticated;
grant execute on function tf_is_demo_workspace(uuid) to anon, authenticated;

-- ----------------------------------------------------------------------------
-- Realtime: broadcast row changes so open boards sync live
-- ----------------------------------------------------------------------------

do $$
declare t text;
begin
  foreach t in array array[
    'tf_workspaces', 'tf_members', 'tf_boards', 'tf_columns', 'tf_cards'
  ] loop
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = t
    ) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end $$;
