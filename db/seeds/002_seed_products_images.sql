-- PRIMARY IMAGE (position = 1)
insert into public.product_images (product_id, external_url, alt, position, is_primary)
select
  p.id,
  -- Using picsum.photos for placeholder images
  'https://picsum.photos/seed/' || p.slug || '/800/800' as external_url,
  p.name as alt,
  1 as position,
  true as is_primary
from public.products p
where not exists (
  select 1 from public.product_images pi
  where pi.product_id = p.id and pi.is_primary = true
);

-- OPTIONAL: TWO MORE GALLERY IMAGES (positions = 2,3)
insert into public.product_images (product_id, external_url, alt, position, is_primary)
select
  p.id,
  'https://picsum.photos/seed/' || p.slug || '-' || g.n || '/800/800' as external_url,
  p.name || ' (' || g.n || ')' as alt,
  g.n + 1 as position, -- 2 and 3
  false as is_primary
from public.products p
cross join generate_series(1, 6) as g(n)
where not exists (
  select 1 from public.product_images pi
  where pi.product_id = p.id and pi.position = g.n + 1
);
