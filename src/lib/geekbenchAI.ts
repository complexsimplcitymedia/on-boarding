// Geekbench AI Integration for ML Quantization Performance

export interface GeekbenchAIResult {
  // Geekbench AI measures quantization performance, not CPU cores
  int8Score: number;      // INT8 quantized inference performance
  fp16Score: number;      // FP16 (half precision) performance
  fp32Score: number;      // FP32 (full precision) performance
  overallScore: number;   // Combined AI inference score
  deviceClass: 'flagship' | 'high-end' | 'mid-range' | 'entry-level';
  benchmarkDate: string;
  deviceInfo: {
    processor: string;
    gpu: string;
    npu: string | null;  // Neural Processing Unit
    ramGB: number;
  };
}

// Legacy interface for CPU benchmarks (Geekbench 6)
export interface GeekbenchResult extends GeekbenchAIResult {
  singleCoreScore: number;
  multiCoreScore: number;
  aiScore: number;
  deviceInfo: GeekbenchAIResult['deviceInfo'] & {
    cores: number;
  };
}

// Lightweight browser-based AI benchmark (simulates Geekbench AI quantization testing)
export async function runAIBenchmark(): Promise<GeekbenchResult> {
  console.log('Starting Geekbench AI-style quantization benchmark...');

  // Get device info
  const cores = navigator.hardwareConcurrency || 2;
  const ramGB = (navigator as any).deviceMemory || 4;
  const gpu = await getGPUInfo();
  const npu = await detectNPU();

  // Run Geekbench AI quantization tests
  const int8Score = await testINT8Quantization();
  const fp16Score = await testFP16Quantization();
  const fp32Score = await testFP32Quantization();

  // Overall AI score (weighted average - INT8 is most important for edge AI)
  const overallScore = Math.round(
    (int8Score * 0.5) + (fp16Score * 0.3) + (fp32Score * 0.2)
  );

  // Legacy CPU scores for compatibility
  const singleCoreScore = await testSingleCore();
  const multiCoreScore = await testMultiCore(cores);

  // Determine device class based on quantization performance
  const deviceClass = classifyAIDevice(int8Score, fp16Score, fp32Score);

  return {
    int8Score,
    fp16Score,
    fp32Score,
    overallScore,
    singleCoreScore,
    multiCoreScore,
    aiScore: overallScore,
    deviceClass,
    benchmarkDate: new Date().toISOString(),
    deviceInfo: {
      processor: getProcessorInfo(),
      cores,
      ramGB,
      gpu,
      npu
    }
  };
}

// Test INT8 quantized inference (most common for edge AI)
async function testINT8Quantization(): Promise<number> {
  console.log('Testing INT8 quantization performance...');

  const startTime = performance.now();

  // Simulate INT8 quantized matrix operations
  const size = 512;
  const iterations = 100;

  for (let iter = 0; iter < iterations; iter++) {
    // INT8 range: -128 to 127
    let sum = 0;
    for (let i = 0; i < size; i++) {
      for (let j = 0; j < size; j++) {
        // Simulate quantized inference with 8-bit integer ops
        const a = Math.floor(Math.random() * 256) - 128;
        const b = Math.floor(Math.random() * 256) - 128;
        sum += (a * b) >> 7; // Shift to keep in INT8 range
      }
    }
  }

  const endTime = performance.now();
  const duration = endTime - startTime;

  // Score: higher is better (inversely proportional to time)
  const baseScore = 50000 / (duration / 100);
  return Math.round(baseScore);
}

// Test FP16 half-precision inference
async function testFP16Quantization(): Promise<number> {
  console.log('Testing FP16 (half-precision) performance...');

  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');

    if (!gl) {
      console.warn('WebGL not available, using CPU fallback');
      return Math.round(await testINT8Quantization() * 0.7);
    }

    // Check for FP16 support
    const ext = gl.getExtension('EXT_color_buffer_half_float');

    const startTime = performance.now();

    // Simulate FP16 shader operations
    const vertexShader = gl.createShader(gl.VERTEX_SHADER)!;
    gl.shaderSource(vertexShader, `
      attribute vec4 position;
      void main() { gl_Position = position; }
    `);
    gl.compileShader(vertexShader);

    const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER)!;
    gl.shaderSource(fragmentShader, `
      precision mediump float;
      void main() {
        // Simulate FP16 inference operations
        float result = 0.0;
        for (int i = 0; i < 500; i++) {
          result += sin(float(i) * 0.01) * cos(float(i) * 0.01);
        }
        gl_FragColor = vec4(result, result, result, 1.0);
      }
    `);
    gl.compileShader(fragmentShader);

    const program = gl.createProgram()!;
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    const endTime = performance.now();
    const duration = endTime - startTime;

    const baseScore = ext ? 40000 / (duration / 10) : 30000 / (duration / 10);
    return Math.round(baseScore);
  } catch (error) {
    console.error('FP16 test failed:', error);
    return Math.round(await testINT8Quantization() * 0.75);
  }
}

// Test FP32 full-precision inference
async function testFP32Quantization(): Promise<number> {
  console.log('Testing FP32 (full-precision) performance...');

  const startTime = performance.now();

  // FP32 full precision operations (most accurate, slowest)
  const size = 256;
  const iterations = 50;

  for (let iter = 0; iter < iterations; iter++) {
    let sum = 0.0;
    for (let i = 0; i < size; i++) {
      for (let j = 0; j < size; j++) {
        const a = Math.random() * 2.0 - 1.0;
        const b = Math.random() * 2.0 - 1.0;
        sum += a * b + Math.sin(a) * Math.cos(b);
      }
    }
  }

  const endTime = performance.now();
  const duration = endTime - startTime;

  const baseScore = 30000 / (duration / 100);
  return Math.round(baseScore);
}

// Test single-core performance
async function testSingleCore(): Promise<number> {
  const startTime = performance.now();

  // CPU-intensive single-threaded task (matrix calculations)
  let result = 0;
  for (let i = 0; i < 1000000; i++) {
    result += Math.sqrt(i) * Math.sin(i) * Math.cos(i);
  }

  const endTime = performance.now();
  const duration = endTime - startTime;

  // Score based on time (lower is better, convert to Geekbench-like scale)
  const baseScore = 10000 / (duration / 100);

  return Math.round(baseScore);
}

// Test multi-core performance
async function testMultiCore(cores: number): Promise<number> {
  console.log(`Running multi-core test with ${cores} cores...`);

  const workers: Worker[] = [];
  const promises: Promise<number>[] = [];

  try {
    // Create worker code as a blob
    const workerCode = `
      self.onmessage = function() {
        let result = 0;
        for (let i = 0; i < 500000; i++) {
          result += Math.sqrt(i) * Math.sin(i) * Math.cos(i);
        }
        self.postMessage(result);
      };
    `;

    const blob = new Blob([workerCode], { type: 'application/javascript' });
    const workerURL = URL.createObjectURL(blob);

    const startTime = performance.now();

    // Spawn workers for each core
    for (let i = 0; i < cores; i++) {
      const worker = new Worker(workerURL);
      workers.push(worker);

      const promise = new Promise<number>((resolve) => {
        worker.onmessage = () => resolve(1);
        worker.postMessage({});
      });

      promises.push(promise);
    }

    await Promise.all(promises);
    const endTime = performance.now();
    const duration = endTime - startTime;

    // Cleanup
    workers.forEach(w => w.terminate());
    URL.revokeObjectURL(workerURL);

    // Multi-core score (scales with cores and speed)
    const baseScore = (cores * 10000) / (duration / 100);
    return Math.round(baseScore);
  } catch (error) {
    console.error('Multi-core test failed, falling back to single-core estimate:', error);
    // Fallback: estimate based on single core score
    return Math.round((await testSingleCore()) * cores * 0.8);
  }
}

// Test AI/ML performance (WebGL compute simulation)
async function testAIPerformance(): Promise<number> {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');

    if (!gl) {
      console.warn('WebGL not available, using CPU fallback');
      return Math.round((await testSingleCore()) * 0.5);
    }

    const startTime = performance.now();

    // Simple shader compilation and execution test
    const vertexShaderSource = `
      attribute vec4 position;
      void main() {
        gl_Position = position;
      }
    `;

    const fragmentShaderSource = `
      precision mediump float;
      void main() {
        float result = 0.0;
        for (int i = 0; i < 1000; i++) {
          result += sin(float(i)) * cos(float(i));
        }
        gl_FragColor = vec4(result, result, result, 1.0);
      }
    `;

    const vertexShader = gl.createShader(gl.VERTEX_SHADER)!;
    gl.shaderSource(vertexShader, vertexShaderSource);
    gl.compileShader(vertexShader);

    const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER)!;
    gl.shaderSource(fragmentShader, fragmentShaderSource);
    gl.compileShader(fragmentShader);

    const program = gl.createProgram()!;
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    const endTime = performance.now();
    const duration = endTime - startTime;

    // AI score based on GPU performance
    const baseScore = 15000 / (duration / 10);
    return Math.round(baseScore);
  } catch (error) {
    console.error('AI benchmark failed:', error);
    return Math.round((await testSingleCore()) * 0.7);
  }
}

// Classify device based on AI quantization performance (not CPU cores!)
function classifyAIDevice(int8Score: number, fp16Score: number, fp32Score: number): 'flagship' | 'high-end' | 'mid-range' | 'entry-level' {
  // INT8 is most important for edge AI/ML inference
  const weightedScore = (int8Score * 0.5) + (fp16Score * 0.3) + (fp32Score * 0.2);

  // Geekbench AI scoring ranges (approximate)
  if (weightedScore > 4000 && int8Score > 5000) return 'flagship';   // High-end AI accelerators (Apple Silicon, Snapdragon 8 Gen 3)
  if (weightedScore > 2500 && int8Score > 3000) return 'high-end';   // Good AI performance (modern flagships)
  if (weightedScore > 1500) return 'mid-range';                      // Decent AI capabilities
  return 'entry-level';                                               // Basic AI support
}

function classifyDevice(singleCore: number, multiCore: number, aiScore: number): 'flagship' | 'high-end' | 'mid-range' | 'entry-level' {
  // Legacy function for backward compatibility
  return classifyAIDevice(aiScore, aiScore * 0.8, aiScore * 0.6);
}

// Detect Neural Processing Unit (NPU) availability
async function detectNPU(): Promise<string | null> {
  const ua = navigator.userAgent;

  // Check for known NPU/AI accelerators
  if (ua.includes('Apple')) {
    // Apple Neural Engine
    const match = ua.match(/iPhone(\d+)|iPad(\d+)|Mac/);
    if (match) return 'Apple Neural Engine';
  }

  if (ua.includes('Snapdragon')) {
    return 'Qualcomm Hexagon NPU';
  }

  if (ua.includes('Exynos')) {
    return 'Samsung NPU';
  }

  if (ua.includes('MediaTek')) {
    return 'MediaTek APU';
  }

  // Check for WebNN API (Web Neural Network API)
  if ('ml' in navigator) {
    return 'WebNN ML Accelerator';
  }

  return null;
}

function getProcessorInfo(): string {
  const ua = navigator.userAgent;

  // Try to extract CPU info from user agent
  if (ua.includes('Intel')) return 'Intel';
  if (ua.includes('AMD')) return 'AMD';
  if (ua.includes('Apple')) return 'Apple Silicon';
  if (ua.includes('Snapdragon')) return 'Snapdragon';
  if (ua.includes('Exynos')) return 'Exynos';
  if (ua.includes('MediaTek')) return 'MediaTek';

  return 'Unknown CPU';
}

async function getGPUInfo(): Promise<string> {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');

    if (!gl) return 'No GPU';

    const debugInfo = (gl as WebGLRenderingContext).getExtension('WEBGL_debug_renderer_info');
    if (debugInfo) {
      const renderer = (gl as WebGLRenderingContext).getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
      return renderer;
    }

    return 'WebGL GPU';
  } catch {
    return 'Unknown GPU';
  }
}

// Format score for display
export function formatScore(score: number): string {
  if (score >= 10000) return `${(score / 1000).toFixed(1)}K`;
  return score.toString();
}

// Get recommendation based on Geekbench AI quantization performance
export function getRecommendation(result: GeekbenchResult): {
  plan: 'free' | 'compute' | 'premium';
  message: string;
} {
  // Focus on INT8 performance for edge AI recommendations
  const hasGoodINT8 = result.int8Score && result.int8Score > 3000;
  const hasFP16Support = result.fp16Score && result.fp16Score > 2000;

  switch (result.deviceClass) {
    case 'flagship':
      return {
        plan: 'free',
        message: `Excellent AI acceleration! INT8: ${formatScore(result.int8Score || 0)}, FP16: ${formatScore(result.fp16Score || 0)}. Your device can run quantized models locally with strong inference performance.`
      };
    case 'high-end':
      return {
        plan: 'compute',
        message: `Great quantization support! INT8: ${formatScore(result.int8Score || 0)}. ${hasGoodINT8 ? 'Local INT8 models recommended' : 'Hybrid mode with cloud FP16'} for optimal performance.`
      };
    case 'mid-range':
      return {
        plan: 'compute',
        message: `Decent AI capabilities (INT8: ${formatScore(result.int8Score || 0)}). ${hasFP16Support ? 'FP16 models via cloud' : 'INT8 quantized models'} recommended.`
      };
    case 'entry-level':
      return {
        plan: 'premium',
        message: `Limited quantization support (INT8: ${formatScore(result.int8Score || 0)}). Cloud-based FP16/FP32 inference recommended for best accuracy.`
      };
  }
}

// Save benchmark results
export async function saveBenchmarkResult(result: GeekbenchResult, apiKey: string): Promise<void> {
  try {
    const response = await fetch('http://100.110.82.181:8002/api/benchmark', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(result)
    });

    if (!response.ok) {
      throw new Error('Failed to save benchmark');
    }
  } catch (error) {
    console.error('Error saving benchmark:', error);
    // Store locally as fallback
    localStorage.setItem('wolf_benchmark', JSON.stringify(result));
  }
}
