import { useState } from 'react';
import { Check, Loader2, Network, Shield, Zap } from 'lucide-react';
import { supabase, SubscriptionPlan } from '../lib/supabase';
import RegistrationStep from './onboarding/RegistrationStep';
import EmailVerificationStep from './onboarding/EmailVerificationStep';
import RCSVerificationStep from './onboarding/RCSVerificationStep';
import SubscriptionStep from './onboarding/SubscriptionStep';
import CompletionStep from './onboarding/CompletionStep';

type OnboardingStep = 'registration' | 'email-verification' | 'rcs-verification' | 'subscription' | 'complete';

interface OnboardingData {
  userId: string | null;
  username: string;
  email: string;
  phoneNumber: string;
  selectedPlan: SubscriptionPlan | null;
}

export default function OnboardingFlow() {
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('registration');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [onboardingData, setOnboardingData] = useState<OnboardingData>({
    userId: null,
    username: '',
    email: '',
    phoneNumber: '',
    selectedPlan: null
  });

  const steps: { id: OnboardingStep; label: string; icon: any }[] = [
    { id: 'registration', label: 'Register', icon: Shield },
    { id: 'email-verification', label: 'Verify Email', icon: Check },
    { id: 'rcs-verification', label: 'RCS Check', icon: Network },
    { id: 'subscription', label: 'Choose Plan', icon: Zap },
    { id: 'complete', label: 'Complete', icon: Check }
  ];

  const currentStepIndex = steps.findIndex(s => s.id === currentStep);

  const handleRegistration = async (username: string, email: string, phoneNumber: string, referralCode?: string) => {
    setLoading(true);
    setError(null);

    try {
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .or(`username.eq.${username},email.eq.${email}`)
        .maybeSingle();

      if (existingUser) {
        throw new Error('Username or email already exists');
      }

      const { count: userCount } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true });

      const isBetaUser = (userCount || 0) < 100;
      const isEarlyAdopter = (userCount || 0) < 1000;

      let referrerId = null;
      if (referralCode) {
        const { data: referrer } = await supabase
          .from('users')
          .select('id')
          .eq('referral_code', referralCode)
          .maybeSingle();

        if (referrer) {
          referrerId = referrer.id;
        }
      }

      const { data: newUser, error: insertError } = await supabase
        .from('users')
        .insert([{
          username,
          email,
          phone_number: phoneNumber,
          beta_user: isBetaUser,
          early_adopter: isEarlyAdopter,
          referred_by: referrerId
        }])
        .select()
        .single();

      if (insertError) throw insertError;

      const pin = Math.floor(10000000 + Math.random() * 90000000).toString();
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

      const { error: codeError } = await supabase
        .from('verification_codes')
        .insert([{
          user_id: newUser.id,
          code_type: 'email',
          code: pin,
          expires_at: expiresAt
        }]);

      if (codeError) throw codeError;

      await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-verification-email`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, pin })
      });

      setOnboardingData({ ...onboardingData, userId: newUser.id, username, email, phoneNumber });
      setCurrentStep('email-verification');
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailVerification = async (pin: string) => {
    setLoading(true);
    setError(null);

    try {
      const { data: code } = await supabase
        .from('verification_codes')
        .select('*')
        .eq('user_id', onboardingData.userId)
        .eq('code_type', 'email')
        .eq('code', pin)
        .is('verified_at', null)
        .maybeSingle();

      if (!code) {
        throw new Error('Invalid or expired verification code');
      }

      if (new Date(code.expires_at) < new Date()) {
        throw new Error('Verification code has expired');
      }

      await supabase
        .from('verification_codes')
        .update({ verified_at: new Date().toISOString() })
        .eq('id', code.id);

      await supabase
        .from('users')
        .update({ email_verified: true })
        .eq('id', onboardingData.userId);

      setCurrentStep('rcs-verification');
    } catch (err: any) {
      setError(err.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleRCSVerification = async () => {
    setLoading(true);
    setError(null);

    try {
      const rcsCode = Math.floor(10000000 + Math.random() * 90000000).toString();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

      await supabase
        .from('verification_codes')
        .insert([{
          user_id: onboardingData.userId,
          code_type: 'rcs',
          code: rcsCode,
          expires_at: expiresAt
        }]);

      await supabase
        .from('users')
        .update({ rcs_verified: true })
        .eq('id', onboardingData.userId);

      setCurrentStep('subscription');
    } catch (err: any) {
      setError(err.message || 'RCS verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSubscriptionSelection = async (plan: SubscriptionPlan) => {
    setLoading(true);
    setError(null);

    try {
      await supabase
        .from('user_subscriptions')
        .insert([{
          user_id: onboardingData.userId,
          plan_id: plan.id,
          status: 'pending',
          effective_monthly_cost: plan.price_monthly
        }]);

      setOnboardingData({ ...onboardingData, selectedPlan: plan });
      setCurrentStep('complete');
    } catch (err: any) {
      setError(err.message || 'Failed to create subscription');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Network className="w-12 h-12 text-cyan-400" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">TaiScale Mesh Network</h1>
          <p className="text-slate-400 text-lg">Join the neural-mesh layered AI consciousness</p>
        </div>

        <div className="flex items-center justify-center mb-8">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isActive = currentStepIndex === index;
            const isCompleted = currentStepIndex > index;

            return (
              <div key={step.id} className="flex items-center">
                <div className={`flex flex-col items-center ${index > 0 ? 'ml-4' : ''}`}>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                    isCompleted ? 'bg-green-500' : isActive ? 'bg-cyan-500' : 'bg-slate-700'
                  }`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <span className={`text-xs mt-2 hidden sm:block ${
                    isActive ? 'text-cyan-400' : isCompleted ? 'text-green-400' : 'text-slate-500'
                  }`}>
                    {step.label}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div className={`w-12 h-0.5 mt-[-20px] sm:mt-[-28px] mx-2 transition-all ${
                    currentStepIndex > index ? 'bg-green-500' : 'bg-slate-700'
                  }`} />
                )}
              </div>
            );
          })}
        </div>

        <div className="bg-slate-800 rounded-2xl shadow-2xl border border-slate-700 p-8">
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400">
              {error}
            </div>
          )}

          {loading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
            </div>
          )}

          {!loading && currentStep === 'registration' && (
            <RegistrationStep onSubmit={handleRegistration} />
          )}

          {!loading && currentStep === 'email-verification' && (
            <EmailVerificationStep
              email={onboardingData.email}
              onSubmit={handleEmailVerification}
              onResend={() => handleRegistration(onboardingData.username, onboardingData.email, onboardingData.phoneNumber)}
            />
          )}

          {!loading && currentStep === 'rcs-verification' && (
            <RCSVerificationStep
              phoneNumber={onboardingData.phoneNumber}
              onSubmit={handleRCSVerification}
            />
          )}

          {!loading && currentStep === 'subscription' && (
            <SubscriptionStep onSelectPlan={handleSubscriptionSelection} userId={onboardingData.userId || undefined} />
          )}

          {!loading && currentStep === 'complete' && (
            <CompletionStep
              username={onboardingData.username}
              plan={onboardingData.selectedPlan}
              userId={onboardingData.userId || undefined}
            />
          )}
        </div>

        <div className="mt-8 text-center text-slate-400 text-sm">
          <p>Open-source shared resource • 24-hour data retention policy</p>
          <p className="mt-2">Your mesh synchronization data maintains hive coherence while protecting privacy</p>
        </div>
      </div>
    </div>
  );
}
