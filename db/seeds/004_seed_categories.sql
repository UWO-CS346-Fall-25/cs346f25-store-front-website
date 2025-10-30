insert into public.categories (name, slug, description, is_active, position)
values
  ('Summer Sales',            'summer-sale',            'Summer time sales only',           false, 1),
  ('Winter Sales',            'winter-sale',            'Winter time sales only',           true, 2),
  ('Autumn Sales',            'autumn-sale',            'Autumn time sales only',           false, 3),
  ('Mugs',            'mugs',            'All mugs and cups',           true, 4),
  ('Shirts',          'shirts',          'Tees and apparel',            true, 5),
  ('Bookmarks',       'bookmarks',       'Paper & magnetic bookmarks',  true, 6),
  ('Cat Accessories', 'cat-accessories', 'Cat-themed extras',           true, 7)
on conflict (slug) do update
set name = excluded.name,
    description = excluded.description,
    is_active = excluded.is_active,
    position = excluded.position;




-- Example logic: distribute active products across categories
with cats as (
  select slug, id, row_number() over(order by position) as rn
  from public.categories
  where is_active = true
),
prods as (
  select id, row_number() over(order by created_at) as rn
  from public.products
  where is_active = true and status = 'active'
)
insert into public.product_categories (product_id, category_id)
select p.id, c.id
from prods p
join cats  c on ((p.rn - 1) % (select count(*) from cats)) + 1 = c.rn
on conflict do nothing;



with summer as (
  select id from public.categories where slug = 'summer-sale'
),
candidates as (
  select id
  from public.products
  where is_active = true and status = 'active'
  order by created_at desc
  limit greatest(1, (select ceil(count(*) * 0.20) from public.products where is_active = true and status='active'))
)
insert into public.product_categories (product_id, category_id)
select p.id, (select id from summer)
from candidates p
on conflict do nothing;
