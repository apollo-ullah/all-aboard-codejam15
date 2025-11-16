export interface StoryNode {
  id: string;
  type: 'title' | 'problem' | 'solution' | 'feature' | 'benefit' | 'cta';
  title: string;
  content: string;
  speakerNotes: string;
  position: { x: number; y: number };
}

export interface Storyboard {
  title: string;
  tagline: string;
  targetAudience?: string;
  coreInnovation?: string;
  nodes: StoryNode[];
}

export interface ScrapeResult {
  url: string;
  title: string;
  content: string;
  metadata: {
    description?: string;
    ogTitle?: string;
    ogDescription?: string;
  };
  links: string[];
  screenshot?: string;
}

export interface ScrapedData {
  mainPage: ScrapeResult;
  adjacentPages: ScrapeResult[];
}

