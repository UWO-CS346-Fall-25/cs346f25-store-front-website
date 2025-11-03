-- Seed: Sample Products
-- Description: Inserts sample product data for development/testing
-- Note: In production, use proper image paths and SEO metadata

with cfg as (select 24 as n),

series as (
  select generate_series(1, (select n from cfg)) as i
)

insert into public.products (
  name,
  slug,
  description,
  price_cents,
  currency,
  is_active,
  status,
  sku,
  seo_title,
  seo_description
)
select
  'Product ' || i as name,
  'product-' || i as slug,
  'This is a description for Product ' || i || '.' as description,
  (500 + floor(random() * 9500))::int as price_cents,  -- $5.00 - $99.99
  'USD' as currency,
  (i % 12 <> 0) as is_active,                           -- every 12th inactive (good for testing filters)
  case when i % 8 = 0 then 'draft' else 'active' end as status,
  'PROD-' || lpad(i::text, 4, '0') as sku,
  null as seo_title,
  null as seo_description
from series;

