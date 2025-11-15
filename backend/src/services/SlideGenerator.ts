import axios from 'axios';
import { Storyboard } from '../types/index';

export class SlideGenerator {
  private apiKey: string;

  constructor(config: { apiKey: string }) {
    this.apiKey = config.apiKey;
  }

  async generate(storyboard: Storyboard, style: 'YC' | 'Finance'): Promise<{
    presentationUrl: string;
    embedUrl?: string;
    downloadUrl?: string;
    slideCount: number;
  }> {
    // Format storyboard for GAMMA API with style-specific instructions
    const gammaInput = this.formatForGamma(storyboard, style);
    
    try {
      console.log('📊 Creating Gamma presentation generation...');
      console.log(`   Input length: ${gammaInput.length} characters`);
      console.log(`   Style: ${style}`);
      
      // Use the correct Gamma API endpoint and format based on documentation
      const endpoint = 'https://public-api.gamma.app/v1.0/generations';
      
      console.log(`   Using endpoint: ${endpoint}`);
      
      // Build request body according to Gamma API documentation
      const requestBody = {
        inputText: gammaInput,
        textMode: 'generate', // Required: 'generate', 'condense', or 'preserve'
        format: 'presentation',
        numCards: storyboard.nodes.length,
        cardSplit: 'inputTextBreaks', // Use --- breaks in inputText
        additionalInstructions: style === 'YC' 
          ? 'Use YC-style bold statements, clean visuals, and data-driven insights. Make it compelling for investors.'
          : 'Use a professional, finance-style presentation with detailed analysis and formal tone.',
        textOptions: {
          amount: 'medium',
          tone: style === 'YC' ? 'startup pitch' : 'professional',
          audience: style === 'YC' ? 'investors, VCs' : 'stakeholders, executives',
          language: 'en'
        },
        // Optional: imageOptions, cardOptions, sharingOptions can be added later
      };
      
      const response = await axios.post(
        endpoint,
        requestBody,
        {
          headers: {
            'X-API-KEY': this.apiKey, // Gamma uses X-API-KEY, not Authorization Bearer
            'Content-Type': 'application/json'
          },
          validateStatus: (status) => status < 500,
        }
      );
      
      // Check for error responses
      if (response.status >= 400) {
        const errorData = response.data;
        console.error('❌ Gamma API error response:', {
          status: response.status,
          data: errorData
        });
        
        let errorMessage = `Gamma API error (${response.status})`;
        if (errorData?.message) {
          errorMessage += `: ${errorData.message}`;
        } else if (errorData?.error) {
          errorMessage += `: ${errorData.error}`;
        } else if (typeof errorData === 'string') {
          errorMessage += `: ${errorData}`;
        }
        
        throw new Error(errorMessage);
      }
      
      // Gamma API returns generationId (not id)
      const generationId = response.data.generationId || response.data.id;
      if (!generationId) {
        console.error('❌ No generation ID in response:', response.data);
        throw new Error('Gamma API did not return a generation ID');
      }
      
      console.log(`✅ Gamma generation created: ${generationId}`);
      
      // Poll for completion
      const result = await this.pollStatus(generationId);
      
      // Gamma API returns gammaUrl when completed (according to docs)
      const presentationUrl = result.gammaUrl || result.presentationUrl || result.url || result.viewUrl;
      const embedUrl = result.embedUrl || result.iframeUrl;
      const downloadUrl = result.downloadUrl || result.exportUrl;
      
      if (!presentationUrl) {
        console.warn('⚠️ No presentation URL found in Gamma response:', JSON.stringify(result, null, 2));
        throw new Error('Gamma API did not return a presentation URL. Response: ' + JSON.stringify(result));
      }
      
      console.log(`✅ Gamma presentation ready: ${presentationUrl}`);
      
      return {
        presentationUrl,
        embedUrl,
        downloadUrl,
        slideCount: storyboard.nodes.length
      };
    } catch (error: any) {
      console.error('❌ Error generating slides:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        stack: error.stack
      });
      
      // Provide more helpful error messages
      if (error.response?.status === 401) {
        throw new Error('Invalid Gamma API key. Please check your GAMMA_API_KEY in .env');
      } else if (error.response?.status === 403) {
        throw new Error('No available Gamma API credits. Please check your subscription.');
      } else if (error.response?.status === 429) {
        throw new Error('Gamma API rate limit exceeded. Please try again later.');
      } else if (error.response?.status === 400) {
        throw new Error(`Invalid request to Gamma API: ${error.response?.data?.message || error.message}`);
      } else if (error.message?.includes('All Gamma API endpoints failed')) {
        throw new Error(`Gamma API endpoints not found. The API structure may have changed. Please check Gamma API documentation or use a fallback presentation viewer. Error: ${error.message}`);
      }
      
      throw new Error(`Failed to generate slides: ${error.message}`);
    }
  }

  private formatForGamma(storyboard: Storyboard, style: 'YC' | 'Finance'): string {
    // Format for Gamma API with cardSplit: "inputTextBreaks"
    // Use \n---\n to separate slides (cards)
    const slides = storyboard.nodes.map((node) => {
      return `# ${node.title}

${node.content}

${node.speakerNotes ? `\n**Speaker Notes:** ${node.speakerNotes}` : ''}`;
    }).join('\n\n---\n\n'); // Use --- to separate cards as per Gamma API docs
    
    return slides;
  }

  private async pollStatus(generationId: string): Promise<any> {
    const maxAttempts = 60; // 5 minutes (60 * 5 seconds)
    const pollInterval = 5000; // 5 seconds
    
    console.log(`🔄 Polling Gamma generation status: ${generationId}`);
    
    for (let i = 0; i < maxAttempts; i++) {
      try {
        // Use the correct polling endpoint
        const pollUrl = `https://public-api.gamma.app/v1.0/generations/${generationId}`;
        const response = await axios.get(
          pollUrl,
          {
            headers: { 
              'X-API-KEY': this.apiKey // Gamma uses X-API-KEY
            },
            validateStatus: (status) => status < 500,
          }
        );
        
        if (response.status >= 400) {
          if (response.status === 404) {
            throw new Error('Generation not found. The generation may have expired.');
          }
          throw new Error(`Status check failed: ${response.status} - ${JSON.stringify(response.data)}`);
        }
        
        const status = response.data.status || response.data.state;
        const progress = response.data.progress;
        
        // Log progress every 5 attempts
        if (i % 5 === 0 || status === 'completed' || status === 'failed') {
          console.log(`   Polling (${i + 1}/${maxAttempts}): Status = "${status}"${progress ? `, Progress = ${progress}%` : ''}`);
        }
        
        if (status === 'completed' || status === 'done') {
          console.log(`✅ Generation completed!`);
          return response.data;
        }
        
        if (status === 'failed' || status === 'error') {
          const errorMsg = response.data.error || response.data.message || 'Unknown error';
          throw new Error(`Generation failed: ${errorMsg}`);
        }
        
        // Wait before next poll
        await new Promise(resolve => setTimeout(resolve, pollInterval));
      } catch (error: any) {
        // If it's a 404, fail immediately
        if (error.response?.status === 404 || error.message?.includes('not found')) {
          throw new Error('Generation not found. The generation may have expired or been deleted.');
        }
        
        // If we've exhausted all attempts, throw the error
        if (i >= maxAttempts - 1) {
          throw new Error(`Polling timeout: ${error.message}`);
        }
        
        // Log error but continue polling
        if (i % 10 === 0) {
          console.warn(`   ⚠️ Polling error (attempt ${i + 1}): ${error.message}. Continuing...`);
        }
        
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, pollInterval));
      }
    }
    
    throw new Error('Generation timeout: exceeded maximum polling attempts');
  }
}

