-- Create a homepage group
insert into public.feature_groups (key, title, description, is_active)
values ('homepage', 'Featured on Homepage', 'Main hero carousel', true)
on conflict (key) do update set title = excluded.title, description = excluded.description, is_active = excluded.is_active
returning id;

-- Add first 10 active products ordered by newest
with grp as (
  select id from public.feature_groups where key = 'homepage'
),
prods as (
  select id, row_number() over (order by created_at desc) as rn
  from public.products
  where is_active = true and status = 'active'
  limit 10
)
insert into public.featured_products (group_id, product_id, position, spotlight)
select g.id, p.id, p.rn, (p.rn = 1)  -- make #1 a spotlight
from grp g cross join prods p
on conflict (group_id, product_id) do update set position = excluded.position, spotlight = excluded.spotlight;
