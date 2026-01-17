import { useState, useEffect } from 'react';
import { Shield, Phone, Loader2 } from 'lucide-react';
import { initiateAuthentikOAuth, handleAuthentikCallback } from '../../lib/auth';

interface AuthentikSignInStepProps {
  onSuccess: (userId: string, email: string, name: string) => void;
}

export default function AuthentikSignInStep({ onSuccess }: AuthentikSignInStepProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [isCallback, setIsCallback] = useState(false);

  useEffect(() => {
    // Check if we're returning from OAuth callback
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const errorParam = urlParams.get('error');

    if (errorParam) {
      setError('Authentication failed: ' + errorParam);
      // Clear URL params
      window.history.replaceState({}, '', window.location.pathname);
      return;
    }

    if (code) {
      setIsCallback(true);
      handleCallback(code);
    }
  }, []);

  const handleCallback = async (code: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await handleAuthentikCallback(code, phoneNumber, referralCode);
      onSuccess(response.user.id, response.user.email, response.user.name);

      // Clear URL params
      window.history.replaceState({}, '', window.location.pathname);
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async () => {
    const redirectUri = window.location.origin + window.location.pathname;

    // Store phone and referral in sessionStorage for after callback
    if (phoneNumber) sessionStorage.setItem('pending_phone', phoneNumber);
    if (referralCode) sessionStorage.setItem('pending_referral', referralCode);

    initiateAuthentikOAuth(redirectUri);
  };

  if (loading || isCallback) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-red-500 to-purple-600 mb-4">
            <Loader2 className="w-8 h-8 text-white animate-spin" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Authenticating...</h2>
          <p className="text-gray-400">
            Please wait while we verify your credentials
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-red-500 to-purple-600 mb-4">
          <Shield className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Welcome to Wolf Logic</h2>
        <p className="text-gray-400">
          Sign in with your account to get started with the Cognitive Memory Layer
        </p>
      </div>

      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400 text-sm">
          {error}
        </div>
      )}

      <div className="bg-gray-800/50 rounded-lg p-6 space-y-4">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="text-sm text-gray-300">Secure SSO authentication powered by Authentik</p>
        </div>

        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <p className="text-sm text-gray-300">Encrypted memory storage with 24h retention</p>
        </div>

        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <p className="text-sm text-gray-300">AI-optimized performance benchmarking</p>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Phone Number (optional)
        </label>
        <input
          type="tel"
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
          placeholder="+1 (555) 123-4567"
          className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500"
        />
        <p className="mt-1 text-xs text-gray-500">
          For RCS verification and multi-device sync
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Referral Code (optional)
        </label>
        <input
          type="text"
          value={referralCode}
          onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
          placeholder="WOLF-XXXX"
          className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500"
        />
        <p className="mt-1 text-xs text-gray-500">
          Get bonus credits when referred by existing users
        </p>
      </div>

      <button
        onClick={handleSignIn}
        disabled={loading}
        className="w-full py-3 bg-gradient-to-r from-red-600 to-purple-600 text-white font-semibold rounded-lg hover:from-red-700 hover:to-purple-700 transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
      >
        <Shield className="w-5 h-5" />
        <span>Sign In with Wolf Logic SSO</span>
      </button>

      <div className="text-center">
        <p className="text-xs text-gray-500">
          By signing in, you agree to our Terms of Service and Privacy Policy
        </p>
        <p className="text-xs text-gray-600 mt-1">
          Powered by Authentik • Supports Google OAuth
        </p>
      </div>
    </div>
  );
}
