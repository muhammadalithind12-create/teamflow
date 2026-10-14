# TeamFlow — Realtime Multi-Tenant Kanban SaaS

TeamFlow is a Kanban project-management app for teams: drag-and-drop boards, live
collaboration across tabs, and strict per-workspace data isolation enforced by
Supabase Row Level Security. Built with Next.js 16, TypeScript, Supabase
(Postgres + Realtime), and Tailwind CSS.

**Live demo:** `/board` on the deployed site — public demo workspace, no login required.
Open it in two browser tabs, drag a card in one, and watch the other update instantly.

## Features

- **Drag-and-drop Kanban** — cards sort within and across columns (@dnd-kit) with
  fractional positioning, so a move never rewrites the whole list
- **Realtime sync** — `postgres_changes` streams card/column inserts, updates, and
  deletes to every open board; a LIVE indicator shows channel status
- **Multi-tenant workspaces** — workspaces → boards → columns → cards, with
  owner/member roles in `tf_members`
- **RLS tenant isolation** — Row Level Security guarantees workspace A can never
  read workspace B, enforced in Postgres (not just hidden in the UI); realtime
  respects the same policies
- **Card management** — modal editor (title, description, assignee, labels),
  add/delete cards, add/rename/delete columns
- **Public demo mode** — the `demo` workspace is readable and writable without
  login, so visitors can try everything instantly

## Multi-tenancy + RLS design

Tables (`tf_workspaces`, `tf_members`, `tf_boards`, `tf_columns`, `tf_cards`) all
have RLS enabled. The model has two tiers:

1. **Demo tier** — the workspace with `slug = 'demo'` is public: anyone (including
   anonymous visitors) can read it and read/write its boards, columns, and cards.
2. **Tenant tier** — every other workspace is fully isolated. Policies allow access
   only to authenticated members, checked through `tf_members` via the
   `SECURITY DEFINER` helper `tf_is_member()` (definer rights prevent policy
   recursion). `tf_cards` carries a denormalized `board_id` so card policies need
   no extra join.

An `/board` page section ("How tenant isolation works") explains the design with
the actual policy shape.

## Realtime architecture

The board subscribes to one Supabase channel filtered by `board_id`:

- `tf_cards` INSERT / UPDATE / DELETE → merged into local state by id
- `tf_columns` INSERT / UPDATE / DELETE → columns added, renamed, or removed live
- All five tables are in the `supabase_realtime` publication (see migration)

Because realtime honors RLS, live updates can never leak across workspaces.

## Setup

Prerequisites: Node 24+, pnpm 11+, a Supabase project.

1. **Database** — in the Supabase SQL editor, run in order:
   - `supabase/migrations/001_teamflow.sql` (schema, RLS policies, realtime)
   - `supabase/seeds/demo.sql` (demo workspace "Acme Corp" with a seeded board)
2. **Env** — in `apps/web`, set:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
3. **Install & run**:
   ```bash
   pnpm install
   pnpm --filter web dev
   ```
4. Open `/board` — the demo board loads without login.

## Project structure

```
supabase/
  migrations/001_teamflow.sql   schema + RLS + realtime publication
  seeds/demo.sql                demo workspace seed (idempotent)
apps/web/src/app/(external-pages)/
  board/
    page.tsx            route wrapper + metadata
    KanbanBoard.tsx     data loading, dnd-kit context, realtime, mutations
    KanbanColumn.tsx    droppable column, add/rename/delete
    KanbanCard.tsx      sortable card
    CardDialog.tsx      view/edit modal
    RlsPanel.tsx        "how isolation works" explainer
    types.ts            tf_* TypeScript types
```

## Tech stack

Next.js 16 · React 19 · TypeScript · Supabase (Postgres, RLS, Realtime) ·
@dnd-kit · Tailwind CSS 4 · Radix UI · pnpm + Turborepo

## Attribution

TeamFlow is built on the [Nextbase](https://github.com/awakenedpigeon/nextbase-nextjs-supabase-starter)
open-source starter (MIT). The Kanban product — schema, RLS design, realtime
board, drag-and-drop, demo seed, and branding — was designed and built on top of
it. Original `LICENSE` retained.
