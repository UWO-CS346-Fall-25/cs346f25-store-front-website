-- Reuse helpers you already created:
-- util_slugify(text)
-- set_updated_at()

-- Categories (flat list; add parent_id later if you want hierarchy)
create table if not exists public.categories (
  id           uuid primary key default gen_random_uuid(),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),

  name         text   not null,
  slug         citext not null unique,      -- e.g. 'mugs', 'cat-accessories'
  description  text,
  is_active    boolean not null default true,
  position     int not null default 1 check (position >= 1)  -- lets you order the category list
);

create trigger categories_updated_at
before update on public.categories
for each row execute function set_updated_at();

-- Auto-generate slug if omitted
create or replace function categories_default_slug()
returns trigger language plpgsql as $$
begin
  if new.slug is null or length(new.slug)=0 then
    new.slug := util_slugify(new.name);
  end if;
  return new;
end $$;

create trigger categories_default_slug_tg
before insert on public.categories
for each row execute function categories_default_slug();

create index if not exists categories_position_idx on public.categories(position asc);

-- Join: many-to-many product<->category
create table if not exists public.product_categories (
  product_id   uuid not null references public.products(id)  on delete cascade,
  category_id  uuid not null references public.categories(id) on delete cascade,
  created_at   timestamptz not null default now(),
  primary key (product_id, category_id)
);

create index if not exists product_categories_category_idx on public.product_categories(category_id);
create index if not exists product_categories_product_idx  on public.product_categories(product_id);





-- RLS
alter table public.categories         enable row level security;
alter table public.product_categories enable row level security;

-- Public can read only active categories
create policy "Public read active categories"
on public.categories for select
to anon, authenticated
using (is_active = true);

-- Public can read product-category links only when both sides are public/active
create policy "Public read product-category for active products & categories"
on public.product_categories for select
to anon, authenticated
using (
  exists (
    select 1 from public.products p
    where p.id = product_id
      and p.status = 'active'
  )
  and exists (
    select 1 from public.categories c
    where c.id = category_id
      and c.is_active = true
  )
);

-- Admins manage categories & links
create policy "Admins manage categories"
on public.categories for all
to authenticated
using (coalesce((auth.jwt() -> 'app_metadata' ->> 'role') in ('admin','staff'), false))
with check (coalesce((auth.jwt() -> 'app_metadata' ->> 'role') in ('admin','staff'), false));

create policy "Admins manage product_categories"
on public.product_categories for all
to authenticated
using (coalesce((auth.jwt() -> 'app_metadata' ->> 'role') in ('admin','staff'), false))
with check (coalesce((auth.jwt() -> 'app_metadata' ->> 'role') in ('admin','staff'), false));
