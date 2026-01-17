// Wolf AI Registration API Client
const API_BASE = 'https://api.wolf-logic-ai.com';  // Registration API (PostgREST at 181:3333)

export interface RegistrationStartResponse {
  success: boolean;
  message: string;
  expires_in_minutes: number;
}

export interface RegistrationVerifyResponse {
  api_key: string;
  username: string;
  namespace: string;
  mcp_url: string;
}

export interface UserStatus {
  username: string;
  email: string;
  namespace: string;
  mfa_enabled: boolean;
  registered_at: string;
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

class WolfAPI {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  async startRegistration(phoneNumber: string, email: string): Promise<RegistrationStartResponse> {
    const response = await fetch(`${this.baseUrl}/register/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone_number: phoneNumber, email })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Registration failed');
    }

    return response.json();
  }

  async verifyRegistration(
    phoneNumber: string,
    email: string,
    rcsCode: string,
    emailCode: string
  ): Promise<RegistrationVerifyResponse> {
    const response = await fetch(`${this.baseUrl}/register/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phone_number: phoneNumber,
        email,
        rcs_code: rcsCode,
        email_code: emailCode
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Verification failed');
    }

    return response.json();
  }

  async getUserStatus(apiKey: string): Promise<UserStatus> {
    const response = await fetch(`${this.baseUrl}/user/${apiKey}/status`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to get user status');
    }

    return response.json();
  }

  async health(): Promise<{ status: string; service: string }> {
    const response = await fetch(`${this.baseUrl}/health`);
    return response.json();
  }
}

// Default plans (static until backend provides them)
export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'free',
    name: 'Free Tier',
    price_monthly: 0,
    mobile_purchase_fee: 0,
    features: ['1GB Memory Storage', '100 API calls/day', 'Basic Support'],
    is_introductory: true,
    api_calls_included: 100,
    storage_gb: 1,
    active: true,
    created_at: new Date().toISOString()
  },
  {
    id: 'pro',
    name: 'Pro',
    price_monthly: 9.99,
    mobile_purchase_fee: 2.99,
    features: ['10GB Memory Storage', '10,000 API calls/day', 'Priority Support', 'Custom Namespace'],
    is_introductory: false,
    api_calls_included: 10000,
    storage_gb: 10,
    active: true,
    created_at: new Date().toISOString()
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price_monthly: 49.99,
    mobile_purchase_fee: 0,
    features: ['Unlimited Storage', 'Unlimited API calls', 'Dedicated Support', 'Custom Integration', 'SLA'],
    is_introductory: false,
    api_calls_included: -1,
    storage_gb: -1,
    active: true,
    created_at: new Date().toISOString()
  }
];

export const wolfApi = new WolfAPI(API_BASE);
