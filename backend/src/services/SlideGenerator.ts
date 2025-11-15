import axios from 'axios';
import { Storyboard } from '../types/index';

export class SlideGenerator {
  private apiKey: string;

  constructor(config: { apiKey: string }) {
    this.apiKey = config.apiKey;
  }

  async generate(storyboard: Storyboard, style: 'YC' | 'Finance'): Promise<{
    downloadUrl: string;
    slideCount: number;
  }> {
    // Format storyboard for GAMMA API with style-specific instructions
    const gammaInput = this.formatForGamma(storyboard, style);
    
    try {
      // Create generation
      const response = await axios.post(
        'https://api.gamma.app/v1.0/generations',
        {
          inputText: gammaInput,
          contentType: 'presentation',
          theme: style === 'YC' ? 'minimal' : 'professional',
          language: 'en',
          detailLevel: 'standard'
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      const generationId = response.data.id;
      
      // Poll for completion
      const result = await this.pollStatus(generationId);
      
      return {
        downloadUrl: result.exportUrl || result.downloadUrl || result.url,
        slideCount: storyboard.nodes.length
      };
    } catch (error: any) {
      console.error('Error generating slides:', error.response?.data || error.message);
      throw new Error(`Failed to generate slides: ${error.message}`);
    }
  }

  private formatForGamma(storyboard: Storyboard, style: 'YC' | 'Finance'): string {
    const stylePrefix = style === 'YC' 
      ? 'Create a minimalist, YC-style pitch deck with bold statements and data-driven insights.'
      : 'Create a professional, finance-style presentation with detailed analysis and formal tone.';
    
    const slides = storyboard.nodes.map((node) => {
      return `
# ${node.title}

${node.content}

${node.speakerNotes ? `\n**Speaker Notes:** ${node.speakerNotes}` : ''}

---`;
    }).join('\n\n');
    
    return `${stylePrefix}\n\n${slides}`;
  }

  private async pollStatus(generationId: string): Promise<any> {
    const maxAttempts = 60; // 5 minutes (60 * 5 seconds)
    const pollInterval = 5000; // 5 seconds
    
    for (let i = 0; i < maxAttempts; i++) {
      try {
        const response = await axios.get(
          `https://api.gamma.app/v1.0/generations/${generationId}`,
          {
            headers: { 'Authorization': `Bearer ${this.apiKey}` }
          }
        );
        
        const status = response.data.status;
        
        if (status === 'completed') {
          return response.data;
        }
        
        if (status === 'failed' || status === 'error') {
          throw new Error(`Generation failed: ${response.data.error || 'Unknown error'}`);
        }
        
        // Wait before next poll
        await new Promise(resolve => setTimeout(resolve, pollInterval));
      } catch (error: any) {
        if (error.response?.status === 404) {
          throw new Error('Generation not found');
        }
        throw error;
      }
    }
    
    throw new Error('Generation timeout: exceeded maximum polling attempts');
  }
}

