// Direct PostgreSQL API via PostgREST - ALL DATA ON YOUR INFRASTRUCTURE
// No Supabase, no external services - wolf_logic database only

const POSTGRES_API_URL = import.meta.env.VITE_POSTGRES_API_URL || 'http://100.110.82.181:3333';

export interface User {
  id: string;
  username: string;
  email: string;
  phone_number: string;
  email_verified: boolean;
  rcs_verified: boolean;
  api_key: string;
  namespace: string;
  beta_user: boolean;
  early_adopter: boolean;
  referral_code: string;
  mfa_enabled: boolean;
  created_at: string;
}

// Direct PostgreSQL calls via PostgREST (port 3333)
export const db = {
  async createUser(userData: Partial<User>) {
    const response = await fetch(`${POSTGRES_API_URL}/onboarding_users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(userData)
    });

    if (!response.ok) {
      throw new Error(`Failed to create user: ${response.statusText}`);
    }

    return response.json();
  },

  async getUser(id: string) {
    const response = await fetch(`${POSTGRES_API_URL}/onboarding_users?id=eq.${id}`);

    if (!response.ok) {
      throw new Error(`Failed to get user: ${response.statusText}`);
    }

    const users = await response.json();
    return users[0] || null;
  },

  async updateUser(id: string, updates: Partial<User>) {
    const response = await fetch(`${POSTGRES_API_URL}/onboarding_users?id=eq.${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(updates)
    });

    if (!response.ok) {
      throw new Error(`Failed to update user: ${response.statusText}`);
    }

    return response.json();
  }
};

export default db;
