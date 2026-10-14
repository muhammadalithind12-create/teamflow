-- ============================================================================
-- TeamFlow demo seed — public workspace "Acme Corp" (slug 'demo')
-- Run AFTER supabase/migrations/001_teamflow.sql in the Supabase SQL editor.
-- Idempotent: wipes and recreates the demo workspace on every run.
-- ============================================================================

-- Fresh start (cascades to boards -> columns -> cards, and members)
delete from tf_workspaces where slug = 'demo';

do $$
declare
  ws_id      uuid;
  board_id   uuid;
  c_backlog  uuid;
  c_progress uuid;
  c_review   uuid;
  c_done     uuid;
begin
  insert into tf_workspaces (name, slug)
  values ('Acme Corp', 'demo')
  returning id into ws_id;

  insert into tf_boards (workspace_id, title)
  values (ws_id, 'Product Launch')
  returning id into board_id;

  insert into tf_columns (board_id, title, position)
  values (board_id, 'Backlog', 0)
  returning id into c_backlog;

  insert into tf_columns (board_id, title, position)
  values (board_id, 'In Progress', 1)
  returning id into c_progress;

  insert into tf_columns (board_id, title, position)
  values (board_id, 'Review', 2)
  returning id into c_review;

  insert into tf_columns (board_id, title, position)
  values (board_id, 'Done', 3)
  returning id into c_done;

  -- Backlog ---------------------------------------------------------------
  insert into tf_cards (column_id, board_id, title, description, assignee, labels, position) values
  (c_backlog, board_id, 'Design onboarding email sequence',
   'Five-email drip for new trial users: welcome, setup checklist, power features, case study, upgrade nudge. Keep each under 150 words.',
   'Maya Chen', array['design','marketing'], 1000),
  (c_backlog, board_id, 'Write launch blog post',
   'Announce v2.0 on the blog: headline features, migration guide link, quotes from two beta customers.',
   'Jonas Weber', array['content'], 2000),
  (c_backlog, board_id, 'Set up public status page',
   'Use the existing uptime monitor. Needs custom domain status.acme.example and incident templates.',
   'Priya Nair', array['infra'], 3000),
  (c_backlog, board_id, 'Translate landing page to Spanish',
   'ES variant of the marketing site. Start with hero, pricing, and FAQ sections; flag locale-specific screenshots.',
   'Diego Torres', array['content'], 4000);

  -- In Progress ------------------------------------------------------------
  insert into tf_cards (column_id, board_id, title, description, assignee, labels, position) values
  (c_progress, board_id, 'Implement Stripe webhooks',
   'Handle checkout.session.completed and customer.subscription.updated. Verify signatures, make handlers idempotent, retry with backoff.',
   'Arjun Mehta', array['backend','billing'], 1000),
  (c_progress, board_id, 'Mobile responsive fixes',
   'Board view overflows on 360px screens. Fix column widths, sticky header, and the card modal on small viewports.',
   'Maya Chen', array['frontend'], 2000),
  (c_progress, board_id, 'Record product demo video',
   '90-second walkthrough: board creation, drag-and-drop, realtime collaboration. Script approved, needs screen capture.',
   'Sofia Rossi', array['marketing'], 3000),
  (c_progress, board_id, 'Load testing with k6',
   'Simulate 500 concurrent board viewers. Target p95 < 400ms on card moves. Report bottlenecks before launch.',
   'Arjun Mehta', array['infra'], 4000);

  -- Review ------------------------------------------------------------------
  insert into tf_cards (column_id, board_id, title, description, assignee, labels, position) values
  (c_review, board_id, 'Pricing page A/B test',
   'Test annual-first vs monthly-first layout. 50/50 split, run for 2 weeks, primary metric: trial starts.',
   'Jonas Weber', array['marketing','experiment'], 1000),
  (c_review, board_id, 'SSO integration (SAML)',
   'Okta and Google Workspace IdPs verified in staging. Needs security review of the assertion consumer service before merge.',
   'Priya Nair', array['backend','security'], 2000),
  (c_review, board_id, 'Accessibility audit',
   'Keyboard-only drag-and-drop alternative, focus traps in modals, and color contrast on labels. Target WCAG 2.1 AA.',
   'Maya Chen', array['frontend','a11y'], 3000);

  -- Done ---------------------------------------------------------------------
  insert into tf_cards (column_id, board_id, title, description, assignee, labels, position) values
  (c_done, board_id, 'Set up CI/CD pipeline',
   'GitHub Actions: typecheck, unit tests, and preview deploys on every PR. Done and green since last sprint.',
   'Arjun Mehta', array['infra'], 1000),
  (c_done, board_id, 'Draft launch checklist',
   'Runbook covering feature flags, rollback plan, support macros, and the comms schedule for launch day.',
   'Sofia Rossi', array['ops'], 2000),
  (c_done, board_id, 'Beta user feedback round 2',
   'Twelve interviews completed. Top asks: bulk card actions, calendar view, and Slack notifications.',
   'Jonas Weber', array['research'], 3000);
end $$;
