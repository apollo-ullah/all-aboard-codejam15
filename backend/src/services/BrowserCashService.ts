import axios from 'axios';
import { ScrapeResult, ScrapedData } from '../types/index';

/**
 * BrowserCashService - Web scraping using Browser.cash API
 * 
 * Uses Agent API as primary method (autonomous navigation to find related pages)
 * Falls back to Browser API if Agent API fails
 * 
 * NOTE: API endpoints and request format should be verified against:
 * https://dash.browser.cash/docs
 * 
 * Common endpoint patterns:
 * - Agent API: /agent/run or /v1/agent/run
 * - Browser API: /browser/scrape or /v1/browser/scrape
 */

interface BrowserCashConfig {
  agentApiKey: string;
  browserApiKey: string;
  baseUrl: string;
}

export class BrowserCashService {
  private agentApiKey: string;
  private browserApiKey: string;
  private baseUrl: string;

  constructor(config: BrowserCashConfig) {
    this.agentApiKey = config.agentApiKey;
    this.browserApiKey = config.browserApiKey;
    this.baseUrl = config.baseUrl || 'https://api.browser.cash';
  }

  async scrapeWebsite(url: string): Promise<ScrapedData> {
    // Use Agent API to autonomously scrape main page + adjacent pages
    // The agent will intelligently find and scrape related pages (About, Features, Pricing, etc.)
    
    try {
      const response = await axios.post(
        `${this.baseUrl}/agent/run`,
        {
          task: `Scrape the website ${url} and find up to 5 related pages such as About, Features, Pricing, Product, Team, or How It Works pages. Extract the main content, title, metadata, and links from each page.`,
          maxPages: 6, // Main page + 5 adjacent pages
          extractContent: true,
          extractLinks: true,
          takeScreenshots: true,
        },
        {
          headers: {
            'Authorization': `Bearer ${this.agentApiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );
      
      // Parse agent response - it should return multiple pages
      const pages = response.data.pages || [response.data];
      const mainPage = this.parsePageResult(pages[0] || response.data, url);
      const adjacentPages = pages.slice(1, 6).map((page: any, idx: number) => 
        this.parsePageResult(page, page.url || `adjacent-${idx}`)
      );
      
      return { mainPage, adjacentPages };
    } catch (error: any) {
      console.error('Agent API error, falling back to Browser API:', error.message);
      // Fallback to Browser API if Agent API fails
      return this.scrapeWithBrowserAPI(url);
    }
  }

  private async scrapeWithBrowserAPI(url: string): Promise<ScrapedData> {
    // Fallback: Use Browser API with manual link finding
    const mainPage = await this.scrapePage(url);
    const adjacentLinks = this.findAdjacentPages(mainPage.links, url);
    const adjacentPages = await Promise.all(
      adjacentLinks.slice(0, 5).map(link => this.scrapePage(link))
    );
    return { mainPage, adjacentPages };
  }

  private parsePageResult(data: any, defaultUrl: string): ScrapeResult {
    return {
      url: data.url || defaultUrl,
      title: data.title || data.metadata?.title || 'Untitled',
      content: data.content || data.text || data.body || '',
      metadata: {
        description: data.metadata?.description || data.description,
        ogTitle: data.metadata?.ogTitle || data.ogTitle,
        ogDescription: data.metadata?.ogDescription || data.ogDescription,
      },
      links: data.links || [],
      screenshot: data.screenshot || data.screenshotUrl,
    };
  }

  private async scrapePage(url: string): Promise<ScrapeResult> {
    // Use Browser API to scrape a single page (fallback method)
    // Reference their docs: https://dash.browser.cash/docs
    
    try {
      const response = await axios.post(
        `${this.baseUrl}/browser/scrape`,
        {
          url: url,
          extractContent: true,
          extractLinks: true,
          takeScreenshot: true,
        },
        {
          headers: {
            'Authorization': `Bearer ${this.browserApiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );
      
      return this.parsePageResult(response.data, url);
    } catch (error: any) {
      console.error(`Error scraping ${url}:`, error.message);
      // Return a fallback result
      return {
        url,
        title: 'Error loading page',
        content: '',
        metadata: {},
        links: [],
      };
    }
  }

  private findAdjacentPages(links: string[], baseUrl: string): string[] {
    // Find relevant adjacent pages (About, Features, Pricing, Team, etc.)
    const keywords = ['about', 'features', 'pricing', 'product', 'team', 'how-it-works'];
    const baseDomain = new URL(baseUrl).hostname;
    
    return links
      .filter(link => {
        try {
          const linkUrl = new URL(link);
          // Same domain and contains relevant keywords
          return linkUrl.hostname === baseDomain && 
                 keywords.some(keyword => link.toLowerCase().includes(keyword));
        } catch {
          return false;
        }
      })
      .slice(0, 5);
  }
}

