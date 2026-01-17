// Wolf Logic Authentication Service (Authentik SSO + wolf-api backend)

const WOLF_API_URL = import.meta.env.VITE_WOLF_API_URL || 'https://mcp.complexsimplicityai.com';
const API_KEY_SERVICE_URL = import.meta.env.VITE_API_KEY_SERVICE_URL || 'http://100.110.82.181:8100';
const AUTHENTIK_URL = import.meta.env.VITE_AUTHENTIK_URL || 'http://100.110.82.181:8190';
const AUTHENTIK_CLIENT_ID = import.meta.env.VITE_AUTHENTIK_CLIENT_ID || '';

export interface WolfUser {
  id: string;
  email: string;
  name: string;
  picture?: string;
  google_id: string;
  phone_number?: string;
  beta_user: boolean;
  early_adopter: boolean;
  email_verified: boolean;
  created_at: string;
  referral_code: string;
}

export interface AuthResponse {
  user: WolfUser;
  apiKey: string;
  token: string;
}

/**
 * Generate PKCE code verifier and challenge
 */
async function generatePKCE(): Promise<{ verifier: string; challenge: string }> {
  const verifier = generateRandomString(128);
  const challenge = await sha256(verifier);
  return { verifier, challenge };
}

function generateRandomString(length: number): string {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
  const randomValues = new Uint8Array(length);
  crypto.getRandomValues(randomValues);
  return Array.from(randomValues)
    .map((x) => charset[x % charset.length])
    .join('');
}

async function sha256(plain: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(plain);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return base64URLEncode(hash);
}

function base64URLEncode(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  const binary = String.fromCharCode(...bytes);
  const base64 = btoa(binary);
  return base64
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

/**
 * Initiate Authentik OAuth flow
 */
export function initiateAuthentikOAuth(redirectUri: string): void {
  const { verifier, challenge } = generatePKCE();

  // Store verifier for later
  sessionStorage.setItem('pkce_verifier', verifier);
  sessionStorage.setItem('oauth_redirect_uri', redirectUri);

  const params = new URLSearchParams({
    client_id: AUTHENTIK_CLIENT_ID,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid profile email',
    code_challenge: challenge,
    code_challenge_method: 'S256',
    state: generateRandomString(32)
  });

  window.location.href = `${AUTHENTIK_URL}/application/o/authorize/?${params.toString()}`;
}

/**
 * Handle OAuth callback and exchange code for token
 */
export async function handleAuthentikCallback(
  code: string,
  phoneNumber?: string,
  referralCode?: string
): Promise<AuthResponse> {
  try {
    const verifier = sessionStorage.getItem('pkce_verifier');
    const redirectUri = sessionStorage.getItem('oauth_redirect_uri');

    if (!verifier || !redirectUri) {
      throw new Error('OAuth session expired');
    }

    // Exchange code for token with Authentik
    const tokenParams = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
      client_id: AUTHENTIK_CLIENT_ID,
      code_verifier: verifier
    });

    const tokenResponse = await fetch(`${AUTHENTIK_URL}/application/o/token/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: tokenParams.toString()
    });

    if (!tokenResponse.ok) {
      throw new Error('Failed to exchange authorization code');
    }

    const tokenData = await tokenResponse.json();

    // Get user info from Authentik
    const userInfoResponse = await fetch(`${AUTHENTIK_URL}/application/o/userinfo/`, {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`
      }
    });

    if (!userInfoResponse.ok) {
      throw new Error('Failed to get user info');
    }

    const userInfo = await userInfoResponse.json();

    // Register/login user with wolf-api
    const response = await fetch(`${WOLF_API_URL}/api/auth/sso`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: userInfo.email,
        name: userInfo.name,
        sub: userInfo.sub,
        phone_number: phoneNumber,
        referral_code: referralCode,
        authentik_token: tokenData.access_token
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Authentication failed');
    }

    const data = await response.json();

    // Store auth data
    localStorage.setItem('wolf_auth_token', data.token);
    localStorage.setItem('wolf_user', JSON.stringify(data.user));
    sessionStorage.removeItem('pkce_verifier');
    sessionStorage.removeItem('oauth_redirect_uri');

    return data;
  } catch (error: any) {
    console.error('Authentik OAuth error:', error);
    throw new Error(error.message || 'Failed to authenticate with Authentik');
  }
}

/**
 * Register or login user with Google OAuth (legacy - redirects to Authentik)
 */
export async function authenticateWithGoogle(
  credential: string,
  phoneNumber?: string,
  referralCode?: string
): Promise<AuthResponse> {
  // Legacy function - now uses Authentik flow
  // This shouldn't be called anymore, but keeping for backward compatibility
  throw new Error('Please use Authentik OAuth flow');
}

/**
 * Get current authenticated user from localStorage
 */
export function getCurrentUser(): WolfUser | null {
  const userStr = localStorage.getItem('wolf_user');
  if (!userStr) return null;

  try {
    return JSON.parse(userStr);
  } catch {
    return null;
  }
}

/**
 * Get auth token
 */
export function getAuthToken(): string | null {
  return localStorage.getItem('wolf_auth_token');
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  return !!getAuthToken();
}

/**
 * Logout user
 */
export function logout(): void {
  localStorage.removeItem('wolf_auth_token');
  localStorage.removeItem('wolf_user');
  localStorage.removeItem('wolf_benchmark');
}

/**
 * Update user profile
 */
export async function updateUserProfile(
  userId: string,
  updates: Partial<WolfUser>
): Promise<WolfUser> {
  const token = getAuthToken();
  if (!token) throw new Error('Not authenticated');

  const response = await fetch(`${WOLF_API_URL}/api/users/${userId}`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(updates)
  });

  if (!response.ok) {
    throw new Error('Failed to update profile');
  }

  const updatedUser = await response.json();
  localStorage.setItem('wolf_user', JSON.stringify(updatedUser));

  return updatedUser;
}

/**
 * Create user subscription
 */
export async function createSubscription(
  userId: string,
  planId: string,
  monthlyPrice: number
): Promise<any> {
  const token = getAuthToken();
  if (!token) throw new Error('Not authenticated');

  const response = await fetch(`${WOLF_API_URL}/api/subscriptions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      user_id: userId,
      plan_id: planId,
      status: 'pending',
      effective_monthly_cost: monthlyPrice
    })
  });

  if (!response.ok) {
    throw new Error('Failed to create subscription');
  }

  return await response.json();
}

/**
 * Save device benchmark results
 */
export async function saveBenchmark(
  userId: string,
  benchmarkData: any
): Promise<void> {
  const token = getAuthToken();
  if (!token) throw new Error('Not authenticated');

  const response = await fetch(`${WOLF_API_URL}/api/benchmark`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      user_id: userId,
      ...benchmarkData
    })
  });

  if (!response.ok) {
    console.error('Failed to save benchmark, storing locally');
    localStorage.setItem('wolf_benchmark', JSON.stringify(benchmarkData));
  }
}
