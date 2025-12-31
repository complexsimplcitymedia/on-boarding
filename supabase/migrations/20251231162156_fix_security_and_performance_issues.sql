/*
  # Fix Security and Performance Issues

  ## Overview
  Addresses security and performance issues identified by Supabase:
  - Add missing foreign key indexes
  - Optimize RLS policies with select statements
  - Fix function search path mutability

  ## Changes

  ### 1. Add Missing Foreign Key Indexes
  - Add index on `referral_rewards.referred_user_id`
  - Add index on `user_subscriptions.plan_id`

  ### 2. Optimize RLS Policies
  Replace `auth.*()` with `(select auth.*())` for better performance:
  - Update all RLS policies on users, verification_codes, user_subscriptions, referral_rewards

  ### 3. Fix Function Security
  - Update functions with SECURITY DEFINER and stable search_path
  - Ensures functions are secure and performant

  ## Performance Impact
  These changes improve query performance at scale by:
  - Reducing foreign key lookup overhead
  - Preventing re-evaluation of auth functions per row
  - Securing function execution context
*/

-- Add missing foreign key indexes
CREATE INDEX IF NOT EXISTS idx_referral_rewards_referred_user_id 
  ON referral_rewards(referred_user_id);

CREATE INDEX IF NOT EXISTS idx_user_subscriptions_plan_id 
  ON user_subscriptions(plan_id);

-- Drop existing RLS policies on users table
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Allow user registration" ON users;

-- Recreate RLS policies with optimized auth function calls
CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = id);

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = id)
  WITH CHECK ((select auth.uid()) = id);

CREATE POLICY "Allow user registration"
  ON users FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Drop existing RLS policies on verification_codes table
DROP POLICY IF EXISTS "Users can view own verification codes" ON verification_codes;
DROP POLICY IF EXISTS "Allow verification code creation" ON verification_codes;
DROP POLICY IF EXISTS "Users can update own verification codes" ON verification_codes;

-- Recreate RLS policies with optimized queries
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

-- Drop existing RLS policies on user_subscriptions table
DROP POLICY IF EXISTS "Users can view own subscriptions" ON user_subscriptions;
DROP POLICY IF EXISTS "Users can create own subscriptions" ON user_subscriptions;
DROP POLICY IF EXISTS "Users can update own subscriptions" ON user_subscriptions;

-- Recreate RLS policies with optimized auth function calls
CREATE POLICY "Users can view own subscriptions"
  ON user_subscriptions FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can create own subscriptions"
  ON user_subscriptions FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can update own subscriptions"
  ON user_subscriptions FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

-- Drop existing RLS policies on referral_rewards table
DROP POLICY IF EXISTS "Users can view own referral rewards" ON referral_rewards;
DROP POLICY IF EXISTS "System can create referral rewards" ON referral_rewards;

-- Recreate RLS policies with optimized auth function calls
CREATE POLICY "Users can view own referral rewards"
  ON referral_rewards FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

CREATE POLICY "System can create referral rewards"
  ON referral_rewards FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Fix function security: generate_referral_code
CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  code text;
  exists boolean;
BEGIN
  LOOP
    code := upper(substring(md5(random()::text) from 1 for 8));
    SELECT EXISTS(SELECT 1 FROM users WHERE referral_code = code) INTO exists;
    EXIT WHEN NOT exists;
  END LOOP;
  RETURN code;
END;
$$;

-- Fix function security: set_referral_code
CREATE OR REPLACE FUNCTION set_referral_code()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.referral_code IS NULL THEN
    NEW.referral_code := generate_referral_code();
  END IF;
  RETURN NEW;
END;
$$;

-- Fix function security: process_referral
CREATE OR REPLACE FUNCTION process_referral()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  ref_count integer;
BEGIN
  IF NEW.referred_by IS NOT NULL THEN
    UPDATE users 
    SET referral_count = referral_count + 1 
    WHERE id = NEW.referred_by;
    
    INSERT INTO referral_rewards (user_id, referred_user_id, reward_type)
    VALUES (NEW.referred_by, NEW.id, 'free_month');
    
    SELECT referral_count INTO ref_count FROM users WHERE id = NEW.referred_by;
    
    IF ref_count >= 10 THEN
      INSERT INTO referral_rewards (user_id, referred_user_id, reward_type)
      VALUES (NEW.referred_by, NEW.id, 'free_app')
      ON CONFLICT DO NOTHING;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- Recreate triggers to ensure they use updated functions
DROP TRIGGER IF EXISTS trigger_set_referral_code ON users;
CREATE TRIGGER trigger_set_referral_code
  BEFORE INSERT ON users
  FOR EACH ROW
  EXECUTE FUNCTION set_referral_code();

DROP TRIGGER IF EXISTS trigger_process_referral ON users;
CREATE TRIGGER trigger_process_referral
  AFTER INSERT ON users
  FOR EACH ROW
  EXECUTE FUNCTION process_referral();