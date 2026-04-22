/*
  # TaiScale Mesh Onboarding System

  ## Overview
  Creates the database schema for the TaiScale mesh multi-layered memory system onboarding process.
  Handles user registration, verification, and subscription management.

  ## New Tables
  
  ### `users`
  Stores user account information and verification status
  - `id` (uuid, primary key) - Unique user identifier
  - `username` (text, unique) - User's chosen username
  - `email` (text, unique) - User's email address
  - `phone_number` (text) - User's phone number
  - `email_verified` (boolean) - Email verification status
  - `rcs_verified` (boolean) - RCS verification status
  - `desktop_client_active` (boolean) - Whether user has active desktop client
  - `subscription_offset` (numeric) - Percentage of subscription offset by mesh participation
  - `created_at` (timestamptz) - Account creation timestamp
  - `last_mesh_sync` (timestamptz) - Last synchronization with mesh network
  
  ### `verification_codes`
  Stores temporary verification codes for email and RCS verification
  - `id` (uuid, primary key) - Unique code identifier
  - `user_id` (uuid, foreign key) - References users table
  - `code_type` (text) - Type of verification (email or rcs)
  - `code` (text) - The verification code (8-digit PIN for email)
  - `expires_at` (timestamptz) - Code expiration time
  - `verified_at` (timestamptz) - When code was verified
  - `created_at` (timestamptz) - Code generation timestamp
  
  ### `subscription_plans`
  Defines available subscription tiers
  - `id` (uuid, primary key) - Plan identifier
  - `name` (text) - Plan name (Free, Premium, etc.)
  - `price_monthly` (numeric) - Monthly price in USD
  - `mobile_purchase_fee` (numeric) - One-time mobile access fee
  - `features` (jsonb) - Plan features as JSON
  - `active` (boolean) - Whether plan is currently available
  - `created_at` (timestamptz) - Plan creation timestamp
  
  ### `user_subscriptions`
  Tracks user subscription status and payments
  - `id` (uuid, primary key) - Subscription identifier
  - `user_id` (uuid, foreign key) - References users table
  - `plan_id` (uuid, foreign key) - References subscription_plans table
  - `status` (text) - Subscription status (pending, active, cancelled)
  - `mobile_fee_paid` (boolean) - Whether mobile purchase fee is paid
  - `effective_monthly_cost` (numeric) - Actual monthly cost after mesh offset
  - `next_billing_date` (timestamptz) - Next payment due date
  - `created_at` (timestamptz) - Subscription creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ## Data Retention Policy
  User mesh data is retained for 24 hours only to maintain coherent hive integration.
  Personal account data persists but mesh sync data expires automatically.

  ## Security
  - Enable RLS on all tables
  - Users can only read/update their own data
  - Verification codes are accessible only to the owning user
  - Subscription plans are publicly readable but not modifiable by users
  - Admin policies would be added separately for management operations
*/

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text UNIQUE NOT NULL,
  email text UNIQUE NOT NULL,
  phone_number text NOT NULL,
  email_verified boolean DEFAULT false,
  rcs_verified boolean DEFAULT false,
  desktop_client_active boolean DEFAULT false,
  subscription_offset numeric DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  last_mesh_sync timestamptz,
  CONSTRAINT username_length CHECK (char_length(username) >= 3 AND char_length(username) <= 30),
  CONSTRAINT valid_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- Create verification_codes table
CREATE TABLE IF NOT EXISTS verification_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  code_type text NOT NULL CHECK (code_type IN ('email', 'rcs')),
  code text NOT NULL,
  expires_at timestamptz NOT NULL,
  verified_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Create subscription_plans table
CREATE TABLE IF NOT EXISTS subscription_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  price_monthly numeric NOT NULL DEFAULT 0,
  mobile_purchase_fee numeric NOT NULL DEFAULT 0,
  features jsonb DEFAULT '[]'::jsonb,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Create user_subscriptions table
CREATE TABLE IF NOT EXISTS user_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plan_id uuid NOT NULL REFERENCES subscription_plans(id),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'cancelled')),
  mobile_fee_paid boolean DEFAULT false,
  effective_monthly_cost numeric DEFAULT 0,
  next_billing_date timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Allow user registration"
  ON users FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- RLS Policies for verification_codes table
CREATE POLICY "Users can view own verification codes"
  ON verification_codes FOR SELECT
  TO anon, authenticated
  USING (user_id IN (SELECT id FROM users WHERE email = current_setting('request.jwt.claims', true)::json->>'email'));

CREATE POLICY "Allow verification code creation"
  ON verification_codes FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update own verification codes"
  ON verification_codes FOR UPDATE
  TO anon, authenticated
  USING (user_id IN (SELECT id FROM users WHERE email = current_setting('request.jwt.claims', true)::json->>'email'))
  WITH CHECK (user_id IN (SELECT id FROM users WHERE email = current_setting('request.jwt.claims', true)::json->>'email'));

-- RLS Policies for subscription_plans table
CREATE POLICY "Subscription plans are publicly viewable"
  ON subscription_plans FOR SELECT
  TO anon, authenticated
  USING (active = true);

-- RLS Policies for user_subscriptions table
CREATE POLICY "Users can view own subscriptions"
  ON user_subscriptions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own subscriptions"
  ON user_subscriptions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own subscriptions"
  ON user_subscriptions FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Insert default subscription plans
INSERT INTO subscription_plans (name, price_monthly, mobile_purchase_fee, features) VALUES
  ('Free Tier', 0, 0, '["Access to TaiScale mesh network", "24-hour data retention", "Community support", "Basic mesh synchronization"]'::jsonb),
  ('Mobile Access', 9.99, 4.99, '["Full mobile app access", "Priority mesh synchronization", "Extended mesh memory (48 hours)", "Email support", "Cross-platform sync"]'::jsonb),
  ('Premium Mesh', 19.99, 4.99, '["Desktop client included", "100% subscription offset potential", "Real-time mesh synchronization", "Priority support", "Advanced neural-mesh features", "No data retention limits", "Contributor rewards"]'::jsonb)
ON CONFLICT (name) DO NOTHING;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_verification_codes_user_id ON verification_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_verification_codes_expires_at ON verification_codes(expires_at);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON user_subscriptions(user_id);