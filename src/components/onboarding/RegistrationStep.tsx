import { useState } from 'react';
import { User, Mail, Phone, Gift } from 'lucide-react';

interface RegistrationStepProps {
  onSubmit: (username: string, email: string, phoneNumber: string, referralCode?: string) => void;
}

export default function RegistrationStep({ onSubmit }: RegistrationStepProps) {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [referralCode, setReferralCode] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(username, email, phoneNumber, referralCode || undefined);
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-2">Create Your Account</h2>
      <p className="text-gray-400 mb-6">Join the TaiScale mesh network and start contributing to the hive consciousness</p>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="username" className="block text-sm font-medium text-gray-300 mb-2">
            Username
          </label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-black border border-gray-800 rounded-lg text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
              placeholder="Choose a unique username"
              required
              minLength={3}
              maxLength={30}
            />
          </div>
          <p className="mt-1 text-xs text-gray-600">3-30 characters</p>
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
            Email Address
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-black border border-gray-800 rounded-lg text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
              placeholder="your@email.com"
              required
            />
          </div>
          <p className="mt-1 text-xs text-gray-600">You'll receive an 8-digit verification PIN</p>
        </div>

        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-gray-300 mb-2">
            Phone Number
          </label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input
              id="phone"
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-black border border-gray-800 rounded-lg text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
              placeholder="+1 (555) 000-0000"
              required
            />
          </div>
          <p className="mt-1 text-xs text-gray-600">Required for RCS verification</p>
        </div>

        <div>
          <label htmlFor="referral" className="block text-sm font-medium text-gray-300 mb-2">
            Referral Code <span className="text-gray-600">(Optional)</span>
          </label>
          <div className="relative">
            <Gift className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input
              id="referral"
              type="text"
              value={referralCode}
              onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
              className="w-full pl-11 pr-4 py-3 bg-black border border-gray-800 rounded-lg text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all uppercase"
              placeholder="Enter referral code"
              maxLength={8}
            />
          </div>
          <p className="mt-1 text-xs text-green-400">Get rewarded! 10 referrals = free app + first month free</p>
        </div>

        <button
          type="submit"
          className="w-full py-3 bg-gradient-to-r from-red-600 to-red-700 text-white font-semibold rounded-lg hover:from-red-700 hover:to-red-800 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-black transition-all transform hover:scale-[1.02]"
        >
          Continue to Verification
        </button>
      </form>
    </div>
  );
}
