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
  nodes: StoryNode[];
}

export interface ScrapeResponse {
  success: boolean;
  storyboard: Storyboard;
  scrapedData: {
    mainPageTitle: string;
    pagesScraped: number;
  };
}

export interface GenerateSlidesResponse {
  success: boolean;
  presentationUrl: string;
  embedUrl?: string;
  downloadUrl?: string;
  slideCount: number;
}

