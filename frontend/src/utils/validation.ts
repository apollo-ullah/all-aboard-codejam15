/**
 * Frontend URL validation utility
 */
export function isValidUrl(urlString: string): boolean {
  if (!urlString || typeof urlString !== 'string') {
    return false;
  }
  
  try {
    const url = new URL(urlString);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    // Try with https:// prefix
    try {
      const url = new URL(`https://${urlString}`);
      return true;
    } catch {
      return false;
    }
  }
}

/**
 * Normalize URL for display
 */
export function normalizeUrlForDisplay(urlString: string): string {
  const trimmed = urlString.trim();
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }
  return `https://${trimmed}`;
}

