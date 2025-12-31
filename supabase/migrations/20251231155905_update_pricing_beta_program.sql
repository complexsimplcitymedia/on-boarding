/*
  # Update Pricing Structure and Add Beta Program

  ## Overview
  Updates subscription plans to reflect new pricing model and adds support for beta program,
  referral incentives, and early adopter grandfathering.

  ## Changes to Existing Tables
  
  ### `users` table updates
  - Add `beta_user` (boolean) - Marks first 100 beta testers
  - Add `beta_reward_claimed` (boolean) - Tracks if extra free month was claimed
  - Add `early_adopter` (boolean) - Grandfathered into introductory pricing
  - Add `referral_code` (text, unique) - User's unique referral code
  - Add `referred_by` (uuid) - References user who referred them
  - Add `referral_count` (integer) - Number of successful referrals
  
  ### `subscription_plans` table updates
  - Update pricing to reflect new tier structure
  - Add `is_introductory` (boolean) - Marks introductory pricing
  - Add `api_calls_included` (integer) - API calls per month
  - Add `storage_gb` (numeric) - Cloud storage in GB
  
  ## New Tables
  
  ### `referral_rewards`
  Tracks referral progress and rewards
  - `id` (uuid, primary key)
  - `user_id` (uuid, foreign key) - User earning the reward
  - `referred_user_id` (uuid, foreign key) - User who was referred
  - `reward_type` (text) - Type of reward (free_month, free_app, etc.)
  - `claimed` (boolean) - Whether reward was claimed
  - `created_at` (timestamptz)

  ## Updated Pricing Structure
  1. Free Tier - Self-hosted, open source (flagship device)
  2. Compute Tier ($10/month) - Cloud compute, device storage
  3. Premium Tier ($15/month intro, $15 regular) - Full cloud storage + retrieval
  4. Add-on: 5000 API calls + 5GB storage for $5

  ## Beta Program
  - First 100 users marked as beta testers
  - Beta users receive extra free month reward
  - Early adopters locked into introductory pricing
*/

-- Add new columns to users table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'beta_user'
  ) THEN
    ALTER TABLE users ADD COLUMN beta_user boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'beta_reward_claimed'
  ) THEN
    ALTER TABLE users ADD COLUMN beta_reward_claimed boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'early_adopter'
  ) THEN
    ALTER TABLE users ADD COLUMN early_adopter boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'referral_code'
  ) THEN
    ALTER TABLE users ADD COLUMN referral_code text UNIQUE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'referred_by'
  ) THEN
    ALTER TABLE users ADD COLUMN referred_by uuid REFERENCES users(id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'referral_count'
  ) THEN
    ALTER TABLE users ADD COLUMN referral_count integer DEFAULT 0;
  END IF;
END $$;

-- Add new columns to subscription_plans table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'subscription_plans' AND column_name = 'is_introductory'
  ) THEN
    ALTER TABLE subscription_plans ADD COLUMN is_introductory boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'subscription_plans' AND column_name = 'api_calls_included'
  ) THEN
    ALTER TABLE subscription_plans ADD COLUMN api_calls_included integer DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'subscription_plans' AND column_name = 'storage_gb'
  ) THEN
    ALTER TABLE subscription_plans ADD COLUMN storage_gb numeric DEFAULT 0;
  END IF;
END $$;

-- Create referral_rewards table
CREATE TABLE IF NOT EXISTS referral_rewards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  referred_user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reward_type text NOT NULL CHECK (reward_type IN ('free_month', 'free_app', 'discount')),
  claimed boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on referral_rewards
ALTER TABLE referral_rewards ENABLE ROW LEVEL SECURITY;

-- RLS Policies for referral_rewards
CREATE POLICY "Users can view own referral rewards"
  ON referral_rewards FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "System can create referral rewards"
  ON referral_rewards FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Update subscription plans with new pricing
DELETE FROM subscription_plans;

INSERT INTO subscription_plans (name, price_monthly, mobile_purchase_fee, features, is_introductory, api_calls_included, storage_gb, active) VALUES
  (
    'Free Tier (Self-Hosted)',
    0,
    0,
    '["Run on flagship device", "Completely open source", "Build your own infrastructure", "No cloud dependency", "Full data ownership", "Device-only storage", "Community support"]'::jsonb,
    false,
    1000,
    0,
    true
  ),
  (
    'Compute Tier',
    10,
    0,
    '["Cloud compute handled", "Data stored on your device", "Memory functions off our cloud", "Vectorization included", "5000 API calls/month", "Priority support", "Cross-platform sync"]'::jsonb,
    false,
    5000,
    0,
    true
  ),
  (
    'Premium Tier',
    15,
    0,
    '["Full cloud storage & retrieval", "Vectorization & memory tech", "Data backup to cloud", "10,000 API calls/month", "5GB cloud storage", "Premium support", "Advanced features", "Desktop client included"]'::jsonb,
    true,
    10000,
    5,
    true
  );

-- Create function to generate unique referral code
CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS text AS $$
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
$$ LANGUAGE plpgsql;

-- Create trigger to auto-generate referral codes
CREATE OR REPLACE FUNCTION set_referral_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.referral_code IS NULL THEN
    NEW.referral_code := generate_referral_code();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_set_referral_code'
  ) THEN
    CREATE TRIGGER trigger_set_referral_code
      BEFORE INSERT ON users
      FOR EACH ROW
      EXECUTE FUNCTION set_referral_code();
  END IF;
END $$;

-- Create function to handle referral logic
CREATE OR REPLACE FUNCTION process_referral()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.referred_by IS NOT NULL THEN
    UPDATE users 
    SET referral_count = referral_count + 1 
    WHERE id = NEW.referred_by;
    
    INSERT INTO referral_rewards (user_id, referred_user_id, reward_type)
    VALUES (NEW.referred_by, NEW.id, 'free_month');
    
    DECLARE
      ref_count integer;
    BEGIN
      SELECT referral_count INTO ref_count FROM users WHERE id = NEW.referred_by;
      
      IF ref_count >= 10 THEN
        INSERT INTO referral_rewards (user_id, referred_user_id, reward_type)
        VALUES (NEW.referred_by, NEW.id, 'free_app')
        ON CONFLICT DO NOTHING;
      END IF;
    END;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_process_referral'
  ) THEN
    CREATE TRIGGER trigger_process_referral
      AFTER INSERT ON users
      FOR EACH ROW
      EXECUTE FUNCTION process_referral();
  END IF;
END $$;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_users_referral_code ON users(referral_code);
CREATE INDEX IF NOT EXISTS idx_users_referred_by ON users(referred_by);
CREATE INDEX IF NOT EXISTS idx_referral_rewards_user_id ON referral_rewards(user_id);