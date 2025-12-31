import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface User {
  id: string;
  username: string;
  email: string;
  phone_number: string;
  email_verified: boolean;
  rcs_verified: boolean;
  desktop_client_active: boolean;
  subscription_offset: number;
  beta_user: boolean;
  beta_reward_claimed: boolean;
  early_adopter: boolean;
  referral_code: string;
  referred_by: string | null;
  referral_count: number;
  created_at: string;
  last_mesh_sync: string | null;
}

export interface VerificationCode {
  id: string;
  user_id: string;
  code_type: 'email' | 'rcs';
  code: string;
  expires_at: string;
  verified_at: string | null;
  created_at: string;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  price_monthly: number;
  mobile_purchase_fee: number;
  features: string[];
  is_introductory: boolean;
  api_calls_included: number;
  storage_gb: number;
  active: boolean;
  created_at: string;
}

export interface ReferralReward {
  id: string;
  user_id: string;
  referred_user_id: string;
  reward_type: 'free_month' | 'free_app' | 'discount';
  claimed: boolean;
  created_at: string;
}

export interface UserSubscription {
  id: string;
  user_id: string;
  plan_id: string;
  status: 'pending' | 'active' | 'cancelled';
  mobile_fee_paid: boolean;
  effective_monthly_cost: number;
  next_billing_date: string | null;
  created_at: string;
  updated_at: string;
}
