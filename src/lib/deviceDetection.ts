export interface DeviceSpecs {
  type: 'mobile' | 'desktop' | 'tablet';
  os: string;
  cpuCores: number;
  ramGB: number;
  gpuAvailable: boolean;
  storageGB: number;
  isFlagship: boolean;
  recommendedPlan: 'free' | 'compute' | 'premium';
}

export async function detectDeviceCapabilities(): Promise<DeviceSpecs> {
  const cpuCores = navigator.hardwareConcurrency || 2;
  const deviceMemoryGB = (navigator as any).deviceMemory || estimateRAM();

  const hasGPU = await checkGPUAvailability();

  const storage = await estimateStorage();

  const deviceType = getDeviceType();
  const os = getOS();

  const isFlagship = cpuCores >= 4 && deviceMemoryGB >= 6 && storage >= 64 && hasGPU;

  let recommendedPlan: 'free' | 'compute' | 'premium' = 'premium';

  if (isFlagship) {
    recommendedPlan = 'free';
  } else if (cpuCores >= 4 && deviceMemoryGB >= 4) {
    recommendedPlan = 'compute';
  }

  return {
    type: deviceType,
    os,
    cpuCores,
    ramGB: deviceMemoryGB,
    gpuAvailable: hasGPU,
    storageGB: storage,
    isFlagship,
    recommendedPlan
  };
}

function getDeviceType(): 'mobile' | 'desktop' | 'tablet' {
  const ua = navigator.userAgent.toLowerCase();

  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
    return 'tablet';
  }

  if (/mobile|iphone|ipod|blackberry|opera mini|iemobile|wpdesktop/i.test(ua)) {
    return 'mobile';
  }

  return 'desktop';
}

function getOS(): string {
  const ua = navigator.userAgent;

  if (/windows/i.test(ua)) return 'Windows';
  if (/macintosh|mac os x/i.test(ua)) return 'macOS';
  if (/linux/i.test(ua)) return 'Linux';
  if (/android/i.test(ua)) return 'Android';
  if (/iphone|ipad|ipod/i.test(ua)) return 'iOS';

  return 'Unknown';
}

function estimateRAM(): number {
  const cpuCores = navigator.hardwareConcurrency || 2;
  const platform = navigator.platform.toLowerCase();

  if (platform.includes('win') || platform.includes('mac') || platform.includes('linux')) {
    return cpuCores >= 8 ? 16 : cpuCores >= 4 ? 8 : 4;
  }

  if (cpuCores >= 8) return 8;
  if (cpuCores >= 6) return 6;
  if (cpuCores >= 4) return 4;
  return 2;
}

async function checkGPUAvailability(): Promise<boolean> {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');

    if (!gl) return false;

    const debugInfo = (gl as WebGLRenderingContext).getExtension('WEBGL_debug_renderer_info');
    if (debugInfo) {
      const renderer = (gl as WebGLRenderingContext).getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
      return !renderer.toLowerCase().includes('swiftshader');
    }

    return true;
  } catch {
    return false;
  }
}

async function estimateStorage(): Promise<number> {
  if ('storage' in navigator && 'estimate' in navigator.storage) {
    try {
      const estimate = await navigator.storage.estimate();
      const quotaGB = (estimate.quota || 0) / (1024 * 1024 * 1024);
      const usageGB = (estimate.usage || 0) / (1024 * 1024 * 1024);
      return Math.max(quotaGB - usageGB, 0);
    } catch {
      return 64;
    }
  }

  return 64;
}

export function getCapabilityMessage(specs: DeviceSpecs): string {
  if (specs.isFlagship) {
    return `Flagship device detected! Your ${specs.cpuCores}-core CPU with ${specs.ramGB}GB RAM can handle the full mesh network locally.`;
  }

  if (specs.cpuCores >= 4 && specs.ramGB >= 4) {
    return `Mid-range device detected. ${specs.cpuCores} cores and ${specs.ramGB}GB RAM. We recommend cloud compute with local storage.`;
  }

  return `Your device has ${specs.cpuCores} cores and ${specs.ramGB}GB RAM. We recommend cloud-based storage for optimal performance.`;
}

export function getPlanCompatibility(planName: string, specs: DeviceSpecs): {
  compatible: boolean;
  warning?: string;
} {
  const plan = planName.toLowerCase();

  if (plan.includes('free') || plan.includes('self-hosted')) {
    if (!specs.isFlagship) {
      return {
        compatible: false,
        warning: `Self-hosted requires flagship specs: 4+ cores, 6+ GB RAM, GPU. Your device: ${specs.cpuCores} cores, ${specs.ramGB}GB RAM`
      };
    }
    return { compatible: true };
  }

  if (plan.includes('compute')) {
    if (specs.cpuCores < 4 || specs.ramGB < 4) {
      return {
        compatible: true,
        warning: `This plan works but may be slow on your device. Consider Premium for better performance.`
      };
    }
    return { compatible: true };
  }

  return { compatible: true };
}
