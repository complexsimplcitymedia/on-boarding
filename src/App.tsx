import { useAuth0 } from "@auth0/auth0-react";
import OnboardingFlow from "./components/OnboardingFlow";

function App() {
  const {
    isLoading,
    isAuthenticated,
    error,
    loginWithRedirect: login,
    logout: auth0Logout,
    user,
  } = useAuth0();

  const signup = () =>
    login({ authorizationParams: { screen_hint: "signup" } });

  const logout = () =>
    auth0Logout({ logoutParams: { returnTo: window.location.origin } });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  if (isAuthenticated && user) {
    return <OnboardingFlow authUser={user} onLogout={logout} />;
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-md text-center">
        <div className="flex items-center justify-center mb-6">
          <img
            src="https://lh3.googleusercontent.com/a/ACg8ocIAf3moy1bgxW2Pbj_7pXbNSfg0Y6Q83ABzwWUlCwR2NUf0BMJhsA=s288-c-no"
            alt="Wolf Logic Logo"
            className="w-20 h-20 rounded-full"
          />
        </div>
        <h1 className="text-4xl font-bold text-white mb-2">Wolf Logic</h1>
        <p className="text-gray-400 text-lg mb-8">Cognitive Memory Layer</p>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400 text-sm">
            {error.message}
          </div>
        )}

        <div className="space-y-3">
          <button
            onClick={signup}
            className="w-full py-3 bg-gradient-to-r from-red-600 to-purple-600 text-white font-semibold rounded-lg hover:from-red-700 hover:to-purple-700 transition-all transform hover:scale-[1.02]"
          >
            Create Account
          </button>
          <button
            onClick={() => login()}
            className="w-full py-3 bg-gray-800 border border-gray-700 text-white font-semibold rounded-lg hover:bg-gray-700 transition-all"
          >
            Sign In
          </button>
        </div>

        <p className="mt-8 text-xs text-gray-600">
          Powered by Auth0 • Secure SSO
        </p>
      </div>
    </div>
  );
}

export default App;
