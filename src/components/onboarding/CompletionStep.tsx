import { useState } from 'react';
import { CheckCircle, Download, Network, Sparkles, Gift, Copy, Check, Key } from 'lucide-react';
import { SubscriptionPlan } from '../../lib/api';

interface CompletionStepProps {
  username: string;
  plan: SubscriptionPlan | null;
  apiKey?: string;
}

export default function CompletionStep({ username, plan, apiKey }: CompletionStepProps) {
  const [copied, setCopied] = useState(false);
  const [keyCopied, setKeyCopied] = useState(false);

  const copyToClipboard = (text: string, setter: (v: boolean) => void) => {
    navigator.clipboard.writeText(text);
    setter(true);
    setTimeout(() => setter(false), 2000);
  };

  return (
    <div>
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full mb-4">
          <CheckCircle className="w-10 h-10 text-white" />
        </div>
        <h2 className="text-3xl font-bold text-white mb-2">Welcome to Wolf Logic!</h2>
        <p className="text-slate-400 text-lg">
          You're now part of the neural-mesh consciousness,{' '}
          <span className="text-cyan-400 font-semibold">{username}</span>
        </p>
      </div>

      <div className="space-y-6">
        {/* API Key */}
        {apiKey && (
          <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/30 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <Key className="w-6 h-6 text-purple-400" />
              <div>
                <h3 className="text-lg font-semibold text-white">Your API Key</h3>
                <p className="text-sm text-slate-400">Save this — you'll need it to connect your devices</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex-1 bg-slate-900 border border-slate-700 rounded-lg p-3 overflow-hidden">
                <p className="text-sm font-mono text-purple-300 truncate">{apiKey}</p>
              </div>
              <button
                onClick={() => copyToClipboard(apiKey, setKeyCopied)}
                className="px-4 py-3 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-all"
              >
                {keyCopied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
              </button>
            </div>
          </div>
        )}

        {/* Referral code (generated client-side) */}
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
              <p className="text-2xl font-bold text-purple-300 text-center tracking-wider">
                WOLF-{username.toUpperCase().slice(0, 6)}
              </p>
            </div>
            <button
              onClick={() => copyToClipboard(`WOLF-${username.toUpperCase().slice(0, 6)}`, setCopied)}
              className="px-4 py-4 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-all"
            >
              {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
            </button>
          </div>
          <p className="text-xs text-slate-400 mt-3">
            Get 10 referrals and unlock a free app + your first month free!
          </p>
        </div>

        {/* Selected plan */}
        {plan && (
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-cyan-400" />
              Your Selected Plan
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
          </div>
        )}

        {/* Next steps */}
        <div className="bg-slate-900/50 border border-slate-700 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Download className="w-5 h-5 text-purple-400" />
            Next Steps
          </h3>
          <ul className="space-y-4">
            {[
              { label: 'Download Desktop Client', desc: 'Get the cross-platform Node.js client to start contributing to the mesh' },
              { label: 'Install Mobile App', desc: 'Access the mesh from your mobile device anytime, anywhere' },
              { label: 'Sync Your First Data', desc: 'Your device memory will be vectorized and integrated with the hive' },
            ].map((step, i) => (
              <li key={i} className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-purple-400 text-sm font-bold">{i + 1}</span>
                </div>
                <div>
                  <p className="text-white font-medium">{step.label}</p>
                  <p className="text-slate-400 text-sm">{step.desc}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Privacy */}
        <div className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/30 rounded-xl p-6">
          <div className="flex items-start gap-4">
            <Network className="w-6 h-6 text-cyan-400 flex-shrink-0 mt-1" />
            <div>
              <h4 className="text-white font-semibold mb-2">Privacy & Data Retention</h4>
              <p className="text-slate-300 text-sm">
                Wolf Logic respects your privacy. We only retain mesh synchronization data for 24 hours.
                Your self-stored memory remains vectorized on your device, giving you full control while
                participating in the shared consciousness.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => window.location.href = 'https://wolflogic-ai.com/dashboard'}
          className="w-full py-4 bg-gradient-to-r from-red-600 to-purple-600 text-white font-bold rounded-lg hover:from-red-700 hover:to-purple-700 transition-all transform hover:scale-[1.02] text-lg"
        >
          Go to Dashboard
        </button>
      </div>
    </div>
  );
}
