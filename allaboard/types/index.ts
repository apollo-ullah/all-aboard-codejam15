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
  pdfUrl?: string;
  slideCount: number;
}
