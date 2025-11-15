/**
 * URL validation utility
 */
export function isValidUrl(urlString: string): boolean {
  try {
    const url = new URL(urlString);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Normalize URL (add https:// if missing)
 */
export function normalizeUrl(urlString: string): string {
  const trimmed = urlString.trim();
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }
  return `https://${trimmed}`;
}

/**
 * Validate storyboard structure
 */
export function validateStoryboard(storyboard: any): { valid: boolean; error?: string } {
  if (!storyboard) {
    return { valid: false, error: 'Storyboard is required' };
  }

  if (!storyboard.nodes || !Array.isArray(storyboard.nodes)) {
    return { valid: false, error: 'Storyboard must have a nodes array' };
  }

  if (storyboard.nodes.length < 3) {
    return { valid: false, error: 'Storyboard must have at least 3 nodes' };
  }

  if (storyboard.nodes.length > 15) {
    return { valid: false, error: 'Storyboard cannot have more than 15 nodes' };
  }

  for (const node of storyboard.nodes) {
    if (!node.id || !node.type || !node.title || !node.content) {
      return { valid: false, error: 'Each node must have id, type, title, and content' };
    }

    const validTypes = ['title', 'problem', 'solution', 'feature', 'benefit', 'cta'];
    if (!validTypes.includes(node.type)) {
      return { valid: false, error: `Invalid node type: ${node.type}` };
    }
  }

  return { valid: true };
}

