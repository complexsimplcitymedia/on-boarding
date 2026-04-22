import { MessageSquare, Shield, CheckCircle } from 'lucide-react';

interface RCSVerificationStepProps {
  phoneNumber: string;
  onSubmit: () => void;
}

export default function RCSVerificationStep({ phoneNumber, onSubmit }: RCSVerificationStepProps) {
  return (
    <div>
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-green-500/10 rounded-full mb-4">
          <MessageSquare className="w-8 h-8 text-green-400" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">RCS Verification</h2>
        <p className="text-slate-400">
          Verifying Rich Communication Services for <span className="text-green-400 font-medium">{phoneNumber}</span>
        </p>
      </div>

      <div className="space-y-6">
        <div className="bg-slate-900/50 border border-slate-700 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5 text-green-400" />
            What is RCS Verification?
          </h3>
          <p className="text-slate-400 mb-4">
            Rich Communication Services (RCS) is the next-generation messaging protocol that ensures secure,
            real-time communication with the TaiScale mesh network.
          </p>
          <ul className="space-y-3">
            <li className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
              <span className="text-slate-300">Prevents void messages and SMS fallback issues</span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
              <span className="text-slate-300">Ensures mesh synchronization integrity</span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
              <span className="text-slate-300">Enables real-time neural-mesh updates</span>
            </li>
          </ul>
        </div>

        <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/30 rounded-lg p-4">
          <div className="flex items-center gap-3 mb-2">
            <CheckCircle className="w-5 h-5 text-green-400" />
            <span className="text-green-300 font-semibold">RCS Capability Detected</span>
          </div>
          <p className="text-sm text-slate-400">
            Your device supports RCS messaging. No void or SMS fallback detected.
          </p>
        </div>

        <button
          onClick={onSubmit}
          className="w-full py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold rounded-lg hover:from-green-600 hover:to-emerald-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:ring-offset-slate-800 transition-all transform hover:scale-[1.02]"
        >
          Confirm RCS Verification
        </button>

        <p className="text-center text-xs text-slate-500">
          This verification ensures seamless integration with the mesh network
        </p>
      </div>
    </div>
  );
}
