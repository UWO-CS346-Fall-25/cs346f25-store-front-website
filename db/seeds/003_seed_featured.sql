-- Choose how many to feature
with cfg as (select 10 as n),
candidates as (
  select id, row_number() over (order by created_at desc) as rn
  from public.products
  where status = 'active'
  limit (select n from cfg)
)
insert into public.featured_products (product_id, position, spotlight)
select id, rn, (rn = 1)  -- make #1 a spotlight
from candidates;
