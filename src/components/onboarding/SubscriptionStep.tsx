import { useState, useEffect } from 'react';
import { Check, Zap, Server, Code, Crown, Loader2, Gift, Star } from 'lucide-react';
import { supabase, SubscriptionPlan } from '../../lib/supabase';

interface SubscriptionStepProps {
  onSelectPlan: (plan: SubscriptionPlan) => void;
  userId?: string;
}

export default function SubscriptionStep({ onSelectPlan, userId }: SubscriptionStepProps) {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [isBetaUser, setIsBetaUser] = useState(false);
  const [isEarlyAdopter, setIsEarlyAdopter] = useState(false);

  useEffect(() => {
    loadPlans();
    if (userId) {
      checkUserStatus();
    }
  }, [userId]);

  const loadPlans = async () => {
    try {
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('active', true)
        .order('price_monthly', { ascending: true });

      if (error) throw error;
      setPlans(data || []);
    } catch (error) {
      console.error('Failed to load plans:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkUserStatus = async () => {
    if (!userId) return;

    try {
      const { data } = await supabase
        .from('users')
        .select('beta_user, early_adopter')
        .eq('id', userId)
        .maybeSingle();

      if (data) {
        setIsBetaUser(data.beta_user);
        setIsEarlyAdopter(data.early_adopter);
      }
    } catch (error) {
      console.error('Failed to check user status:', error);
    }
  };

  const getPlanIcon = (planName: string) => {
    if (planName.includes('Premium')) return Crown;
    if (planName.includes('Compute')) return Server;
    if (planName.includes('Free') || planName.includes('Self-Hosted')) return Code;
    return Zap;
  };

  const handleSelectPlan = (plan: SubscriptionPlan) => {
    setSelectedPlanId(plan.id);
    setTimeout(() => onSelectPlan(plan), 300);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-white mb-2">Choose Your Plan</h2>
        <p className="text-slate-400">
          All plans support the open-source mission. No contracts, cancel anytime.
        </p>
      </div>

      {(isBetaUser || isEarlyAdopter) && (
        <div className="mb-6 p-4 bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/30 rounded-lg">
          <div className="flex items-center gap-3 mb-2">
            {isBetaUser ? (
              <>
                <Gift className="w-6 h-6 text-purple-400" />
                <div>
                  <p className="text-purple-300 font-bold">Beta Tester Reward!</p>
                  <p className="text-sm text-slate-400">You're one of the first 100 users - enjoy an extra free month!</p>
                </div>
              </>
            ) : (
              <>
                <Star className="w-6 h-6 text-yellow-400" />
                <div>
                  <p className="text-yellow-300 font-bold">Early Adopter Pricing!</p>
                  <p className="text-sm text-slate-400">Locked into introductory pricing forever</p>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <div className="grid gap-6 mb-8">
        {plans.map((plan) => {
          const Icon = getPlanIcon(plan.name);
          const isPremium = plan.name.includes('Premium');
          const isFree = plan.name.includes('Free') || plan.name.includes('Self-Hosted');
          const features = Array.isArray(plan.features) ? plan.features : [];

          return (
            <div
              key={plan.id}
              onClick={() => handleSelectPlan(plan)}
              className={`relative bg-slate-900 border rounded-xl p-6 cursor-pointer transition-all transform hover:scale-[1.02] ${
                selectedPlanId === plan.id
                  ? 'border-cyan-500 ring-2 ring-cyan-500/50'
                  : isPremium
                  ? 'border-yellow-500/50'
                  : 'border-slate-700 hover:border-slate-600'
              }`}
            >
              {isPremium && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-xs font-bold rounded-full">
                  BEST VALUE
                </div>
              )}

              {isFree && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs font-bold rounded-full">
                  OPEN SOURCE
                </div>
              )}

              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                    isPremium
                      ? 'bg-gradient-to-br from-yellow-500/20 to-orange-500/20'
                      : isFree
                      ? 'bg-gradient-to-br from-green-500/20 to-emerald-500/20'
                      : 'bg-cyan-500/10'
                  }`}>
                    <Icon className={`w-6 h-6 ${
                      isPremium
                        ? 'text-yellow-400'
                        : isFree
                        ? 'text-green-400'
                        : 'text-cyan-400'
                    }`} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">{plan.name}</h3>
                    <p className="text-xs text-slate-500">
                      {plan.api_calls_included > 0 && `${plan.api_calls_included.toLocaleString()} API calls/month`}
                      {plan.storage_gb > 0 && ` • ${plan.storage_gb}GB storage`}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  {plan.price_monthly === 0 ? (
                    <div className="text-3xl font-bold text-green-400">FREE</div>
                  ) : (
                    <>
                      <div className="text-3xl font-bold text-white">
                        ${plan.price_monthly.toFixed(2)}
                      </div>
                      <div className="text-sm text-slate-400">per month</div>
                    </>
                  )}
                </div>
              </div>

              {isFree && (
                <div className="mb-4 p-3 bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/30 rounded-lg">
                  <p className="text-sm text-green-300 font-semibold flex items-center gap-2">
                    <Code className="w-4 h-4" />
                    Build your own infrastructure
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Run entirely on your flagship device. You own everything.
                  </p>
                </div>
              )}

              {!isFree && !isPremium && (
                <div className="mb-4 p-3 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/30 rounded-lg">
                  <p className="text-sm text-cyan-300 font-semibold">
                    Data stored on your device
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    We handle compute, you keep your data locally
                  </p>
                </div>
              )}

              {isPremium && (
                <div className="mb-4 p-3 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/30 rounded-lg">
                  <p className="text-sm text-yellow-300 font-semibold flex items-center gap-2">
                    <Zap className="w-4 h-4" />
                    {plan.is_introductory && 'Introductory pricing • '}Full cloud backup & retrieval
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Complete vectorization, memory storage & retrieval technology
                  </p>
                </div>
              )}

              <ul className="space-y-3">
                {features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                    <span className="text-slate-300 text-sm">{feature}</span>
                  </li>
                ))}
              </ul>

              {selectedPlanId === plan.id && (
                <div className="absolute inset-0 border-2 border-cyan-500 rounded-xl pointer-events-none" />
              )}
            </div>
          );
        })}
      </div>

      <div className="space-y-4">
        <div className="bg-slate-900/50 border border-slate-700 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
            <Gift className="w-4 h-4 text-purple-400" />
            Referral Rewards
          </h4>
          <p className="text-xs text-slate-400">
            Share your referral code with friends. Get 10 referrals and unlock a free app + your first month free!
          </p>
        </div>

        <div className="bg-slate-900/50 border border-slate-700 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-white mb-2">No Contracts, Full Ownership</h4>
          <p className="text-xs text-slate-400">
            You always own your data by design. Cancel anytime with no penalties. The system is completely
            open source (except the Android app), so you can build your own infrastructure or run entirely
            on your device.
          </p>
        </div>
      </div>
    </div>
  );
}
