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
    pdfUrl?: string;
    slideCount: number;
  }> {
    // Format storyboard for GAMMA API with style-specific instructions
    const gammaInput = this.formatForGamma(storyboard, style);
    
    try {
      console.log('📊 Creating Gamma presentation generation...');
      console.log(`   Input length: ${gammaInput.length} characters`);
      console.log(`   Style: ${style}`);
      
      // Use the correct Gamma API endpoint
      const endpoint = 'https://public-api.gamma.app/v1.0/generations';
      console.log(`   Using endpoint: ${endpoint}`);
      
      const response = await axios.post(
        endpoint,
        {
          inputText: gammaInput,
          textMode: 'generate'
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'X-API-KEY': this.apiKey,
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
      
      const generationId = response.data.id || response.data.generationId;
      if (!generationId) {
        console.error('❌ No generation ID in response:', response.data);
        throw new Error('Gamma API did not return a generation ID');
      }
      
      console.log(`✅ Gamma generation created: ${generationId}`);
      
      // Poll for completion
      const result = await this.pollStatus(generationId);
      
      // Extract file URLs from polling response (they should be included)
      console.log(`🔍 Looking for file URLs in polling response...`);
      console.log(`📄 Full polling response:`, JSON.stringify(result, null, 2));
      
      let pdfUrl = result.pdfUrl || result.pdf || result.files?.pdf || result.exportUrls?.pdf;
      
      // Prioritize embed URL from API response (this is what we want!)
      let embedUrl = result.embedUrl || result.embed || result.embedUrl || result.iframeUrl || 
                     result.files?.embed || result.presentation?.embedUrl || result.embedLink;
      
      // Gamma API returns different URL formats - try to get the presentation URL
      let presentationUrl = result.gammaUrl || result.presentationUrl || result.url || result.viewUrl || 
                           result.exportUrl || result.presentation?.url || result.link;
      
      // If we still don't have a presentation URL, try to extract it from the result
      if (!presentationUrl && result.data?.url) {
        presentationUrl = result.data.url;
      }
      
      if (!presentationUrl) {
        console.warn('⚠️ No presentation URL found in Gamma response:', JSON.stringify(result, null, 2));
        throw new Error('Gamma API did not return a presentation URL. Response: ' + JSON.stringify(result));
      }
      
      console.log(`✅ Gamma presentation ready: ${presentationUrl}`);
      if (embedUrl) {
        console.log(`✅ Embed URL from API: ${embedUrl}`);
      }
      
      // Construct embed URL from presentation URL if not provided by API
      // Gamma embed URLs typically follow: https://gamma.app/embed/[id]
      let finalEmbedUrl = embedUrl;
      
      // If no embed URL from API, construct it from presentation URL
      if (!finalEmbedUrl && presentationUrl) {
        try {
          // Extract presentation ID from URL (e.g., https://gamma.app/docs/[id] -> [id])
          // Try multiple URL patterns
          let presentationId: string | null = null;
          
          // Pattern 1: https://gamma.app/docs/[id]
          let urlMatch = presentationUrl.match(/gamma\.app\/docs\/([a-zA-Z0-9_-]+)/);
          if (urlMatch && urlMatch[1]) {
            presentationId = urlMatch[1];
          }
          
          // Pattern 2: https://gamma.app/presentation/[id]
          if (!presentationId) {
            urlMatch = presentationUrl.match(/gamma\.app\/presentation\/([a-zA-Z0-9_-]+)/);
            if (urlMatch && urlMatch[1]) {
              presentationId = urlMatch[1];
            }
          }
          
          // Pattern 3: Extract from any gamma.app URL
          if (!presentationId) {
            urlMatch = presentationUrl.match(/gamma\.app\/[^\/]+\/([a-zA-Z0-9_-]+)/);
            if (urlMatch && urlMatch[1]) {
              presentationId = urlMatch[1];
            }
          }
          
          if (presentationId) {
            // Construct embed URL - this is the format that works!
            finalEmbedUrl = `https://gamma.app/embed/${presentationId}`;
            console.log(`🔗 Constructed embed URL from presentation ID: ${finalEmbedUrl}`);
          } else {
            console.warn('⚠️ Could not extract presentation ID from URL:', presentationUrl);
            // Fallback: use presentation URL directly
            finalEmbedUrl = presentationUrl;
          }
        } catch (error) {
          console.warn('⚠️ Could not construct embed URL, using presentation URL:', error);
          finalEmbedUrl = presentationUrl;
        }
      }
      
      // Use the pdfUrl from file URLs API first, then fallback to response  
      const downloadUrl = pdfUrl || result.downloadUrl || result.exportUrl || result.presentation?.downloadUrl || result.gammaUrl;
      
      return {
        presentationUrl,
        embedUrl: finalEmbedUrl,
        downloadUrl,
        pdfUrl,
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
    
    console.log(`🔄 Polling Gamma generation status: ${generationId}`);
    
    // Use the correct polling endpoint
    const pollEndpoint = `https://public-api.gamma.app/v1.0/generations/${generationId}`;
    
    for (let i = 0; i < maxAttempts; i++) {
      try {
        const response = await axios.get(
          pollEndpoint,
          {
            headers: { 
              'Authorization': `Bearer ${this.apiKey}`,
              'X-API-KEY': this.apiKey
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
          console.log(`📄 Full response data:`, JSON.stringify(response.data, null, 2));
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

