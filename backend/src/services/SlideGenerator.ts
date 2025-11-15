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
      
      // Try different Gamma API endpoints (they may have changed)
      const endpoints = [
        'https://api.gamma.app/v1/generations',
        'https://api.gamma.app/v1.0/generations',
        'https://public-api.gamma.app/v1/generations',
        'https://public-api.gamma.app/v1.0/generations',
        'https://api.gamma.app/api/v1/generations',
        'https://api.gamma.app/generations',
      ];
      
      let response;
      let lastError: any = null;
      
      for (const endpoint of endpoints) {
        try {
          console.log(`   Trying endpoint: ${endpoint}`);
          response = await axios.post(
            endpoint,
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
                'X-API-KEY': this.apiKey,
                'Content-Type': 'application/json'
              },
              validateStatus: (status) => status < 500,
            }
          );
          
          // If we got a response (even if error), check if it's a 404
          if (response.status === 404) {
            console.log(`   ❌ Endpoint ${endpoint} returned 404, trying next...`);
            lastError = new Error(`Endpoint not found: ${endpoint}`);
            continue; // Try next endpoint
          }
          
          // If we got a non-404 error, this might be the right endpoint but with wrong params
          if (response.status >= 400 && response.status !== 404) {
            console.log(`   ⚠️ Endpoint ${endpoint} returned ${response.status}, but might be correct endpoint`);
            break; // Use this response, might be auth/param issue
          }
          
          // Success!
          if (response.status < 400) {
            console.log(`   ✅ Success with endpoint: ${endpoint}`);
            break;
          }
        } catch (apiError: any) {
          console.log(`   ❌ Endpoint ${endpoint} failed: ${apiError.message}`);
          lastError = apiError;
          continue; // Try next endpoint
        }
      }
      
      // If we tried all endpoints and none worked
      if (!response) {
        throw new Error(`All Gamma API endpoints failed. Last error: ${lastError?.message || 'Unknown'}`);
      }
      
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
      
      // Gamma API returns different URL formats - try to get the presentation URL
      const presentationUrl = result.presentationUrl || result.url || result.viewUrl || result.exportUrl || result.presentation?.url;
      const embedUrl = result.embedUrl || result.iframeUrl || result.presentation?.embedUrl;
      const downloadUrl = result.downloadUrl || result.exportUrl || result.presentation?.downloadUrl;
      
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
    
    for (let i = 0; i < maxAttempts; i++) {
      try {
        // Try different endpoint variations
        const baseUrls = [
          'https://api.gamma.app/v1',
          'https://api.gamma.app/v1.0',
          'https://public-api.gamma.app/v1',
          'https://public-api.gamma.app/v1.0',
          'https://api.gamma.app/api/v1',
          'https://api.gamma.app',
        ];
        
        let response;
        let lastPollError: any = null;
        
        for (const baseUrl of baseUrls) {
          try {
            const pollUrl = `${baseUrl}/generations/${generationId}`;
            response = await axios.get(
              pollUrl,
              {
                headers: { 
                  'Authorization': `Bearer ${this.apiKey}`,
                  'X-API-KEY': this.apiKey
                },
                validateStatus: (status) => status < 500,
              }
            );
            
            if (response.status !== 404) {
              break; // Found working endpoint
            }
          } catch (pollError: any) {
            lastPollError = pollError;
            continue; // Try next endpoint
          }
        }
        
        if (!response) {
          throw new Error(`All polling endpoints failed. Last error: ${lastPollError?.message || 'Unknown'}`);
        }
        
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

