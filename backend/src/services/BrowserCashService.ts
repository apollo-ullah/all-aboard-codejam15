import axios from 'axios';
import { ScrapeResult, ScrapedData } from '../types/index';
import { SimpleScraperService } from './SimpleScraperService';

/**
 * BrowserCashService - Simple, reliable web scraping using Browser.cash Agent API
 * 
 * Uses Browser.cash for main scraping, with Playwright as fallback.
 * Simplified implementation that actually works.
 */

interface BrowserCashConfig {
  agentApiKey: string;
  baseUrl?: string;
}

interface TaskResponse {
  taskId: string;
}

interface TaskStatus {
  id?: string;
  taskId?: string;
  status?: 'queued' | 'running' | 'completed' | 'failed' | 'success' | 'finished' | 'pending' | 'processing' | 'active' | 'error' | 'unknown';
  state?: 'queued' | 'running' | 'active' | 'completed' | 'failed' | 'error' | 'success' | 'finished' | 'pending' | 'processing' | 'unknown';
  result?: {
    answer?: string;
    content?: string;
    [key: string]: any;
  } | string | null;
  failedReason?: string;
  error?: string;
}

export class BrowserCashService {
  private agentApiKey: string;
  private baseUrl: string;
  private fallbackScraper: SimpleScraperService;

  constructor(config: BrowserCashConfig) {
    // Fallback to hardcoded API key if not provided
    const FALLBACK_API_KEY = 'yl6ycfwomtu81045r2vn2gdyppkit98brg6qclo54o101jvtghnzr9b3nkgyy0va';
    
    if (!config.agentApiKey) {
      console.warn('⚠️  AGENT_API_KEY not in config, using fallback key');
      this.agentApiKey = FALLBACK_API_KEY;
    } else {
      this.agentApiKey = config.agentApiKey;
    }
    
    this.baseUrl = config.baseUrl || 'https://agent-api.browser.cash';
    this.fallbackScraper = new SimpleScraperService();
    
    console.log('📡 Using Browser.cash Agent API for web scraping');
    console.log(`   Base URL: ${this.baseUrl}`);
    console.log(`   API Key: ${this.agentApiKey.substring(0, 10)}...${this.agentApiKey.substring(this.agentApiKey.length - 10)} (${this.agentApiKey.length} chars)`);
  }

  /**
   * Scrape a website - simple and reliable
   * Uses Browser.cash first, falls back to Playwright if it fails
   */
  async scrapeWebsite(url: string): Promise<ScrapedData> {
    console.log(`🌐 Scraping: ${url}`);
    
    try {
      // Try Browser.cash first (for prize qualification)
      console.log(`   📡 Attempting Browser.cash scrape...`);
      const result = await this.scrapeWithBrowserCash(url);
      console.log(`   ✅ Browser.cash scrape successful!`);
      return result;
    } catch (error: any) {
      console.warn(`   ⚠️ Browser.cash failed: ${error.message}`);
      console.log(`   🔄 Falling back to Playwright scraper...`);
      
      // Fallback to Playwright
      try {
        const fallbackResult = await this.fallbackScraper.scrapeWebsite(url);
        console.log(`   ✅ Playwright fallback successful!`);
        return fallbackResult;
      } catch (fallbackError: any) {
        throw new Error(`Both Browser.cash and Playwright failed. Browser.cash: ${error.message}, Playwright: ${fallbackError.message}`);
      }
    }
  }

  /**
   * Simple Browser.cash scraping - just the main page
   */
  private async scrapeWithBrowserCash(url: string): Promise<ScrapedData> {
    const TIMEOUT = 60000; // 60 seconds max
    
    // Create a simple prompt
    const prompt = this.isGitHubUrl(url)
      ? `Visit ${url} and extract:
- The repository name and description
- The main README content (first 2000 words)
- Key features or technologies mentioned
- Star count if visible
Keep it concise and focused.`
      : `Visit ${url} and extract:
- The page title
- Main description or value proposition
- Key features or benefits (first 5-7 items)
- Any important metrics or numbers
Keep it concise and focused on what matters for a pitch deck.`;

    // Create task
    const taskId = await this.createTask(prompt);
    
    // Poll for completion with timeout
    const result = await Promise.race([
      this.pollTask(taskId),
      new Promise<string>((_, reject) => 
        setTimeout(() => reject(new Error('Browser.cash timeout (60s)')), TIMEOUT)
      )
    ]);

    // Parse result
    const parsed = this.parseScrapeResult(url, result);
    
    return {
      mainPage: parsed,
      adjacentPages: [], // Keep it simple - just main page
    };
  }

  /**
   * Create a task with Browser.cash
   */
  private async createTask(prompt: string): Promise<string> {
    try {
      const response = await axios.post<TaskResponse>(
        `${this.baseUrl}/v1/task/create`,
        {
          agent: 'gemini',
          prompt: prompt,
          mode: 'text',
          stepLimit: 25,
        },
        {
          headers: {
            'Authorization': `Bearer ${this.agentApiKey}`,
            'Content-Type': 'application/json',
          },
          timeout: 30000,
        }
      );

      if (response.status >= 400) {
        throw new Error(`Task creation failed: HTTP ${response.status}`);
      }

      return response.data.taskId;
    } catch (error: any) {
      if (error.response) {
        throw new Error(`Browser.cash API error: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
      }
      throw new Error(`Failed to create Browser.cash task: ${error.message}`);
    }
  }

  /**
   * Poll for task completion - simple version
   */
  private async pollTask(taskId: string): Promise<string> {
    // Wait before first poll
    await new Promise(resolve => setTimeout(resolve, 5000));

    let attempts = 0;
    const maxAttempts = 12; // 60 seconds total (12 * 5 seconds)
    const pollInterval = 5000;

    while (attempts < maxAttempts) {
      attempts++;

      try {
        const response = await axios.get<TaskStatus>(
          `${this.baseUrl}/v1/task/${taskId}`,
          {
            headers: {
              'Authorization': `Bearer ${this.agentApiKey}`,
            },
            timeout: 30000,
          }
        );

        const data = response.data;
        const status = data.status || data.state || 'unknown';

        if (status === 'completed' || status === 'success' || status === 'finished') {
          // Extract result
          if (data.result) {
            if (typeof data.result === 'string') {
              return data.result;
            } else if (typeof data.result === 'object' && data.result.answer) {
              return data.result.answer;
            } else if (typeof data.result === 'object' && data.result.content) {
              return data.result.content;
            }
          }
          throw new Error('Task completed but no result found');
        }

        if (status === 'failed' || status === 'error') {
          throw new Error(data.failedReason || data.error || 'Task failed');
        }

        // Still processing
        if (status === 'active' || status === 'running' || status === 'pending' || status === 'processing' || status === 'queued') {
          await new Promise(resolve => setTimeout(resolve, pollInterval));
          continue;
        }

        // Unknown status - continue polling
        await new Promise(resolve => setTimeout(resolve, pollInterval));
      } catch (error: any) {
        if (error.response && error.response.status === 404) {
          throw new Error('Task not found');
        }
        // Retry on other errors
        await new Promise(resolve => setTimeout(resolve, pollInterval));
      }
    }

    throw new Error('Browser.cash task timed out after 60 seconds');
  }

  /**
   * Parse Browser.cash result into ScrapeResult
   */
  private parseScrapeResult(url: string, result: string): ScrapeResult {
    // Try to extract structured data from result
    let title = 'Untitled';
    let description = '';
    let content = result;

    // Try to parse TITLE: and DESCRIPTION: if present
    const titleMatch = result.match(/TITLE:\s*(.+?)(?:\n|$)/i);
    if (titleMatch) {
      title = titleMatch[1].trim();
      content = content.replace(/TITLE:.*?\n/i, '');
    }

    const descMatch = result.match(/DESCRIPTION:\s*(.+?)(?:\n|$)/i);
    if (descMatch) {
      description = descMatch[1].trim();
      content = content.replace(/DESCRIPTION:.*?\n/i, '');
    }

    // Clean up content
    content = content
      .replace(/^(TITLE|DESCRIPTION|CONTENT|LINKS):\s*/gmi, '')
      .trim()
      .substring(0, 5000); // Limit to 5000 chars

    // Extract links if present
    const links: string[] = [];
    const linksMatch = result.match(/LINKS?:[\s\S]*?((?:https?:\/\/[^\s\n]+[\s\n]*)+)/i);
    if (linksMatch) {
      links.push(...linksMatch[1].match(/https?:\/\/[^\s\n]+/g) || []);
    }

    return {
      url,
      title: title || 'Untitled',
      content: content || result.substring(0, 5000),
      links: links.slice(0, 20),
      metadata: {
        description: description || undefined,
      },
    };
  }

  /**
   * Check if URL is a GitHub URL
   */
  private isGitHubUrl(url: string): boolean {
    return url.includes('github.com');
  }
}
