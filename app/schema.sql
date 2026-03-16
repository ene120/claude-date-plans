-- ============================================================
-- DateFlo Dashboard: Supabase PostgreSQL Schema
-- Run this in your Supabase SQL Editor (Dashboard > SQL Editor)
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ── Couples ──
create table public.couples (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  created_by uuid references auth.users(id),
  invite_code text unique default encode(gen_random_bytes(6), 'hex'),
  created_at timestamptz default now()
);

alter table public.couples enable row level security;

-- ── Profiles ──
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  email text,
  phone text,
  avatar_url text,
  couple_id uuid references public.couples(id),
  role text default 'owner' check (role in ('owner', 'partner')),
  stripe_customer_id text,
  subscription_status text default 'free' check (subscription_status in ('free', 'active', 'canceled')),
  subscription_plan text,
  subscription_expires_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.profiles enable row level security;

-- ── Couple Invites ──
create table public.couple_invites (
  id uuid primary key default uuid_generate_v4(),
  couple_id uuid references public.couples(id) on delete cascade,
  invited_by uuid references auth.users(id),
  invited_email text,
  invite_code text not null,
  status text default 'pending' check (status in ('pending', 'accepted', 'expired')),
  created_at timestamptz default now(),
  expires_at timestamptz default (now() + interval '7 days')
);

alter table public.couple_invites enable row level security;

-- ── Preferences ──
create table public.preferences (
  id uuid primary key default uuid_generate_v4(),
  couple_id uuid unique references public.couples(id) on delete cascade,
  partner1_name text,
  partner2_name text,
  relationship_stage text,
  city text,
  budget text,
  activity_level text,
  transport text,
  food1_likes text,
  food1_dislikes text,
  food1_allergies text,
  food2_likes text,
  food2_dislikes text,
  food2_allergies text,
  vibes text[] default '{}',
  dealbreakers text,
  love_langs1 text,
  love_langs2 text,
  accessibility text,
  surprise_pref text,
  extra_notes text,
  updated_at timestamptz default now()
);

alter table public.preferences enable row level security;

-- ── Plans ──
create table public.plans (
  id uuid primary key default uuid_generate_v4(),
  couple_id uuid references public.couples(id) on delete cascade,
  title text,
  occasion text,
  date_day date,
  start_time time,
  city text,
  status text default 'requested' check (status in ('requested', 'in_progress', 'delivered', 'archived')),
  plan_html text,
  plan_url text,
  thumbnail_url text,
  budget_range text,
  stripe_payment_id text,
  amount_paid integer default 0,
  created_at timestamptz default now(),
  delivered_at timestamptz
);

alter table public.plans enable row level security;

-- ── Favorites ──
create table public.favorites (
  id uuid primary key default uuid_generate_v4(),
  profile_id uuid references public.profiles(id) on delete cascade,
  couple_id uuid references public.couples(id) on delete cascade,
  venue_name text not null,
  venue_type text default 'other' check (venue_type in ('restaurant', 'bar', 'activity', 'park', 'other')),
  address text,
  city text,
  google_maps_url text,
  apple_maps_url text,
  notes text,
  source_plan_id uuid references public.plans(id),
  created_at timestamptz default now()
);

alter table public.favorites enable row level security;

-- ── Plan Requests ──
create table public.plan_requests (
  id uuid primary key default uuid_generate_v4(),
  couple_id uuid references public.couples(id) on delete cascade,
  profile_id uuid references public.profiles(id),
  form_data jsonb not null default '{}',
  status text default 'new' check (status in ('new', 'assigned', 'completed')),
  resulting_plan_id uuid references public.plans(id),
  created_at timestamptz default now()
);

alter table public.plan_requests enable row level security;

-- ── Payments (Stripe readiness, empty for now) ──
create table public.payments (
  id uuid primary key default uuid_generate_v4(),
  profile_id uuid references public.profiles(id),
  couple_id uuid references public.couples(id),
  plan_id uuid references public.plans(id),
  stripe_payment_intent_id text,
  stripe_checkout_session_id text,
  amount integer default 0,
  currency text default 'usd',
  status text default 'pending',
  created_at timestamptz default now()
);

alter table public.payments enable row level security;


-- ============================================================
-- Row Level Security Policies
-- ============================================================

-- Profiles: users can read and update only their own
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Couples: members can read their couple
create policy "Couple members can view couple"
  on public.couples for select
  using (
    id in (select couple_id from public.profiles where id = auth.uid())
  );

create policy "Users can create couples"
  on public.couples for insert
  with check (auth.uid() = created_by);

create policy "Creator can update couple"
  on public.couples for update
  using (created_by = auth.uid());

-- Preferences: couple members can read/write
create policy "Couple members can view preferences"
  on public.preferences for select
  using (
    couple_id in (select couple_id from public.profiles where id = auth.uid())
  );

create policy "Couple members can insert preferences"
  on public.preferences for insert
  with check (
    couple_id in (select couple_id from public.profiles where id = auth.uid())
  );

create policy "Couple members can update preferences"
  on public.preferences for update
  using (
    couple_id in (select couple_id from public.profiles where id = auth.uid())
  );

-- Plans: couple members can read
create policy "Couple members can view plans"
  on public.plans for select
  using (
    couple_id in (select couple_id from public.profiles where id = auth.uid())
  );

-- Favorites: users manage their own
create policy "Users can view own favorites"
  on public.favorites for select
  using (profile_id = auth.uid());

create policy "Users can insert favorites"
  on public.favorites for insert
  with check (profile_id = auth.uid());

create policy "Users can update own favorites"
  on public.favorites for update
  using (profile_id = auth.uid());

create policy "Users can delete own favorites"
  on public.favorites for delete
  using (profile_id = auth.uid());

-- Plan Requests: users manage their own
create policy "Users can view own requests"
  on public.plan_requests for select
  using (profile_id = auth.uid());

create policy "Users can create requests"
  on public.plan_requests for insert
  with check (profile_id = auth.uid());

-- Couple Invites: visible to creator and couple members
create policy "Invite creator can view"
  on public.couple_invites for select
  using (invited_by = auth.uid());

create policy "Users can create invites"
  on public.couple_invites for insert
  with check (invited_by = auth.uid());

-- Payments: users can view own
create policy "Users can view own payments"
  on public.payments for select
  using (profile_id = auth.uid());


-- ============================================================
-- Database Functions & Triggers
-- ============================================================

-- Auto create profile on user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, display_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Accept invite function (called via RPC)
create or replace function public.accept_invite(p_invite_code text)
returns void as $$
declare
  v_invite record;
  v_couple_id uuid;
begin
  -- Find the invite
  select * into v_invite
  from public.couple_invites
  where invite_code = p_invite_code
    and status = 'pending'
    and expires_at > now()
  limit 1;

  if v_invite is null then
    raise exception 'Invalid or expired invite code';
  end if;

  -- Link user to couple
  update public.profiles
  set couple_id = v_invite.couple_id, role = 'partner'
  where id = auth.uid();

  -- Mark invite as accepted
  update public.couple_invites
  set status = 'accepted'
  where id = v_invite.id;
end;
$$ language plpgsql security definer;


-- ============================================================
-- Done! Your schema is ready.
-- Next steps:
-- 1. Go to Authentication > Settings in your Supabase dashboard
-- 2. Enable "Magic Link" under Email Auth
-- 3. Set the Site URL to your app URL (e.g. https://ene120.github.io/dateflo-app)
-- 4. Add your app URL to Redirect URLs
-- 5. Update js/config.js with your Supabase URL and anon key
-- ============================================================
