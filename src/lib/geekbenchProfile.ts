// Geekbench Profile Integration

export interface GeekbenchProfile {
  username: string;
  profileUrl: string;
  devices: GeekbenchDevice[];
  latestBenchmark: {
    deviceName: string;
    singleCore: number;
    multiCore: number;
    date: string;
    resultUrl: string;
  } | null;
}

export interface GeekbenchDevice {
  name: string;
  processor: string;
  singleCoreScore: number;
  multiCoreScore: number;
  benchmarkDate: string;
  resultUrl: string;
}

/**
 * Fetch user's Geekbench profile and benchmark history
 * @param profileUrlOrUsername - Geekbench profile URL or username
 */
export async function fetchGeekbenchProfile(profileUrlOrUsername: string): Promise<GeekbenchProfile> {
  let username = profileUrlOrUsername;
  let profileUrl = profileUrlOrUsername;

  // Extract username from URL if provided
  if (profileUrlOrUsername.includes('geekbench.com')) {
    const match = profileUrlOrUsername.match(/geekbench\.com\/user\/([^\/]+)/);
    if (match) {
      username = match[1];
      profileUrl = `https://browser.geekbench.com/user/${username}`;
    }
  } else {
    // Assume it's a username
    profileUrl = `https://browser.geekbench.com/user/${username}`;
  }

  try {
    // Fetch profile page HTML (would need CORS proxy in production)
    const response = await fetch(`/api/proxy/geekbench/user/${username}`);

    if (!response.ok) {
      throw new Error('Failed to fetch Geekbench profile');
    }

    const html = await response.text();

    // Parse HTML to extract benchmark results
    const devices = parseGeekbenchResults(html);

    // Get latest benchmark
    const latestBenchmark = devices.length > 0 ? {
      deviceName: devices[0].name,
      singleCore: devices[0].singleCoreScore,
      multiCore: devices[0].multiCoreScore,
      date: devices[0].benchmarkDate,
      resultUrl: devices[0].resultUrl
    } : null;

    return {
      username,
      profileUrl,
      devices,
      latestBenchmark
    };
  } catch (error) {
    console.error('Error fetching Geekbench profile:', error);
    throw new Error('Unable to fetch Geekbench profile. Make sure the profile is public.');
  }
}

/**
 * Parse Geekbench profile HTML to extract benchmark results
 */
function parseGeekbenchResults(html: string): GeekbenchDevice[] {
  // This would parse the HTML in a real implementation
  // For now, return empty array as we'd need server-side scraping
  return [];
}

/**
 * Get public benchmark by ID
 */
export async function fetchBenchmarkById(resultId: string): Promise<any> {
  try {
    const response = await fetch(`https://browser.geekbench.com/v6/cpu/${resultId}.json`);

    if (!response.ok) {
      throw new Error('Benchmark result not found or not public');
    }

    return await response.json();
  } catch (error) {
    // Fallback: Try via proxy
    try {
      const proxyResponse = await fetch(`/api/proxy/geekbench/result/${resultId}`);
      return await proxyResponse.json();
    } catch {
      throw new Error('Unable to fetch benchmark result');
    }
  }
}

/**
 * Save Geekbench profile link to user account
 */
export async function linkGeekbenchAccount(
  userId: string,
  geekbenchUsername: string,
  apiKey: string
): Promise<void> {
  try {
    const response = await fetch('http://100.110.82.181:8002/api/user/link-geekbench', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        user_id: userId,
        geekbench_username: geekbenchUsername,
        profile_url: `https://browser.geekbench.com/user/${geekbenchUsername}`
      })
    });

    if (!response.ok) {
      throw new Error('Failed to link Geekbench account');
    }
  } catch (error) {
    console.error('Error linking Geekbench account:', error);
    // Store locally as fallback
    localStorage.setItem('wolf_geekbench_profile', JSON.stringify({
      userId,
      geekbenchUsername,
      linkedAt: new Date().toISOString()
    }));
  }
}

/**
 * Check if Geekbench result URL is valid
 */
export function validateGeekbenchUrl(url: string): boolean {
  const pattern = /^https:\/\/browser\.geekbench\.com\/v\d+\/(cpu|compute|ml)\/\d+/;
  return pattern.test(url);
}

/**
 * Extract result ID from Geekbench URL
 */
export function extractResultId(url: string): string | null {
  const match = url.match(/geekbench\.com\/v\d+\/(?:cpu|compute|ml)\/(\d+)/);
  return match ? match[1] : null;
}
