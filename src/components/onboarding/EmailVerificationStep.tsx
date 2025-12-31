import { useState } from 'react';
import { Mail, RefreshCw } from 'lucide-react';

interface EmailVerificationStepProps {
  email: string;
  onSubmit: (pin: string) => void;
  onResend: () => void;
}

export default function EmailVerificationStep({ email, onSubmit, onResend }: EmailVerificationStepProps) {
  const [pin, setPin] = useState(['', '', '', '', '', '', '', '']);
  const [resending, setResending] = useState(false);

  const handlePinChange = (index: number, value: string) => {
    if (value.length > 1) {
      value = value[0];
    }

    if (!/^\d*$/.test(value)) {
      return;
    }

    const newPin = [...pin];
    newPin[index] = value;
    setPin(newPin);

    if (value && index < 7) {
      const nextInput = document.getElementById(`pin-${index + 1}`);
      nextInput?.focus();
    }

    if (newPin.every(digit => digit !== '') && newPin.length === 8) {
      onSubmit(newPin.join(''));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !pin[index] && index > 0) {
      const prevInput = document.getElementById(`pin-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handleResend = async () => {
    setResending(true);
    await onResend();
    setTimeout(() => setResending(false), 2000);
  };

  return (
    <div>
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-cyan-500/10 rounded-full mb-4">
          <Mail className="w-8 h-8 text-cyan-400" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Verify Your Email</h2>
        <p className="text-slate-400">
          We've sent an 8-digit PIN to <span className="text-cyan-400 font-medium">{email}</span>
        </p>
      </div>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-3 text-center">
            Enter 8-Digit PIN
          </label>
          <div className="flex justify-center gap-2">
            {pin.map((digit, index) => (
              <input
                key={index}
                id={`pin-${index}`}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handlePinChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className="w-12 h-14 text-center text-2xl font-bold bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all"
              />
            ))}
          </div>
        </div>

        <div className="text-center">
          <button
            type="button"
            onClick={handleResend}
            disabled={resending}
            className="inline-flex items-center gap-2 text-sm text-cyan-400 hover:text-cyan-300 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${resending ? 'animate-spin' : ''}`} />
            Resend verification code
          </button>
        </div>

        <div className="bg-slate-900/50 border border-slate-700 rounded-lg p-4">
          <p className="text-sm text-slate-400">
            <span className="font-semibold text-slate-300">Note:</span> Check your spam folder if you don't see the email.
            The verification code expires in 15 minutes.
          </p>
        </div>
      </div>
    </div>
  );
}
