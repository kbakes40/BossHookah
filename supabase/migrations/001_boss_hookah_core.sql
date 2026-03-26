-- Boss Hookah: profiles + storefront tables (service role used for admin + webhooks).
-- Run in Supabase SQL editor or via CLI. Adjust RLS policies for your threat model.

-- Profiles (synced from server on each request; promotes admin via ENV.adminEmails or row role)
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  email text,
  name text,
  role text NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  login_method text,
  stripe_customer_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  last_signed_in timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS profiles_email_idx ON public.profiles (email);

-- Orders (Stripe webhooks + Zelle + checkout)
CREATE TABLE IF NOT EXISTS public.bh_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  status text NOT NULL DEFAULT 'pending',
  fulfillment_status text NOT NULL DEFAULT 'pending',
  total_amount bigint NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'usd',
  customer_name text,
  customer_email text,
  customer_phone text,
  stripe_session_id text UNIQUE,
  stripe_payment_intent text,
  payment_method text NOT NULL DEFAULT 'stripe',
  delivery_method text NOT NULL DEFAULT 'shipping',
  items jsonb,
  shipping_address jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS bh_orders_customer_email_idx ON public.bh_orders (customer_email);
CREATE INDEX IF NOT EXISTS bh_orders_created_at_idx ON public.bh_orders (created_at DESC);
CREATE INDEX IF NOT EXISTS bh_orders_stripe_session_idx ON public.bh_orders (stripe_session_id);
CREATE INDEX IF NOT EXISTS bh_orders_stripe_pi_idx ON public.bh_orders (stripe_payment_intent);

-- Customers (upsert on checkout)
CREATE TABLE IF NOT EXISTS public.bh_customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  name text,
  phone text,
  stripe_customer_id text,
  total_spent numeric NOT NULL DEFAULT 0,
  order_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Products / inventory
CREATE TABLE IF NOT EXISTS public.bh_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  brand text,
  category text NOT NULL,
  price numeric NOT NULL DEFAULT 0,
  cost numeric,
  stock integer NOT NULL DEFAULT 0,
  low_stock_threshold integer NOT NULL DEFAULT 10,
  sku text,
  badge text,
  in_stock boolean NOT NULL DEFAULT true,
  image_url text,
  sale_price numeric,
  description text,
  featured boolean DEFAULT false,
  trending boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS bh_products_category_idx ON public.bh_products (category);

-- Single-row store settings (admin UI)
CREATE TABLE IF NOT EXISTS public.bh_store_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_name text NOT NULL,
  address text,
  city text,
  state text,
  zip_code text,
  phone text,
  email text,
  hours text,
  pickup_instructions text,
  zelle_email text,
  zelle_phone text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Optional: enable RLS and add policies so anon/authenticated users only read what they should.
-- Admin mutations go through your API with SUPABASE_SERVICE_ROLE_KEY (bypasses RLS).

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bh_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bh_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bh_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bh_store_settings ENABLE ROW LEVEL SECURITY;

-- Example: users can read/update their own profile (tighten as needed)
CREATE POLICY "profiles_select_own" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Public read for catalog (optional)
CREATE POLICY "bh_products_public_read" ON public.bh_products FOR SELECT USING (true);
CREATE POLICY "bh_store_settings_public_read" ON public.bh_store_settings FOR SELECT USING (true);

-- bh_orders / bh_customers: RLS on with no policies ⇒ JWT roles have no direct access; use service role + API.
