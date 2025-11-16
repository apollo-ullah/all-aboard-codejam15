import { chromium, Browser, Page } from 'playwright';
import { ScrapeResult, ScrapedData } from '../types/index';

/**
 * PlaywrightScrapingService - Web scraping using Playwright
 * 
 * Primary scraping method that uses Playwright to directly scrape websites.
 * More reliable than Browser.cash and doesn't require external API.
 */

export class PlaywrightScrapingService {
  private browser: Browser | null = null;

  constructor() {
    console.log('🎭 Using Playwright for web scraping');
  }

  /**
   * Scrape a website with intelligent page discovery
   */
  async scrapeWebsite(url: string): Promise<ScrapedData> {
    let browserLaunched = false;
    try {
      console.log(`🌐 Playwright scraping: ${url}`);
      
      // Launch browser
      await this.ensureBrowser();
      if (!this.browser) {
        throw new Error('Failed to launch browser');
      }
      browserLaunched = true;

      // 1. Scrape main page
      console.log(`   📄 Step 1: Scraping main page...`);
      const mainPage = await this.scrapePage(url);
      console.log(`   ✅ Main page scraped: "${mainPage.title}" (${mainPage.content.length} chars, ${mainPage.links.length} links)`);

      // 2. Discover and scrape adjacent pages
      const priorityPages = this.discoverPriorityPages(mainPage.links, url);
      console.log(`   🔍 Discovered ${priorityPages.length} priority pages`);

      // 3. Scrape priority pages (limit to 7 pages)
      const adjacentPages: ScrapeResult[] = [];
      const maxPages = 7;

      for (let i = 0; i < Math.min(maxPages, priorityPages.length); i++) {
        const pageUrl = priorityPages[i];
        try {
          console.log(`   📄 Scraping priority page ${i + 1}/${Math.min(maxPages, priorityPages.length)}: ${pageUrl}`);
          const page = await this.scrapePage(pageUrl);
          adjacentPages.push(page);
          console.log(`   ✅ Scraped: ${pageUrl} - "${page.title}"`);
        } catch (error: any) {
          console.warn(`   ⚠️ Failed to scrape ${pageUrl}: ${error.message}`);
          // Continue with other pages
        }
      }

      console.log(`   ✅ Playwright scraping complete: 1 main page + ${adjacentPages.length} adjacent pages`);
      return { mainPage, adjacentPages };
    } catch (error: any) {
      console.error('❌ Error in Playwright scraping:', error.message);
      throw error;
    } finally {
      // Always cleanup browser if it was launched
      if (browserLaunched) {
        await this.cleanup();
      }
    }
  }

  /**
   * Scrape a single page
   */
  private async scrapePage(url: string): Promise<ScrapeResult> {
    if (!this.browser) {
      throw new Error('Browser not initialized');
    }

    const page = await this.browser.newPage();
    
    try {
      // Set a reasonable timeout
      page.setDefaultTimeout(30000); // 30 seconds
      
      // Navigate to the page
      await page.goto(url, { 
        waitUntil: 'networkidle',
        timeout: 30000 
      });

      // Wait a bit for dynamic content
      await page.waitForTimeout(2000);

      // Extract page data
      const title = await page.title();
      
      // Extract main content - try to get the most relevant content
      const content = await this.extractContent(page);
      
      // Extract metadata
      const metadata = await this.extractMetadata(page);
      
      // Extract all links
      const links = await this.extractLinks(page, url);

      return {
        url,
        title: title || 'Untitled',
        content,
        metadata,
        links,
      };
    } finally {
      await page.close();
    }
  }

  /**
   * Extract meaningful content from the page
   */
  private async extractContent(page: Page): Promise<string> {
    // Try multiple selectors to get the best content
    const contentSelectors = [
      'main',
      'article',
      '[role="main"]',
      '.content',
      '.main-content',
      '#content',
      'body',
    ];

    for (const selector of contentSelectors) {
      try {
        const element = await page.$(selector);
        if (element) {
          const text = await element.textContent();
          if (text && text.trim().length > 100) {
            return this.cleanText(text);
          }
        }
      } catch (e) {
        // Try next selector
      }
    }

    // Fallback: get body text
    const bodyText = await page.textContent('body');
    return this.cleanText(bodyText || '');
  }

  /**
   * Extract metadata (description, OG tags, etc.)
   */
  private async extractMetadata(page: Page): Promise<{
    description?: string;
    ogTitle?: string;
    ogDescription?: string;
  }> {
    const metadata: {
      description?: string;
      ogTitle?: string;
      ogDescription?: string;
    } = {};

    // Get meta description
    const metaDesc = await page.$('meta[name="description"]');
    if (metaDesc) {
      metadata.description = await metaDesc.getAttribute('content') || undefined;
    }

    // Get OG title
    const ogTitle = await page.$('meta[property="og:title"]');
    if (ogTitle) {
      metadata.ogTitle = await ogTitle.getAttribute('content') || undefined;
    }

    // Get OG description
    const ogDesc = await page.$('meta[property="og:description"]');
    if (ogDesc) {
      metadata.ogDescription = await ogDesc.getAttribute('content') || undefined;
    }

    return metadata;
  }

  /**
   * Extract all links from the page
   */
  private async extractLinks(page: Page, baseUrl: string): Promise<string[]> {
    const links = await page.$$eval('a[href]', (anchors) => {
      return anchors
        .map((a: any) => a.href)
        .filter((href: string) => href && !href.startsWith('javascript:') && !href.startsWith('mailto:'));
    });

    // Normalize URLs
    const normalizedLinks = links
      .map((link) => {
        try {
          const url = new URL(link, baseUrl);
          return url.href;
        } catch {
          return null;
        }
      })
      .filter((link): link is string => link !== null && link.startsWith('http'));

    // Remove duplicates
    return Array.from(new Set(normalizedLinks));
  }

  /**
   * Discover priority pages for scraping (About, Features, etc.)
   */
  private discoverPriorityPages(links: string[], baseUrl: string): string[] {
    const baseDomain = new URL(baseUrl).origin;
    const priorityKeywords = [
      'about',
      'features',
      'product',
      'pricing',
      'how-it-works',
      'solutions',
      'testimonials',
      'case-studies',
      'blog',
      'docs',
      'documentation',
    ];

    // Filter links to same domain
    const sameDomainLinks = links.filter((link) => {
      try {
        return new URL(link).origin === baseDomain;
      } catch {
        return false;
      }
    });

    // Score and sort by priority
    const scoredLinks = sameDomainLinks.map((link) => {
      const path = new URL(link).pathname.toLowerCase();
      let score = 0;

      for (const keyword of priorityKeywords) {
        if (path.includes(keyword)) {
          score += 10;
          // Higher priority for certain keywords
          if (['about', 'features', 'product'].includes(keyword)) {
            score += 5;
          }
        }
      }

      return { link, score };
    });

    // Sort by score (highest first) and return unique links
    const sorted = scoredLinks
      .sort((a, b) => b.score - a.score)
      .filter((item) => item.score > 0)
      .map((item) => item.link);

    // Remove duplicates while preserving order
    return Array.from(new Set(sorted));
  }

  /**
   * Clean and normalize text content
   */
  private cleanText(text: string): string {
    return text
      .replace(/\s+/g, ' ') // Replace multiple whitespace with single space
      .replace(/\n\s*\n/g, '\n') // Remove empty lines
      .trim()
      .substring(0, 50000); // Limit to 50k chars
  }

  /**
   * Ensure browser is launched
   */
  private async ensureBrowser(): Promise<void> {
    if (!this.browser) {
      console.log('   🚀 Launching Playwright browser...');
      this.browser = await chromium.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });
    }
  }

  /**
   * Cleanup browser resources
   */
  private async cleanup(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }
}

