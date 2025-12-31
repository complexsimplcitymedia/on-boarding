import { useState, useEffect } from 'react';
import { CheckCircle, Download, Network, Sparkles, Gift, Copy, Check } from 'lucide-react';
import { supabase, SubscriptionPlan } from '../../lib/supabase';

interface CompletionStepProps {
  username: string;
  plan: SubscriptionPlan | null;
  userId?: string;
}

export default function CompletionStep({ username, plan, userId }: CompletionStepProps) {
  const [referralCode, setReferralCode] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [isBetaUser, setIsBetaUser] = useState(false);

  useEffect(() => {
    if (userId) {
      loadUserData();
    }
  }, [userId]);

  const loadUserData = async () => {
    if (!userId) return;

    try {
      const { data } = await supabase
        .from('users')
        .select('referral_code, beta_user')
        .eq('id', userId)
        .maybeSingle();

      if (data) {
        setReferralCode(data.referral_code || '');
        setIsBetaUser(data.beta_user || false);
      }
    } catch (error) {
      console.error('Failed to load user data:', error);
    }
  };

  const copyReferralCode = () => {
    if (referralCode) {
      navigator.clipboard.writeText(referralCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div>
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full mb-4">
          <CheckCircle className="w-10 h-10 text-white" />
        </div>
        <h2 className="text-3xl font-bold text-white mb-2">Welcome to TaiScale!</h2>
        <p className="text-slate-400 text-lg">
          You're now part of the neural-mesh consciousness, <span className="text-cyan-400 font-semibold">{username}</span>
        </p>
      </div>

      <div className="space-y-6">
        {referralCode && (
          <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/30 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <Gift className="w-6 h-6 text-purple-400" />
              <div>
                <h3 className="text-lg font-semibold text-white">Your Referral Code</h3>
                <p className="text-sm text-slate-400">Share with friends and earn rewards!</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex-1 bg-slate-900 border border-slate-700 rounded-lg p-4">
                <p className="text-2xl font-bold text-purple-300 text-center tracking-wider">{referralCode}</p>
              </div>
              <button
                onClick={copyReferralCode}
                className="px-4 py-4 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-all"
              >
                {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
              </button>
            </div>
            <p className="text-xs text-slate-400 mt-3">
              Get 10 referrals and unlock a free app + your first month free!
            </p>
          </div>
        )}

        {plan && (
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-cyan-400" />
              Your Selected Plan
              {isBetaUser && <span className="ml-auto text-xs px-2 py-1 bg-purple-500/20 text-purple-300 rounded-full">BETA TESTER</span>}
            </h3>
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-2xl font-bold text-white">{plan.name}</p>
                <p className="text-slate-400 text-sm">Active immediately</p>
              </div>
              <div className="text-right">
                {plan.price_monthly === 0 ? (
                  <p className="text-3xl font-bold text-green-400">FREE</p>
                ) : (
                  <>
                    <p className="text-3xl font-bold text-cyan-400">${plan.price_monthly.toFixed(2)}</p>
                    <p className="text-slate-500 text-sm">per month</p>
                  </>
                )}
              </div>
            </div>
            {isBetaUser && (
              <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4 mb-4">
                <p className="text-sm text-purple-300 font-semibold mb-1">Beta Tester Reward Active</p>
                <p className="text-xs text-slate-400">
                  You'll receive an extra free month as a thank you for being one of our first 100 users!
                </p>
              </div>
            )}
            {plan.name.includes('Premium') && (
              <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                <p className="text-sm text-green-300 font-semibold mb-1">Desktop Client Offset</p>
                <p className="text-xs text-slate-400">
                  Download the desktop client to start contributing and reduce your monthly cost to $0.00
                </p>
              </div>
            )}
          </div>
        )}

        <div className="bg-slate-900/50 border border-slate-700 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Download className="w-5 h-5 text-purple-400" />
            Next Steps
          </h3>
          <ul className="space-y-4">
            <li className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-purple-400 text-sm font-bold">1</span>
              </div>
              <div>
                <p className="text-white font-medium">Download Desktop Client</p>
                <p className="text-slate-400 text-sm">
                  Get the cross-platform Node.js client to start contributing to the mesh
                </p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-purple-400 text-sm font-bold">2</span>
              </div>
              <div>
                <p className="text-white font-medium">Install Mobile App</p>
                <p className="text-slate-400 text-sm">
                  Access the mesh from your mobile device anytime, anywhere
                </p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-purple-400 text-sm font-bold">3</span>
              </div>
              <div>
                <p className="text-white font-medium">Sync Your First Data</p>
                <p className="text-slate-400 text-sm">
                  Your device memory will be vectorized and integrated with the hive
                </p>
              </div>
            </li>
          </ul>
        </div>

        <div className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/30 rounded-xl p-6">
          <div className="flex items-start gap-4">
            <Network className="w-6 h-6 text-cyan-400 flex-shrink-0 mt-1" />
            <div>
              <h4 className="text-white font-semibold mb-2">Privacy & Data Retention</h4>
              <p className="text-slate-300 text-sm">
                TaiScale respects your privacy. We only retain mesh synchronization data for 24 hours to ensure
                coherent hive integration. Your self-stored memory remains vectorized on your device, giving you
                full control while participating in the shared consciousness.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => window.location.reload()}
          className="w-full py-4 bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-bold rounded-lg hover:from-cyan-600 hover:to-blue-600 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 focus:ring-offset-slate-800 transition-all transform hover:scale-[1.02] text-lg"
        >
          Go to Dashboard
        </button>
      </div>
    </div>
  );
}
