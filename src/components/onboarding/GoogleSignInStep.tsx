import { useState } from 'react';
import { GoogleLogin, CredentialResponse } from '@react-oauth/google';
import { Shield, Phone } from 'lucide-react';
import { authenticateWithGoogle } from '../../lib/auth';

interface GoogleSignInStepProps {
  onSuccess: (userId: string, email: string, name: string) => void;
}

export default function GoogleSignInStep({ onSuccess }: GoogleSignInStepProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [showPhoneInput, setShowPhoneInput] = useState(false);
  const [pendingCredential, setPendingCredential] = useState<string | null>(null);

  const handleGoogleSuccess = async (credentialResponse: CredentialResponse) => {
    if (!credentialResponse.credential) {
      setError('Failed to get Google credentials');
      return;
    }

    // First time: show phone input
    if (!showPhoneInput) {
      setPendingCredential(credentialResponse.credential);
      setShowPhoneInput(true);
      return;
    }

    // Second time: complete registration
    await completeRegistration(credentialResponse.credential);
  };

  const completeRegistration = async (credential: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await authenticateWithGoogle(
        credential,
        phoneNumber || undefined,
        referralCode || undefined
      );

      onSuccess(response.user.id, response.user.email, response.user.name);
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handlePhoneSubmit = async () => {
    if (!pendingCredential) {
      setError('Session expired, please sign in again');
      setShowPhoneInput(false);
      return;
    }

    await completeRegistration(pendingCredential);
  };

  if (showPhoneInput) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-red-500 to-purple-600 mb-4">
            <Phone className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Additional Info</h2>
          <p className="text-gray-400">
            Help us set up your cognitive memory layer
          </p>
        </div>

        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400 text-sm">
            {error}
          </div>
        )}

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
          onClick={handlePhoneSubmit}
          disabled={loading}
          className="w-full py-3 bg-gradient-to-r from-red-600 to-purple-600 text-white font-semibold rounded-lg hover:from-red-700 hover:to-purple-700 transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Creating Account...' : 'Complete Registration'}
        </button>

        <button
          onClick={() => { setShowPhoneInput(false); setPendingCredential(null); }}
          className="w-full py-2 text-gray-400 hover:text-white text-sm transition-all"
        >
          Back to Sign In
        </button>
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
          Sign in with Google to get started with your Cognitive Memory Layer
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
          <p className="text-sm text-gray-300">Secure Google OAuth authentication</p>
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

      <div className="flex justify-center">
        <GoogleLogin
          onSuccess={handleGoogleSuccess}
          onError={() => setError('Google Sign-In failed')}
          useOneTap
          theme="filled_black"
          size="large"
          text="continue_with"
          shape="rectangular"
        />
      </div>

      <div className="text-center">
        <p className="text-xs text-gray-500">
          By signing in, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  );
}
