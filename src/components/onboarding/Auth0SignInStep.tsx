import { useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { Shield, Loader2 } from 'lucide-react';

interface Auth0SignInStepProps {
  onSuccess: (email: string, name: string, sub: string) => void;
}

export default function Auth0SignInStep({ onSuccess }: Auth0SignInStepProps) {
  const { loginWithRedirect, isAuthenticated, isLoading, user, error } = useAuth0();

  useEffect(() => {
    if (isAuthenticated && user) {
      onSuccess(user.email ?? '', user.name ?? '', user.sub ?? '');
    }
  }, [isAuthenticated, user, onSuccess]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-red-500 to-purple-600 mb-4">
            <Loader2 className="w-8 h-8 text-white animate-spin" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Authenticating...</h2>
          <p className="text-gray-400">Please wait while we verify your credentials</p>
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
          {error.message}
        </div>
      )}

      <div className="bg-gray-800/50 rounded-lg p-6 space-y-4">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="text-sm text-gray-300">Secure SSO authentication powered by Auth0</p>
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

      <button
        onClick={() => loginWithRedirect()}
        className="w-full py-3 bg-gradient-to-r from-red-600 to-purple-600 text-white font-semibold rounded-lg hover:from-red-700 hover:to-purple-700 transition-all transform hover:scale-[1.02] flex items-center justify-center space-x-2"
      >
        <Shield className="w-5 h-5" />
        <span>Sign In with Wolf Logic</span>
      </button>

      <div className="text-center">
        <p className="text-xs text-gray-500">
          By signing in, you agree to our Terms of Service and Privacy Policy
        </p>
        <p className="text-xs text-gray-600 mt-1">
          Powered by Auth0 • Supports Google, GitHub &amp; more
        </p>
      </div>
    </div>
  );
}
