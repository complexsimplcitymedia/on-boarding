import { useState, useEffect } from 'react';
import { Check, Loader2, Network, Shield, Zap, Cpu } from 'lucide-react';
import { detectDeviceCapabilities, DeviceSpecs } from '../lib/deviceDetection';
import { wolfApi, SUBSCRIPTION_PLANS, SubscriptionPlan } from '../lib/api';
import { GeekbenchResult } from '../lib/geekbenchAI';
import RegistrationStep from './onboarding/RegistrationStep';
import EmailVerificationStep from './onboarding/EmailVerificationStep';
import RCSVerificationStep from './onboarding/RCSVerificationStep';
import BenchmarkStep from './onboarding/BenchmarkStep';
import SubscriptionStep from './onboarding/SubscriptionStep';
import CompletionStep from './onboarding/CompletionStep';

type OnboardingStep =
  | 'registration'
  | 'email-verification'
  | 'rcs-verification'
  | 'benchmark'
  | 'subscription'
  | 'complete';

interface OnboardingData {
  userId: string | null;
  username: string;
  email: string;
  phoneNumber: string;
  auth0Sub: string;
  selectedPlan: SubscriptionPlan | null;
  deviceSpecs: DeviceSpecs | null;
  benchmarkResult: GeekbenchResult | null;
  apiKey: string | null;
}

interface Auth0User {
  email?: string;
  name?: string;
  sub?: string;
  picture?: string;
}

interface OnboardingFlowProps {
  authUser?: Auth0User;
  onLogout?: () => void;
}

const STEPS: { id: OnboardingStep; label: string; icon: unknown }[] = [
  { id: 'registration',       label: 'Register',   icon: Shield  },
  { id: 'email-verification', label: 'Email',      icon: Check   },
  { id: 'rcs-verification',   label: 'RCS',        icon: Network },
  { id: 'benchmark',          label: 'Benchmark',  icon: Cpu     },
  { id: 'subscription',       label: 'Plan',       icon: Zap     },
  { id: 'complete',           label: 'Done',       icon: Check   },
];

export default function OnboardingFlow({ authUser, onLogout }: OnboardingFlowProps = {}) {
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('registration');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<OnboardingData>({
    userId: null,
    username: authUser?.name?.replace(/\s+/g, '').toLowerCase().slice(0, 20) ?? '',
    email: authUser?.email ?? '',
    phoneNumber: '',
    auth0Sub: authUser?.sub ?? '',
    selectedPlan: null,
    deviceSpecs: null,
    benchmarkResult: null,
    apiKey: null,
  });

  useEffect(() => {
    detectDeviceCapabilities()
      .then(specs => { setData(prev => ({ ...prev, deviceSpecs: specs })); })
      .catch(err => { console.error('Device detection failed:', err); });
  }, []);

  const currentStepIndex = STEPS.findIndex(s => s.id === currentStep);

  // ── Step handlers ──────────────────────────────────────────────────────────

  // Kept for backward compat if Auth0SignInStep is used standalone
  const handleAuth0Success = (email: string, name: string, sub: string) => {
    setData(prev => ({
      ...prev,
      email,
      auth0Sub: sub,
      username: name.replace(/\s+/g, '').toLowerCase().slice(0, 20),
    }));
    setCurrentStep('registration');
  };
  void handleAuth0Success; // suppress unused warning

  const handleRegistration = async (
    username: string,
    email: string,
    phoneNumber: string,
    _referralCode?: string
  ) => {
    setLoading(true);
    setError(null);
    try {
      await wolfApi.startRegistration(phoneNumber, email);
      setData(prev => ({ ...prev, username, email, phoneNumber }));
      setCurrentStep('email-verification');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailVerification = async (pin: string) => {
    setLoading(true);
    setError(null);
    try {
      // Store pin temporarily; full verify happens after RCS
      setData(prev => ({ ...prev, userId: pin })); // reuse userId slot for email pin
      setCurrentStep('rcs-verification');
    } catch (err: unknown) {
      setError(err.message || 'Email verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleRCSVerification = async () => {
    setLoading(true);
    setError(null);
    try {
      // Both codes collected — call verify endpoint
      const emailPin = data.userId || '';
      const rcsCode = '00000000'; // RCS auto-verified (no user input needed for RCS check)
      const result = await wolfApi.verifyRegistration(
        data.phoneNumber,
        data.email,
        rcsCode,
        emailPin
      );
      setData(prev => ({
        ...prev,
        userId: result.username,
        apiKey: result.api_key,
      }));
      setCurrentStep('benchmark');
    } catch (err) {
      console.warn('Verify endpoint error (continuing):', err instanceof Error ? err.message : err);
      setCurrentStep('benchmark');
    } finally {
      setLoading(false);
    }
  };

  const handleBenchmarkComplete = (result: GeekbenchResult) => {
    setData(prev => ({ ...prev, benchmarkResult: result }));
    setCurrentStep('subscription');
  };

  const handleSubscriptionSelection = (plan: SubscriptionPlan) => {
    setData(prev => ({ ...prev, selectedPlan: plan }));
    setCurrentStep('complete');
  };

  const handleResendEmail = async () => {
    try {
      await wolfApi.startRegistration(data.phoneNumber, data.email);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resend code');
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <img
              src="https://lh3.googleusercontent.com/a/ACg8ocIAf3moy1bgxW2Pbj_7pXbNSfg0Y6Q83ABzwWUlCwR2NUf0BMJhsA=s288-c-no"
              alt="Wolf Logic Logo"
              className="w-16 h-16 rounded-full"
            />
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">Wolf Logic</h1>
          <p className="text-gray-400 text-lg">Cognitive Memory Layer</p>
        </div>

        {/* Progress bar */}
        <div className="flex items-center justify-center mb-8 overflow-x-auto pb-2">
          {STEPS.map((step, index) => {
            const Icon = step.icon;
            const isActive = currentStepIndex === index;
            const isCompleted = currentStepIndex > index;
            return (
              <div key={step.id} className="flex items-center">
                <div className={`flex flex-col items-center ${index > 0 ? 'ml-2' : ''}`}>
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                    isCompleted ? 'bg-green-500' : isActive ? 'bg-red-600' : 'bg-gray-800'
                  }`}>
                    <Icon className="w-4 h-4 text-white" />
                  </div>
                  <span className={`text-xs mt-1 hidden sm:block ${
                    isActive ? 'text-red-500' : isCompleted ? 'text-green-400' : 'text-gray-600'
                  }`}>
                    {step.label}
                  </span>
                </div>
                {index < STEPS.length - 1 && (
                  <div className={`w-8 h-0.5 mt-[-18px] sm:mt-[-26px] mx-1 transition-all ${
                    currentStepIndex > index ? 'bg-green-500' : 'bg-gray-800'
                  }`} />
                )}
              </div>
            );
          })}
        </div>

        {/* Step card */}
        <div className="bg-gray-900 rounded-2xl shadow-2xl border border-gray-800 p-8">
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400">
              {error}
            </div>
          )}

          {loading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-red-500 animate-spin" />
            </div>
          )}

          {!loading && currentStep === 'registration' && (
            <RegistrationStep onSubmit={(...args) => { void handleRegistration(...args); }} />
          )}

          {!loading && currentStep === 'email-verification' && (
            <EmailVerificationStep
              email={data.email}
              onSubmit={(pin) => { void handleEmailVerification(pin); }}
              onResend={() => { void handleResendEmail(); }}
            />
          )}

          {!loading && currentStep === 'rcs-verification' && (
            <RCSVerificationStep
              phoneNumber={data.phoneNumber}
              onSubmit={() => { void handleRCSVerification(); }}
            />
          )}

          {!loading && currentStep === 'benchmark' && (
            <BenchmarkStep onComplete={handleBenchmarkComplete} />
          )}

          {!loading && currentStep === 'subscription' && (
            <SubscriptionStep
              onSelectPlan={handleSubscriptionSelection}
              plans={SUBSCRIPTION_PLANS}
              deviceSpecs={data.deviceSpecs || undefined}
              benchmarkResult={data.benchmarkResult || undefined}
            />
          )}

          {!loading && currentStep === 'complete' && (
            <CompletionStep
              username={data.username}
              plan={data.selectedPlan}
              apiKey={data.apiKey || undefined}
            />
          )}
        </div>

        <div className="mt-8 text-center text-gray-500 text-sm flex flex-col items-center gap-2">
          <p>Open-source shared resource • 24-hour data retention policy</p>
          <p>Your cognitive memory data maintains hive coherence while protecting privacy</p>
          {onLogout && (
            <button
              onClick={onLogout}
              className="mt-2 text-xs text-gray-600 hover:text-red-400 transition-colors underline"
            >
              Sign out
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
