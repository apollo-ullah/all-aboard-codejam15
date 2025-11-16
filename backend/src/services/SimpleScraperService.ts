import { chromium, Browser, Page } from 'playwright';
import { ScrapeResult, ScrapedData } from '../types/index';

/**
 * SimpleScraperService - Simple, reliable web scraping using Playwright
 * 
 * No complex logic, just works. Handles any website or GitHub URL reliably.
 */
export class SimpleScraperService {
  private browser: Browser | null = null;

  /**
   * Scrape a website - simple and reliable
   */
  async scrapeWebsite(url: string): Promise<ScrapedData> {
    console.log(`🌐 Scraping: ${url}`);
    
    try {
      // Launch browser
      this.browser = await chromium.launch({
        headless: true,
        timeout: 30000,
      });

      const context = await this.browser.newContext({
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        viewport: { width: 1920, height: 1080 },
      });

      const page = await context.newPage();
      
      // Set timeout
      page.setDefaultTimeout(30000);
      page.setDefaultNavigationTimeout(30000);

      // Navigate to URL
      console.log(`   📄 Loading page...`);
      await page.goto(url, { 
        waitUntil: 'domcontentloaded',
        timeout: 30000 
      });

      // Wait a bit for dynamic content
      await page.waitForTimeout(2000);

      // Scrape main page
      const mainPage = await this.scrapePage(page, url);
      console.log(`   ✅ Scraped: "${mainPage.title}" (${mainPage.content.length} chars)`);

      // For GitHub, try to get README
      let adjacentPages: ScrapeResult[] = [];
      if (this.isGitHubUrl(url)) {
        try {
          const readmePage = await this.scrapeGitHubReadme(page, url);
          if (readmePage) {
            adjacentPages.push(readmePage);
            console.log(`   ✅ Scraped README: "${readmePage.title}"`);
          }
        } catch (error: any) {
          console.warn(`   ⚠️ Could not scrape README: ${error.message}`);
        }
      }

      await this.browser.close();
      this.browser = null;

      return {
        mainPage,
        adjacentPages,
      };
    } catch (error: any) {
      if (this.browser) {
        await this.browser.close();
        this.browser = null;
      }
      throw new Error(`Failed to scrape ${url}: ${error.message}`);
    }
  }

  /**
   * Scrape a single page
   */
  private async scrapePage(page: Page, url: string): Promise<ScrapeResult> {
    // Get title
    const title = await page.title().catch(() => 'Untitled');
    
    // Get meta description
    const description = await page.$eval('meta[name="description"]', el => el.getAttribute('content'))
      .catch(() => 
        page.$eval('meta[property="og:description"]', el => el.getAttribute('content'))
          .catch(() => null)
      );

    // Get main content - try different selectors
    let content = '';
    
    // Try GitHub-specific selectors first
    if (this.isGitHubUrl(url)) {
      // GitHub repo page
      const repoDescription = await page.$eval('.repository-content .markdown-body', el => el.textContent || '')
        .catch(() => '');
      
      const readmeContent = await page.$eval('article.markdown-body', el => el.textContent || '')
        .catch(() => '');
      
      const aboutSection = await page.$eval('.repository-content .BorderGrid-row', el => el.textContent || '')
        .catch(() => '');
      
      content = [repoDescription, readmeContent, aboutSection]
        .filter(Boolean)
        .join('\n\n')
        .substring(0, 5000);
    } else {
      // Regular website - get main content
      const selectors = [
        'main',
        'article',
        '[role="main"]',
        '.main-content',
        '.content',
        'body',
      ];

      for (const selector of selectors) {
        try {
          const text = await page.$eval(selector, (el: Element) => {
            // Remove script and style elements
            const scripts = el.querySelectorAll('script, style, nav, header, footer');
            scripts.forEach((s: Element) => s.remove());
            return el.textContent || '';
          });
          
          if (text.length > 100) {
            content = text.substring(0, 5000);
            break;
          }
        } catch (e) {
          continue;
        }
      }

      // Fallback: get all text
      if (!content || content.length < 100) {
        content = await page.evaluate(() => {
          const scripts = document.querySelectorAll('script, style, nav, header, footer');
          scripts.forEach((s: Element) => s.remove());
          return document.body.textContent || '';
        });
        content = content.substring(0, 5000);
      }
    }

    // Get links
    const links = await page.$$eval('a[href]', (anchors: HTMLAnchorElement[]) => 
      anchors
        .map(a => a.getAttribute('href'))
        .filter((href): href is string => !!href)
        .map(href => {
          try {
            return new URL(href, window.location.href).href;
          } catch {
            return href;
          }
        })
        .filter(href => href.startsWith('http'))
        .slice(0, 20) // Limit to 20 links
    ).catch(() => []);

    return {
      url,
      title: title || 'Untitled',
      content: content || 'No content found',
      links,
      metadata: {
        description: description || undefined,
      },
    };
  }

  /**
   * Scrape GitHub README specifically
   */
  private async scrapeGitHubReadme(page: Page, baseUrl: string): Promise<ScrapeResult | null> {
    try {
      // Try different README paths
      const readmePaths = [
        '/blob/main/README.md',
        '/blob/master/README.md',
        '/blob/HEAD/README.md',
        '/README.md',
      ];

      for (const path of readmePaths) {
        const readmeUrl = baseUrl.replace(/\/$/, '') + path;
        
        try {
          await page.goto(readmeUrl, { 
            waitUntil: 'domcontentloaded',
            timeout: 10000 
          });
          await page.waitForTimeout(1500);
          
          // Check if we actually got the README (not a 404)
          const content = await page.$eval('article.markdown-body', el => el.textContent || '')
            .catch(() => '');
          
          if (content.length > 50) {
            return await this.scrapePage(page, readmeUrl);
          }
        } catch (error) {
          // Try next path
          continue;
        }
      }
      
      return null;
    } catch (error: any) {
      return null;
    }
  }

  /**
   * Check if URL is a GitHub URL
   */
  private isGitHubUrl(url: string): boolean {
    return url.includes('github.com');
  }
}

