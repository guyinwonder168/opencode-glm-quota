/**
 * Platform detection module
 * Maps provider IDs to platforms (ZAI or ZHIPU)
 */

type Platform = 'ZAI' | 'ZHIPU';

/**
 * Detect platform from provider ID
 * @param providerId - The provider ID from OpenCode authentication
 * @returns Platform type or null if unknown
 */
function detectPlatform(providerId: string): Platform | null {
  const lower = providerId.toLowerCase();
  
  // Check for ZHIPU first (more specific)
  if (lower.includes('zhipu') || lower.includes('bigmodel')) {
    return 'ZHIPU';
  }
  
  // Check for ZAI
  if (lower.includes('zai') || lower === 'z.ai' || lower === 'z-ai') {
    return 'ZAI';
  }
  
  return null;
}

/**
 * Get platform display name
 * @param platform - The platform type
 * @returns Human-readable platform name
 */
function getPlatformName(platform: Platform): string {
  switch (platform) {
    case 'ZAI':
      return 'Z.AI';
    case 'ZHIPU':
      return 'ZHIPU';
    default:
      return platform;
  }
}

export type { Platform };
export { detectPlatform, getPlatformName };
