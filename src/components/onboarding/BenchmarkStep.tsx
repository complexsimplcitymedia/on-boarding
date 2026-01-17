import { useState } from 'react';
import { Cpu, Zap, Loader2, CheckCircle, TrendingUp } from 'lucide-react';
import { runAIBenchmark, GeekbenchResult, formatScore, getRecommendation } from '../../lib/geekbenchAI';

interface BenchmarkStepProps {
  onComplete: (result: GeekbenchResult) => void;
}

export default function BenchmarkStep({ onComplete }: BenchmarkStepProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTest, setCurrentTest] = useState<string>('');
  const [result, setResult] = useState<GeekbenchResult | null>(null);

  const runBenchmark = async () => {
    setIsRunning(true);
    setProgress(0);

    try {
      // Simulate progress updates
      setCurrentTest('Testing single-core performance...');
      setProgress(10);

      await new Promise(resolve => setTimeout(resolve, 500));
      setProgress(30);

      setCurrentTest('Testing multi-core performance...');
      await new Promise(resolve => setTimeout(resolve, 500));
      setProgress(60);

      setCurrentTest('Testing AI/ML capabilities...');
      await new Promise(resolve => setTimeout(resolve, 500));
      setProgress(80);

      // Run actual benchmark
      const benchmarkResult = await runAIBenchmark();

      setProgress(100);
      setCurrentTest('Benchmark complete!');
      setResult(benchmarkResult);

    } catch (error) {
      console.error('Benchmark failed:', error);
      setCurrentTest('Benchmark failed. Using estimated scores.');
    } finally {
      setIsRunning(false);
    }
  };

  const handleContinue = () => {
    if (result) {
      onComplete(result);
    }
  };

  const recommendation = result ? getRecommendation(result) : null;

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-red-500 to-purple-600 mb-4">
          <Cpu className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Device Benchmark</h2>
        <p className="text-gray-400">
          Let's test your device's AI performance to recommend the best plan
        </p>
      </div>

      {!isRunning && !result && (
        <div className="space-y-4">
          <div className="bg-gray-800/50 rounded-lg p-6 space-y-4">
            <div className="flex items-start space-x-3">
              <Zap className="w-5 h-5 text-yellow-400 mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-white mb-1">What we'll test:</h3>
                <ul className="text-sm text-gray-400 space-y-1">
                  <li>• Single-core CPU performance</li>
                  <li>• Multi-core processing power</li>
                  <li>• AI/ML compute capabilities (WebGL)</li>
                  <li>• Memory and GPU performance</li>
                </ul>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <TrendingUp className="w-5 h-5 text-green-400 mt-1 flex-shrink-0" />
              <div>
                <p className="text-sm text-gray-400">
                  This lightweight benchmark takes ~5 seconds and helps us recommend the optimal cognitive memory configuration for your device.
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={runBenchmark}
            className="w-full py-3 bg-gradient-to-r from-red-600 to-purple-600 text-white font-semibold rounded-lg hover:from-red-700 hover:to-purple-700 transition-all transform hover:scale-[1.02]"
          >
            Run Benchmark
          </button>
        </div>
      )}

      {isRunning && (
        <div className="space-y-4">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-12 h-12 text-red-500 animate-spin" />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">{currentTest}</span>
              <span className="text-red-400 font-semibold">{progress}%</span>
            </div>
            <div className="w-full bg-gray-800 rounded-full h-2 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-red-500 to-purple-600 transition-all duration-500 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          <p className="text-center text-sm text-gray-500">
            Running performance tests...
          </p>
        </div>
      )}

      {result && (
        <div className="space-y-6">
          <div className="flex items-center justify-center space-x-2 text-green-400">
            <CheckCircle className="w-6 h-6" />
            <span className="font-semibold">Benchmark Complete!</span>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="bg-gradient-to-br from-green-900/30 to-emerald-900/30 rounded-lg p-4 border border-green-500/30">
              <div className="text-xs text-green-400 mb-1 font-semibold">INT8</div>
              <div className="text-sm text-gray-400 mb-1">Quantized</div>
              <div className="text-2xl font-bold text-white">{formatScore(result.int8Score || 0)}</div>
            </div>

            <div className="bg-gradient-to-br from-blue-900/30 to-cyan-900/30 rounded-lg p-4 border border-blue-500/30">
              <div className="text-xs text-blue-400 mb-1 font-semibold">FP16</div>
              <div className="text-sm text-gray-400 mb-1">Half Precision</div>
              <div className="text-2xl font-bold text-white">{formatScore(result.fp16Score || 0)}</div>
            </div>

            <div className="bg-gradient-to-br from-purple-900/30 to-pink-900/30 rounded-lg p-4 border border-purple-500/30">
              <div className="text-xs text-purple-400 mb-1 font-semibold">FP32</div>
              <div className="text-sm text-gray-400 mb-1">Full Precision</div>
              <div className="text-2xl font-bold text-white">{formatScore(result.fp32Score || 0)}</div>
            </div>

            <div className="col-span-3 bg-gradient-to-br from-red-900/30 to-orange-900/30 rounded-lg p-4 border border-red-500/30">
              <div className="text-sm text-red-400 mb-1 flex items-center space-x-2">
                <Zap className="w-4 h-4" />
                <span>Overall AI Score</span>
              </div>
              <div className="text-3xl font-bold text-white">{formatScore(result.overallScore || result.aiScore)}</div>
              <div className="text-xs text-gray-500 mt-1">
                Weighted: INT8 (50%), FP16 (30%), FP32 (20%)
              </div>
            </div>
          </div>

          <div className="bg-gray-800/50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400">Device Class</span>
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                result.deviceClass === 'flagship' ? 'bg-green-500/20 text-green-400' :
                result.deviceClass === 'high-end' ? 'bg-blue-500/20 text-blue-400' :
                result.deviceClass === 'mid-range' ? 'bg-yellow-500/20 text-yellow-400' :
                'bg-gray-500/20 text-gray-400'
              }`}>
                {result.deviceClass.toUpperCase()}
              </span>
            </div>

            <div className="space-y-1 text-sm text-gray-400">
              <div className="flex justify-between">
                <span>Processor:</span>
                <span className="text-white">{result.deviceInfo.processor}</span>
              </div>
              <div className="flex justify-between">
                <span>Cores:</span>
                <span className="text-white">{result.deviceInfo.cores}</span>
              </div>
              <div className="flex justify-between">
                <span>RAM:</span>
                <span className="text-white">{result.deviceInfo.ramGB} GB</span>
              </div>
              <div className="flex justify-between">
                <span>GPU:</span>
                <span className="text-white text-xs truncate max-w-[200px]">{result.deviceInfo.gpu}</span>
              </div>
            </div>
          </div>

          {recommendation && (
            <div className="bg-gradient-to-br from-red-900/20 to-purple-900/20 rounded-lg p-4 border border-red-500/20">
              <h3 className="font-semibold text-white mb-2">💡 Recommendation</h3>
              <p className="text-sm text-gray-300">{recommendation.message}</p>
              <div className="mt-3 flex items-center space-x-2">
                <span className="text-sm text-gray-400">Suggested Plan:</span>
                <span className="px-3 py-1 bg-red-600 text-white text-xs font-semibold rounded-full">
                  {recommendation.plan.toUpperCase()}
                </span>
              </div>
            </div>
          )}

          <button
            onClick={handleContinue}
            className="w-full py-3 bg-gradient-to-r from-red-600 to-purple-600 text-white font-semibold rounded-lg hover:from-red-700 hover:to-purple-700 transition-all transform hover:scale-[1.02]"
          >
            Continue to Subscription
          </button>
        </div>
      )}
    </div>
  );
}
