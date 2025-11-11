
-- ─────────────────────────────────────────────────────────────────────────────
-- Seeds (idempotent)
-- ─────────────────────────────────────────────────────────────────────────────
-- Default theme
insert into public.site_themes (
  key, name, description, is_active, is_default, recurrence, timezone,
  light_primary_1, light_primary_2, light_primary_3,
  light_tint_1,    light_tint_2,    light_tint_3,
  dark_primary_1,  dark_primary_2,  dark_primary_3,
  dark_tint_1,     dark_tint_2,     dark_tint_3
) values (
  'default', 'Default Theme', 'Base site colors', true, true, 'none', 'America/Chicago',
  '#a9a7be', '#9b93b7', '#857aab',
  '#388A67', '#21b977', '#ffffff',
  '#a9a7be', '#9b93b7', '#857aab',
  '#388A67', '#21b977', '#ffffff'
);

-- Halloween (recurs yearly Oct 01 → Nov 07)
insert into public.site_themes (
  key, name, description, is_active, is_default,
  recurrence, yearly_start_md, yearly_end_md, timezone,
  light_primary_1, light_primary_2, light_primary_3,
  light_tint_1,    light_tint_2,    light_tint_3,
  dark_primary_1,  dark_primary_2,  dark_primary_3,
  dark_tint_1,     dark_tint_2,     dark_tint_3
) values (
  'halloween', 'Halloween Theme', 'Spooky seasonal palette', true, false,
  'yearly', '10-01', '11-03', 'America/Chicago',
  '#f97316', '#ea580c', '#a24424',
  '#22c55e', '#84cc16', '#ffffff',
  '#fb923c', '#f97316', '#97452a',
  '#16a34a', '#65a30d', '#0f172a'
);