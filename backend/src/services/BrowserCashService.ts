import axios from 'axios';
import { ScrapeResult, ScrapedData } from '../types/index';

/**
 * BrowserCashService - Web scraping using Browser.cash Agent API
 * 
 * Uses the Agent API to intelligently scrape websites and extract content.
 */

interface BrowserCashConfig {
  agentApiKey: string;
  baseUrl?: string;
}

interface TaskResponse {
  taskId: string;
}

interface TaskStatus {
  id: string;
  task: string;
  state: 'active' | 'completed' | 'failed' | 'error';
  startedAt: number;
  stoppedAt: number | null;
  inputTokens: number | null;
  outputTokens: number | null;
  data: {
    prompt: string;
    agent: string;
    mode: string;
    stepLimit: number;
  };
  result: {
    answer: string;
    tokenUsage?: {
      inputTokens: number;
      outputTokens: number;
    };
    steps?: number;
    stepLimit?: number;
  } | null;
  attemptsMade: number;
}

export class BrowserCashService {
  private agentApiKey: string;
  private baseUrl: string;

  constructor(config: BrowserCashConfig) {
    if (!config.agentApiKey) {
      throw new Error('AGENT_API_KEY is required for Browser.cash Agent API');
    }
    this.agentApiKey = config.agentApiKey;
    // Always use the Agent API base URL, not the dashboard URL
    this.baseUrl = 'https://agent-api.browser.cash';
    console.log('📡 Using Browser.cash Agent API for web scraping');
    console.log(`   Base URL: ${this.baseUrl}`);
  }

  /**
   * Scrape a website and its adjacent pages
   */
  async scrapeWebsite(url: string): Promise<ScrapedData> {
    try {
      console.log(`🌐 Scraping website: ${url}`);
      console.log(`   Using Browser.cash Agent API: ${this.baseUrl}`);
      
      // 1. Scrape main page
      console.log(`   📄 Step 1: Scraping main page...`);
      const mainPage = await this.scrapePage(url);
      console.log(`   ✅ Main page scraped: "${mainPage.title}" (${mainPage.content.length} chars)`);
      
      // 2. Find and scrape adjacent pages
      const adjacentPages: ScrapeResult[] = [];
      
      // Extract links from main page
      const relevantLinks = this.findAdjacentPages(mainPage.links, url);
      console.log(`   🔗 Found ${relevantLinks.length} relevant adjacent pages`);
      
      // Scrape up to 5 adjacent pages
      if (relevantLinks.length > 0) {
        console.log(`   📄 Step 2: Scraping up to 5 adjacent pages...`);
        for (let i = 0; i < Math.min(5, relevantLinks.length); i++) {
          const link = relevantLinks[i];
        try {
            console.log(`   📄 Scraping adjacent page ${i + 1}/5: ${link}`);
          const page = await this.scrapePage(link);
          adjacentPages.push(page);
            console.log(`   ✅ Scraped: ${link} - "${page.title}"`);
        } catch (error: any) {
            console.warn(`   ⚠️ Failed to scrape ${link}: ${error.message}`);
          // Continue with other pages
          }
        }
      }
      
      console.log(`   ✅ Scraping complete: 1 main page + ${adjacentPages.length} adjacent pages`);
      return { mainPage, adjacentPages };
    } catch (error: any) {
      console.error('❌ Error scraping website:', error.message);
      console.error('   Stack:', error.stack);
      throw error;
    }
  }

  /**
   * Scrape a single page using Browser.cash Agent API
   */
  private async scrapePage(url: string): Promise<ScrapeResult> {
    const prompt = `Visit and scrape the website ${url}. Extract and provide:

TITLE: [The page title from the <title> tag or main heading]

DESCRIPTION: [The meta description or a brief summary of the page]

CONTENT: [All main content including:
- All headings (H1, H2, H3, etc.)
- All paragraphs and text content
- Lists and bullet points
- Key features, benefits, or important information
- Any other relevant text content]

LINKS: [List all links found on the page, one per line, with full URLs]

Please be comprehensive and include all important information from the page.`;

    try {
    // Create scraping task
    const taskId = await this.createTask(prompt);
    
    // Poll for completion
    const result = await this.pollTask(taskId);
      
      // Validate that we got a result
      if (!result || result.trim().length === 0) {
        throw new Error('Task completed but returned empty result');
      }
    
    // Parse the result into structured data
      const parsed = this.parseScrapeResult(url, result);
      
      // Validate parsed result
      if (!parsed.content || parsed.content.trim().length === 0) {
        console.warn(`   ⚠️ Warning: Parsed content is empty. Raw result length: ${result.length}`);
        // Use raw result as fallback
        parsed.content = result.substring(0, 10000); // Limit to 10k chars
      }
      
      return parsed;
    } catch (error: any) {
      console.error(`   ❌ Failed to scrape page ${url}:`, error.message);
      throw new Error(`Failed to scrape ${url}: ${error.message}`);
    }
  }

  /**
   * Create a task with the Agent API
   */
  private async createTask(prompt: string): Promise<string> {
    try {
      console.log(`   📤 Creating task with Browser.cash Agent API...`);
      console.log(`   📡 Endpoint: ${this.baseUrl}/v1/task/create`);
      
      const response = await axios.post<TaskResponse>(
        `${this.baseUrl}/v1/task/create`,
        {
          agent: 'gemini',
          prompt: prompt,
          mode: 'text',
          stepLimit: 20, // Higher limit for comprehensive scraping
        },
        {
          headers: {
            'Authorization': `Bearer ${this.agentApiKey}`,
            'Content-Type': 'application/json',
          },
          timeout: 60000, // Increased to 60 seconds for task creation
          validateStatus: (status) => status < 500, // Don't throw on 4xx errors
        }
      );

      // Check for error responses
      if (response.status >= 400) {
        const errorData: any = response.data;
        let errorMsg = `HTTP ${response.status}`;
        if (errorData && typeof errorData === 'object') {
          errorMsg += `: ${JSON.stringify(errorData)}`;
        } else if (typeof errorData === 'string') {
          errorMsg += `: ${errorData.substring(0, 200)}`;
        }
        throw new Error(`Failed to create task: ${errorMsg}`);
      }

      if (!response.data || !response.data.taskId) {
        console.error('   ❌ Invalid response structure:', JSON.stringify(response.data, null, 2));
        throw new Error('No taskId in response: ' + JSON.stringify(response.data));
      }

      console.log(`   ✅ Task created successfully: ${response.data.taskId}`);
      return response.data.taskId;
    } catch (error: any) {
      console.error('   ❌ Task creation failed:', error.message);
      
      if (error.response) {
        const status = error.response.status;
        const data = error.response.data;
        
        // If we get HTML back, it's likely a 404 from wrong endpoint
        if (typeof data === 'string' && data.includes('<!DOCTYPE html>')) {
          throw new Error(`Failed to create task: Endpoint not found (404). Check that base URL is correct: ${this.baseUrl}/v1/task/create`);
        }
        
        // Try to extract error message from response
        let errorMsg = `HTTP ${status}`;
        if (typeof data === 'string') {
          errorMsg += `: ${data.substring(0, 200)}`;
        } else if (data && typeof data === 'object') {
          errorMsg += `: ${JSON.stringify(data).substring(0, 200)}`;
        }
        
        throw new Error(`Failed to create task: ${errorMsg}`);
      }
      if (error.request) {
        throw new Error(`Failed to create task: No response from server. Check network connection and base URL: ${this.baseUrl}`);
      }
      throw new Error(`Failed to create task: ${error.message}`);
    }
  }

  /**
   * Poll for task completion
   */
  private async pollTask(taskId: string): Promise<string> {
    // Wait a moment before first poll
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    let attempts = 0;
    const maxAttempts = 60; // 3 minutes total (60 * 3 seconds)
    const pollInterval = 3000; // 3 seconds

    console.log(`   🔄 Polling task ${taskId} (max ${maxAttempts} attempts, ${pollInterval}ms interval)...`);

    while (attempts < maxAttempts) {
      attempts++;
      
      try {
        const response = await axios.get<TaskStatus>(
          `${this.baseUrl}/v1/task/${taskId}`,
          {
            headers: {
              'Authorization': `Bearer ${this.agentApiKey}`,
            },
            timeout: 30000, // Increased to 30 seconds for status checks
            validateStatus: (status) => status < 500, // Don't throw on 4xx errors
          }
        );

        // Handle error responses
        if (response.status >= 400) {
          if (response.status === 404) {
            throw new Error(`Task not found: ${taskId}. The task may have expired or been deleted.`);
          }
          const errorData = response.data;
          throw new Error(`Task status check failed (HTTP ${response.status}): ${JSON.stringify(errorData)}`);
        }

        const data = response.data;
        const state = data.state;

        // Log progress every 5 attempts or on state changes
        if (attempts % 5 === 0 || state === 'completed' || state === 'failed' || state === 'error') {
          const duration = data.stoppedAt 
            ? Math.round((data.stoppedAt - data.startedAt) / 1000)
            : Math.round((Date.now() - data.startedAt) / 1000);
          console.log(`   📊 Polling (${attempts}/${maxAttempts}): State = "${state}", Duration = ${duration}s`);
          
          // Log additional info for failed tasks
          if (state === 'failed' || state === 'error') {
            const failedReason = (data as any).failedReason || data.result?.answer || 'Unknown error';
            console.error(`   ❌ Task failed: ${failedReason}`);
          }
        }

        if (state === 'completed') {
          if (data.result && data.result.answer) {
            console.log(`   ✅ Task completed successfully!`);
            return data.result.answer;
          }
          // Check if result is in a different format
          if (data.result && typeof data.result === 'object') {
            console.warn(`   ⚠️ Unexpected result format:`, JSON.stringify(data.result, null, 2));
            // Try to extract answer from result object
            const answer = (data.result as any).answer || (data.result as any).content || JSON.stringify(data.result);
            if (answer) {
              return answer;
            }
          }
          throw new Error('Task completed but no result found in response');
        }

        if (state === 'failed' || state === 'error') {
          const failedReason = (data as any).failedReason || data.result?.answer || 'Unknown error';
          throw new Error(`Task failed: ${failedReason}`);
        }

        // Wait before next poll
        if (attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, pollInterval));
        }
      } catch (error: any) {
        // If it's a 404, fail immediately
        if (error.response && error.response.status === 404) {
          throw new Error(`Task not found: ${taskId}. The task may have expired or been deleted.`);
        }
        
        // If we've exhausted all attempts, throw the error
        if (attempts >= maxAttempts) {
          throw new Error(`Task polling timeout after ${attempts} attempts: ${error.message}`);
        }
        
        // Log the error but continue polling
        if (attempts % 10 === 0) {
          console.warn(`   ⚠️ Polling error (attempt ${attempts}): ${error.message}. Continuing...`);
        }
        
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, pollInterval));
      }
    }

    throw new Error(`Task timed out after ${attempts} polling attempts (${Math.round(attempts * pollInterval / 1000)}s)`);
  }

  /**
   * Parse the Agent API result into a ScrapeResult
   */
  private parseScrapeResult(url: string, resultText: string): ScrapeResult {
    // Extract title (look for "TITLE:" pattern)
    let title = 'Untitled';
    const titleMatch = resultText.match(/TITLE:\s*(.+?)(?:\n|DESCRIPTION:|CONTENT:|LINKS:|$)/is);
    if (titleMatch) {
      title = titleMatch[1].trim();
    } else {
      // Fallback: look for title in various formats
      const titlePatterns = [
        /(?:title|page title):\s*(.+?)(?:\n|$)/i,
        /<title>(.+?)<\/title>/i,
        /^#\s+(.+?)$/m,
      ];
      for (const pattern of titlePatterns) {
        const match = resultText.match(pattern);
        if (match) {
          title = match[1].trim();
          break;
        }
      }
    }

    // Extract description (look for "DESCRIPTION:" pattern)
    let description = '';
    const descMatch = resultText.match(/DESCRIPTION:\s*(.+?)(?:\n|CONTENT:|LINKS:|$)/is);
    if (descMatch) {
      description = descMatch[1].trim();
    } else {
      // Fallback: look for description patterns
      const descPatterns = [
        /(?:description|meta description|summary):\s*(.+?)(?:\n|$)/i,
        /<meta\s+name=["']description["']\s+content=["'](.+?)["']/i,
      ];
      for (const pattern of descPatterns) {
        const match = resultText.match(pattern);
        if (match) {
          description = match[1].trim();
          break;
        }
      }
    }

    // Extract content (look for "CONTENT:" pattern)
    let content = '';
    const contentMatch = resultText.match(/CONTENT:\s*([\s\S]+?)(?:\nLINKS:|$)/is);
    if (contentMatch) {
      content = contentMatch[1].trim();
    } else {
      // Fallback: extract everything except title/description/links sections
      content = resultText
        .replace(/TITLE:\s*.+?$/gmi, '')
        .replace(/DESCRIPTION:\s*.+?$/gmi, '')
        .replace(/LINKS:\s*[\s\S]+$/i, '')
        .trim();
    }

    // If content is still too short, use the full result (minus title/description)
    if (content.length < 100) {
      content = resultText
        .replace(/TITLE:\s*.+?$/gmi, '')
        .replace(/DESCRIPTION:\s*.+?$/gmi, '')
        .replace(/LINKS:\s*[\s\S]+$/i, '')
        .trim() || resultText;
    }

    // Extract links (look for "LINKS:" section or URLs in text)
    let links: string[] = [];
    const linksMatch = resultText.match(/LINKS:\s*([\s\S]+?)$/is);
    if (linksMatch) {
      // Extract URLs from the links section
      const linksText = linksMatch[1];
      const urlRegex = /https?:\/\/[^\s\)]+/g;
      links = Array.from(new Set(linksText.match(urlRegex) || []));
    } else {
      // Fallback: find all URLs in the text
      const urlRegex = /https?:\/\/[^\s\)]+/g;
      links = Array.from(new Set(resultText.match(urlRegex) || []));
    }

    // Filter out common non-page links (mailto, tel, javascript, etc.)
    links = links.filter(link => {
      try {
        const url = new URL(link);
        return url.protocol === 'http:' || url.protocol === 'https:';
      } catch {
        return false;
      }
    });

    return {
      url,
      title: title || 'Untitled',
      content: content.trim(),
      metadata: {
        description: description,
        ogTitle: title,
        ogDescription: description,
      },
      links: links,
      screenshot: undefined, // Agent API doesn't provide screenshots
    };
  }

  /**
   * Find relevant adjacent pages from links
   */
  private findAdjacentPages(links: string[], baseUrl: string): string[] {
    // Find relevant adjacent pages (About, Features, Pricing, Team, etc.)
    const keywords = ['about', 'features', 'pricing', 'product', 'team', 'how-it-works', 'solutions', 'services'];
    const baseDomain = new URL(baseUrl).hostname;
    
    const relevantLinks = links
      .filter(link => {
        try {
          const linkUrl = new URL(link);
          // Same domain and contains relevant keywords
          const isSameDomain = linkUrl.hostname === baseDomain;
          const hasKeyword = keywords.some(keyword => 
            link.toLowerCase().includes(keyword) || 
            linkUrl.pathname.toLowerCase().includes(keyword)
          );
          return isSameDomain && hasKeyword;
        } catch {
          return false;
        }
      })
      .slice(0, 10); // Get more candidates
    
    // Prioritize and deduplicate
    const prioritized = relevantLinks.sort((a, b) => {
      // Prioritize pages with keywords in path
      const aScore = keywords.filter(k => a.toLowerCase().includes(k)).length;
      const bScore = keywords.filter(k => b.toLowerCase().includes(k)).length;
      return bScore - aScore;
    });
    
    return Array.from(new Set(prioritized)).slice(0, 5);
  }

  /**
   * Close/cleanup (no-op for Agent API, but kept for interface compatibility)
   */
  async close(): Promise<void> {
    // No cleanup needed for Agent API
  }
}
