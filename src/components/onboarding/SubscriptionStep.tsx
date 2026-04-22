import { useState } from 'react';
import { Check, Zap, Server, Code, Crown, Gift, Star, Cpu } from 'lucide-react';
import { SubscriptionPlan } from '../../lib/api';
import { DeviceSpecs, getCapabilityMessage, getPlanCompatibility } from '../../lib/deviceDetection';
import { GeekbenchResult } from '../../lib/geekbenchAI';

interface SubscriptionStepProps {
  onSelectPlan: (plan: SubscriptionPlan) => void;
  plans: SubscriptionPlan[];
  deviceSpecs?: DeviceSpecs;
  benchmarkResult?: GeekbenchResult;
}

export default function SubscriptionStep({ onSelectPlan, plans, deviceSpecs, benchmarkResult }: SubscriptionStepProps) {
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);

  const getPlanIcon = (planName: string) => {
    if (planName.toLowerCase().includes('enterprise') || planName.toLowerCase().includes('premium')) return Crown;
    if (planName.toLowerCase().includes('server') || planName.toLowerCase().includes('compute')) return Server;
    if (planName.toLowerCase().includes('free') || planName.toLowerCase().includes('self')) return Code;
    return Zap;
  };

  const handleSelectPlan = (plan: SubscriptionPlan) => {
    setSelectedPlanId(plan.id);
    setTimeout(() => { onSelectPlan(plan); }, 300);
  };

  // Determine if user qualifies for beta/early adopter based on benchmark
  const isFlagship = benchmarkResult?.deviceClass === 'flagship';

  return (
    <div>
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-white mb-2">Choose Your Plan</h2>
        <p className="text-gray-400">
          All plans support the open-source mission. No contracts, cancel anytime.
        </p>
      </div>

      {/* Device info from benchmark */}
      {benchmarkResult && (
        <div className="mb-6 p-4 bg-gray-900 border border-gray-800 rounded-lg">
          <div className="flex items-center gap-3 mb-2">
            <Cpu className="w-5 h-5 text-red-500" />
            <h3 className="text-sm font-semibold text-white">Your Device — Geekbench AI Score</h3>
          </div>
          <div className="grid grid-cols-4 gap-3 mt-3">
            <div className="text-center">
              <div className="text-xs text-gray-500 mb-1">INT8</div>
              <div className="text-lg font-bold text-white">{benchmarkResult.int8Score.toLocaleString()}</div>
            </div>
            <div className="text-center">
              <div className="text-xs text-gray-500 mb-1">FP16</div>
              <div className="text-lg font-bold text-white">{benchmarkResult.fp16Score.toLocaleString()}</div>
            </div>
            <div className="text-center">
              <div className="text-xs text-gray-500 mb-1">FP32</div>
              <div className="text-lg font-bold text-white">{benchmarkResult.fp32Score.toLocaleString()}</div>
            </div>
            <div className="text-center">
              <div className="text-xs text-red-400 mb-1">Overall</div>
              <div className="text-lg font-bold text-red-400">{benchmarkResult.overallScore.toLocaleString()}</div>
            </div>
          </div>
          <div className="mt-2 flex items-center justify-between">
            <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
              benchmarkResult.deviceClass === 'flagship' ? 'bg-green-500/20 text-green-400' :
              benchmarkResult.deviceClass === 'high-end' ? 'bg-blue-500/20 text-blue-400' :
              benchmarkResult.deviceClass === 'mid-range' ? 'bg-yellow-500/20 text-yellow-400' :
              'bg-gray-500/20 text-gray-400'
            }`}>
              {benchmarkResult.deviceClass.toUpperCase()}
            </span>
            <span className="text-xs text-gray-500">{benchmarkResult.deviceInfo.processor}</span>
          </div>
        </div>
      )}

      {/* Device specs fallback */}
      {!benchmarkResult && deviceSpecs && (
        <div className="mb-6 p-4 bg-gray-900 border border-gray-800 rounded-lg">
          <div className="flex items-center gap-3 mb-2">
            <Cpu className="w-5 h-5 text-red-500" />
            <h3 className="text-sm font-semibold text-white">Device Capability Check</h3>
          </div>
          <p className="text-sm text-gray-400">{getCapabilityMessage(deviceSpecs)}</p>
          <div className="mt-2 text-xs text-gray-600">
            {deviceSpecs.type} • {deviceSpecs.os} • {deviceSpecs.cpuCores} cores • {deviceSpecs.ramGB}GB RAM
            {deviceSpecs.gpuAvailable && ' • GPU Available'}
          </div>
        </div>
      )}

      {isFlagship && (
        <div className="mb-6 p-4 bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/30 rounded-lg">
          <div className="flex items-center gap-3">
            <Star className="w-6 h-6 text-yellow-400" />
            <div>
              <p className="text-yellow-300 font-bold">Flagship Device Detected</p>
              <p className="text-sm text-slate-400">Your device qualifies for full mesh participation</p>
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-6 mb-8">
        {plans.map((plan) => {
          const Icon = getPlanIcon(plan.name);
          const isPremium = plan.name.toLowerCase().includes('enterprise') || plan.name.toLowerCase().includes('premium');
          const isFree = plan.price_monthly === 0;
          const features = Array.isArray(plan.features) ? plan.features : [];
          const compatibility = deviceSpecs ? getPlanCompatibility(plan.name, deviceSpecs) : { compatible: true };

          return (
            <div
              key={plan.id}
              onClick={() => { handleSelectPlan(plan); }}
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
                    isPremium ? 'bg-gradient-to-br from-yellow-500/20 to-orange-500/20' :
                    isFree ? 'bg-gradient-to-br from-green-500/20 to-emerald-500/20' :
                    'bg-cyan-500/10'
                  }`}>
                    <Icon className={`w-6 h-6 ${isPremium ? 'text-yellow-400' : isFree ? 'text-green-400' : 'text-cyan-400'}`} />
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
                      <div className="text-3xl font-bold text-white">${plan.price_monthly.toFixed(2)}</div>
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
                  <p className="text-xs text-slate-400 mt-1">Run entirely on your flagship device. You own everything.</p>
                </div>
              )}
              {!isFree && !isPremium && (
                <div className="mb-4 p-3 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/30 rounded-lg">
                  <p className="text-sm text-cyan-300 font-semibold">Data stored on your device</p>
                  <p className="text-xs text-slate-400 mt-1">We handle compute, you keep your data locally</p>
                </div>
              )}
              {isPremium && (
                <div className="mb-4 p-3 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/30 rounded-lg">
                  <p className="text-sm text-yellow-300 font-semibold flex items-center gap-2">
                    <Zap className="w-4 h-4" />
                    {plan.is_introductory && 'Introductory pricing • '}Full cloud backup & retrieval
                  </p>
                  <p className="text-xs text-slate-400 mt-1">Complete vectorization, memory storage & retrieval technology</p>
                </div>
              )}

              {!compatibility.compatible && 'warning' in compatibility && (
                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                  <p className="text-sm text-red-300 font-semibold mb-1">Device Compatibility Warning</p>
                  <p className="text-xs text-gray-400">{String(compatibility.warning)}</p>
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
            You always own your data by design. Cancel anytime with no penalties.
          </p>
        </div>
      </div>
    </div>
  );
}
