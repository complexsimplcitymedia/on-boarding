import { useState } from 'react';
import { Cpu, ExternalLink, Upload } from 'lucide-react';
import { GeekbenchResult, formatScore, getRecommendation } from '../../lib/geekbenchAI';

interface GeekbenchResultStepProps {
  onComplete: (result: GeekbenchResult) => void;
  onSkip: () => void;
}

export default function GeekbenchResultStep({ onComplete, onSkip }: GeekbenchResultStepProps) {
  const [resultUrl, setResultUrl] = useState('');
  const [manualScores, setManualScores] = useState({
    singleCore: '',
    multiCore: '',
    aiScore: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inputMethod, setInputMethod] = useState<'url' | 'manual' | null>(null);

  const handleUrlSubmit = async () => {
    if (!resultUrl) return;

    setLoading(true);
    setError(null);

    try {
      // Extract result ID from URL (e.g., https://browser.geekbench.com/v6/cpu/12345)
      const match = resultUrl.match(/geekbench\.com\/v\d+\/cpu\/(\d+)/);

      if (!match) {
        throw new Error('Invalid Geekbench result URL');
      }

      const resultId = match[1];

      // Fetch result from Geekbench (note: this may require CORS proxy)
      const response = await fetch(`https://browser.geekbench.com/v6/cpu/${resultId}.json`);

      if (!response.ok) {
        throw new Error('Failed to fetch Geekbench result');
      }

      const data = await response.json();

      // Parse Geekbench data
      const result: GeekbenchResult = {
        singleCoreScore: data.single_core_score || 0,
        multiCoreScore: data.multi_core_score || 0,
        aiScore: Math.round((data.single_core_score + data.multi_core_score) / 2), // Estimate
        deviceClass: classifyFromScores(data.single_core_score, data.multi_core_score),
        benchmarkDate: new Date().toISOString(),
        deviceInfo: {
          processor: data.system?.processor || 'Unknown',
          cores: data.system?.processor_count || navigator.hardwareConcurrency || 4,
          ramGB: data.system?.memory_gb || ((navigator as any).deviceMemory || 8),
          gpu: data.system?.gpu || 'Unknown'
        }
      };

      onComplete(result);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch Geekbench result. Try manual entry instead.');
    } finally {
      setLoading(false);
    }
  };

  const handleManualSubmit = () => {
    const singleCore = parseInt(manualScores.singleCore);
    const multiCore = parseInt(manualScores.multiCore);
    const aiScore = parseInt(manualScores.aiScore) || Math.round((singleCore + multiCore) / 2);

    if (!singleCore || !multiCore) {
      setError('Please enter valid scores');
      return;
    }

    const result: GeekbenchResult = {
      singleCoreScore: singleCore,
      multiCoreScore: multiCore,
      aiScore,
      deviceClass: classifyFromScores(singleCore, multiCore),
      benchmarkDate: new Date().toISOString(),
      deviceInfo: {
        processor: 'User Submitted',
        cores: navigator.hardwareConcurrency || 4,
        ramGB: (navigator as any).deviceMemory || 8,
        gpu: 'User Submitted'
      }
    };

    onComplete(result);
  };

  function classifyFromScores(singleCore: number, multiCore: number): 'flagship' | 'high-end' | 'mid-range' | 'entry-level' {
    const avgScore = (singleCore + multiCore) / 2;

    // Geekbench 6 score ranges (approximate)
    if (avgScore > 2500) return 'flagship';
    if (avgScore > 1800) return 'high-end';
    if (avgScore > 1200) return 'mid-range';
    return 'entry-level';
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-red-500 to-purple-600 mb-4">
          <Cpu className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Geekbench Results</h2>
        <p className="text-gray-400">
          Submit your Geekbench benchmark scores to get personalized plan recommendations
        </p>
      </div>

      {!inputMethod && (
        <div className="space-y-4">
          <div className="bg-gradient-to-br from-blue-900/20 to-purple-900/20 rounded-lg p-4 border border-blue-500/20">
            <p className="text-sm text-gray-300 mb-3">
              Run Geekbench 6 on your device to get accurate performance metrics for AI workloads.
            </p>
            <a
              href="https://www.geekbench.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-2 text-blue-400 hover:text-blue-300 text-sm"
            >
              <span>Download Geekbench</span>
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>

          <button
            onClick={() => setInputMethod('url')}
            className="w-full py-3 bg-gradient-to-r from-red-600 to-purple-600 text-white font-semibold rounded-lg hover:from-red-700 hover:to-purple-700 transition-all"
          >
            Enter Result URL
          </button>

          <button
            onClick={() => setInputMethod('manual')}
            className="w-full py-3 bg-gray-800 text-white font-semibold rounded-lg hover:bg-gray-700 transition-all border border-gray-700"
          >
            Enter Scores Manually
          </button>

          <button
            onClick={onSkip}
            className="w-full py-2 text-gray-400 hover:text-white text-sm transition-all"
          >
            Skip (Use device detection)
          </button>
        </div>
      )}

      {inputMethod === 'url' && (
        <div className="space-y-4">
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Geekbench Result URL
            </label>
            <input
              type="url"
              value={resultUrl}
              onChange={(e) => setResultUrl(e.target.value)}
              placeholder="https://browser.geekbench.com/v6/cpu/12345"
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500"
            />
            <p className="mt-2 text-xs text-gray-500">
              After running Geekbench, upload results and paste the browser link here
            </p>
          </div>

          <div className="flex space-x-3">
            <button
              onClick={handleUrlSubmit}
              disabled={loading || !resultUrl}
              className="flex-1 py-3 bg-gradient-to-r from-red-600 to-purple-600 text-white font-semibold rounded-lg hover:from-red-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Fetching...' : 'Submit'}
            </button>
            <button
              onClick={() => { setInputMethod(null); setError(null); }}
              className="px-6 py-3 bg-gray-800 text-white font-semibold rounded-lg hover:bg-gray-700 transition-all"
            >
              Back
            </button>
          </div>
        </div>
      )}

      {inputMethod === 'manual' && (
        <div className="space-y-4">
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Single-Core Score
            </label>
            <input
              type="number"
              value={manualScores.singleCore}
              onChange={(e) => setManualScores({ ...manualScores, singleCore: e.target.value })}
              placeholder="e.g., 2400"
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Multi-Core Score
            </label>
            <input
              type="number"
              value={manualScores.multiCore}
              onChange={(e) => setManualScores({ ...manualScores, multiCore: e.target.value })}
              placeholder="e.g., 9800"
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              AI Score <span className="text-gray-500 text-xs">(optional)</span>
            </label>
            <input
              type="number"
              value={manualScores.aiScore}
              onChange={(e) => setManualScores({ ...manualScores, aiScore: e.target.value })}
              placeholder="e.g., 6100"
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500"
            />
            <p className="mt-1 text-xs text-gray-500">
              Leave blank to auto-calculate from CPU scores
            </p>
          </div>

          <div className="flex space-x-3">
            <button
              onClick={handleManualSubmit}
              className="flex-1 py-3 bg-gradient-to-r from-red-600 to-purple-600 text-white font-semibold rounded-lg hover:from-red-700 hover:to-purple-700 transition-all"
            >
              Submit Scores
            </button>
            <button
              onClick={() => { setInputMethod(null); setError(null); }}
              className="px-6 py-3 bg-gray-800 text-white font-semibold rounded-lg hover:bg-gray-700 transition-all"
            >
              Back
            </button>
          </div>
        </div>
      )}

      <div className="text-center">
        <p className="text-xs text-gray-500">
          Your benchmark data helps us recommend the optimal cognitive memory configuration
        </p>
      </div>
    </div>
  );
}
