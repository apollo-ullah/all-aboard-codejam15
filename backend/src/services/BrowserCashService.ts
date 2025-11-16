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
  id?: string;
  taskId?: string;
  task?: string;
  status?: 'queued' | 'running' | 'completed' | 'failed'; // Official field from docs
  state?: 'queued' | 'running' | 'active' | 'completed' | 'failed' | 'error'; // Alternative field name
  startedAt?: number;
  stoppedAt?: number | null;
  inputTokens?: number | null;
  outputTokens?: number | null;
  data?: {
    prompt: string;
    agent: string;
    mode: string;
    stepLimit: number;
  };
  result?: {
    answer?: string;
    content?: string;
    [key: string]: any; // Allow other result fields
  } | string | null; // Result can be object or string
  attemptsMade?: number;
  failedReason?: string;
  error?: string;
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
   * Scrape a website with intelligent, mission-focused strategy
   * Revolutionary approach: Context-aware scraping for pitch deck generation
   */
  async scrapeWebsite(url: string): Promise<ScrapedData> {
    try {
      console.log(`🌐 Intelligent scraping for pitch deck: ${url}`);
      console.log(`   Using Browser.cash Agent API: ${this.baseUrl}`);
      
      // 1. Scrape main page with enhanced prompt
      console.log(`   📄 Step 1: Analyzing main page...`);
      const mainPage = await this.scrapePageIntelligently(url, 'main');
      console.log(`   ✅ Main page analyzed: "${mainPage.title}" (${mainPage.content.length} chars)`);
      
      // 2. Detect project type and GitHub links
      const projectType = this.detectProjectType(mainPage, url);
      console.log(`   🎯 Detected project type: ${projectType}`);
      
      // 3. Intelligent page discovery - find the MOST VALUABLE pages for a pitch
      const priorityPages = this.discoverPriorityPages(mainPage.links, url, projectType);
      console.log(`   🔍 Discovered ${priorityPages.length} priority pages for pitch deck`);
      
      // 4. Scrape priority pages in order of importance
      const adjacentPages: ScrapeResult[] = [];
      const maxPages = 7; // Increased from 5 for better coverage
      
      for (let i = 0; i < Math.min(maxPages, priorityPages.length); i++) {
        const pageInfo = priorityPages[i];
        try {
          console.log(`   📄 Scraping priority page ${i + 1}/${Math.min(maxPages, priorityPages.length)}: ${pageInfo.url} (${pageInfo.priority})`);
          const page = await this.scrapePageIntelligently(pageInfo.url, pageInfo.type);
            adjacentPages.push(page);
          console.log(`   ✅ Scraped: ${pageInfo.url} - "${page.title}"`);
          } catch (error: any) {
          console.warn(`   ⚠️ Failed to scrape ${pageInfo.url}: ${error.message}`);
            // Continue with other pages
          }
      }
      
      // 5. If GitHub repo detected, extract comprehensive GitHub intelligence (with graceful fallback)
      if (projectType === 'github' || this.isGitHubUrl(url)) {
        console.log(`   🔗 GitHub repo detected - extracting comprehensive intelligence...`);
        try {
          // Use Promise.allSettled to continue even if some extractions fail
          const githubIntelligence = await this.extractGitHubIntelligence(url);
          if (githubIntelligence && githubIntelligence.length > 0) {
            // Add all GitHub intelligence pages
            adjacentPages.push(...githubIntelligence);
            console.log(`   ✅ Extracted ${githubIntelligence.length} GitHub intelligence pages`);
          } else {
            console.log(`   ℹ️ No GitHub intelligence extracted, continuing with main page only`);
          }
        } catch (error: any) {
          console.warn(`   ⚠️ GitHub intelligence extraction failed: ${error.message}`);
          console.warn(`   ℹ️ Continuing with main page and adjacent pages only`);
          // Don't throw - continue with what we have
        }
      }
      
      console.log(`   ✅ Intelligent scraping complete: 1 main page + ${adjacentPages.length} priority pages`);
      return { mainPage, adjacentPages };
    } catch (error: any) {
      console.error('❌ Error scraping website:', error.message);
      console.error('   Stack:', error.stack);
      throw error;
    }
  }

  /**
   * Intelligently scrape a page with context-aware prompts
   */
  private async scrapePageIntelligently(url: string, pageType: 'main' | 'about' | 'features' | 'pricing' | 'testimonials' | 'blog' | 'docs' | 'github' | 'other'): Promise<ScrapeResult> {
    const contextPrompts: Record<string, string> = {
      main: `You are analyzing a startup/product website to create a pitch deck. Focus on:
- Value proposition and unique selling points
- Target audience and market positioning
- Key features and differentiators
- Any metrics, numbers, or growth stats
- Customer logos or social proof
- The core problem being solved`,
      
      about: `This is the "About" or "Company" page. Extract:
- Company mission and vision
- Founding story or origin
- Team information
- Company values
- What makes them unique`,
      
      features: `This is a features/product page. Extract:
- All product features and capabilities
- How each feature solves a problem
- Technical specifications if relevant
- Use cases and applications
- Feature comparisons or advantages`,
      
      pricing: `This is a pricing page. Extract:
- Pricing tiers and models
- Value proposition at each tier
- What's included in each plan
- ROI or cost savings messaging
- Enterprise/contact options`,
      
      testimonials: `This is a testimonials/customers page. Extract:
- Customer quotes and testimonials
- Customer logos and company names
- Use cases and success stories
- Metrics or results mentioned
- Industry verticals served`,
      
      blog: `This is a blog or content page. Extract:
- Key insights about the product/market
- Thought leadership content
- Product updates or announcements
- Market analysis or trends
- Any metrics or data points`,
      
      docs: `This is documentation. Extract:
- Product capabilities and features
- Technical architecture if relevant
- Use cases and examples
- Integration information
- API or developer information`,
      
      github: `This is a GitHub repository. Extract:
- Project description and README
- Key features and capabilities
- Technology stack
- Installation/usage information
- Contributing guidelines or community info`,
      
      other: `Extract all relevant content for a pitch deck:
- Key information about the product/service
- Value propositions
- Features and benefits
- Any metrics or social proof`
    };
    
    const contextPrompt = contextPrompts[pageType] || contextPrompts.other;
    
    const prompt = `Visit and analyze the website ${url} for creating a pitch deck.

${contextPrompt}

Extract and provide:

TITLE: [The page title from the <title> tag or main heading]

DESCRIPTION: [The meta description or a brief summary of the page]

CONTENT: [All main content including:
- All headings (H1, H2, H3, etc.)
- All paragraphs and text content
- Lists and bullet points
- Key features, benefits, metrics, or important information
- Customer testimonials, logos, or social proof
- Any numbers, statistics, or data points
- Value propositions and unique selling points
- Any other relevant text content]

LINKS: [List all links found on the page, one per line, with full URLs]

Be comprehensive and prioritize information that would be valuable for a pitch deck.`;

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
   * Legacy method - kept for backward compatibility
   */
  private async scrapePage(url: string): Promise<ScrapeResult> {
    return this.scrapePageIntelligently(url, 'other');
  }

  /**
   * Detect project type from URL and content
   */
  private detectProjectType(mainPage: ScrapeResult, url: string): 'github' | 'saas' | 'opensource' | 'website' | 'unknown' {
    const urlLower = url.toLowerCase();
    const contentLower = mainPage.content.toLowerCase();
    const titleLower = mainPage.title.toLowerCase();
    
    // Check for GitHub
    if (urlLower.includes('github.com') || urlLower.includes('github.io')) {
      return 'github';
    }
    
    // Check for open source indicators
    if (contentLower.includes('open source') || 
        contentLower.includes('opensource') ||
        contentLower.includes('mit license') ||
        contentLower.includes('apache license') ||
        contentLower.includes('contributing') ||
        contentLower.includes('pull request')) {
      return 'opensource';
    }
    
    // Check for SaaS indicators
    if (contentLower.includes('pricing') ||
        contentLower.includes('subscription') ||
        contentLower.includes('free trial') ||
        contentLower.includes('sign up') ||
        contentLower.includes('dashboard') ||
        titleLower.includes('saas') ||
        contentLower.includes('software as a service')) {
      return 'saas';
    }
    
    // Default to website
    return 'website';
  }

  /**
   * Discover priority pages for pitch deck generation
   * Revolutionary: Intelligently ranks pages by value for storytelling
   */
  private discoverPriorityPages(links: string[], baseUrl: string, projectType: string): Array<{url: string, type: 'about' | 'features' | 'pricing' | 'testimonials' | 'blog' | 'docs' | 'github' | 'other', priority: number}> {
    const baseDomain = new URL(baseUrl).hostname;
    const priorityPages: Array<{url: string, type: any, priority: number}> = [];
    
    // Priority patterns for pitch deck generation (ordered by importance)
    const priorityPatterns = [
      // Highest priority: Social proof and validation
      { 
        patterns: ['testimonial', 'customer', 'case-study', 'success', 'stories', 'reviews', 'clients', 'users'],
        type: 'testimonials' as const,
        priority: 100,
        description: 'Social proof'
      },
      // High priority: Value proposition
      { 
        patterns: ['features', 'product', 'solutions', 'capabilities', 'how-it-works', 'what-we-do'],
        type: 'features' as const,
        priority: 90,
        description: 'Product features'
      },
      // High priority: About/Company story
      { 
        patterns: ['about', 'company', 'team', 'story', 'mission', 'vision', 'why'],
        type: 'about' as const,
        priority: 85,
        description: 'Company story'
      },
      // Medium-high: Pricing/Business model
      { 
        patterns: ['pricing', 'plans', 'purchase', 'buy', 'pricing-table'],
        type: 'pricing' as const,
        priority: 75,
        description: 'Pricing model'
      },
      // Medium: Documentation/Technical
      { 
        patterns: ['docs', 'documentation', 'guide', 'api', 'developer', 'integration'],
        type: 'docs' as const,
        priority: 60,
        description: 'Technical docs'
      },
      // Medium: Blog/Content
      { 
        patterns: ['blog', 'news', 'updates', 'announcements', 'articles'],
        type: 'blog' as const,
        priority: 50,
        description: 'Content/blog'
      },
    ];
    
    // For GitHub repos, prioritize README and docs
    if (projectType === 'github') {
      priorityPatterns.unshift({
        patterns: ['readme', 'docs', 'documentation'],
        type: 'docs' as const,
        priority: 95,
        description: 'GitHub docs'
      });
    }
    
    // Score and categorize each link
    for (const link of links) {
      try {
        const linkUrl = new URL(link);
        const linkHost = linkUrl.hostname;
        const linkPath = linkUrl.pathname.toLowerCase();
        
        // Only include same-domain links
        if (linkHost !== baseDomain && !linkHost.includes(baseDomain.replace('www.', ''))) {
          continue;
        }
        
        // Skip common non-content pages
        const skipPatterns = ['privacy', 'terms', 'legal', 'cookie', 'contact', 'support', 'login', 'signup', 'register'];
        if (skipPatterns.some(pattern => linkPath.includes(pattern))) {
          continue;
        }
        
        // Score the link based on priority patterns
        let maxPriority = 0;
        let matchedType: any = 'other';
        
        for (const patternGroup of priorityPatterns) {
          const matches = patternGroup.patterns.some(pattern => 
            linkPath.includes(pattern) || link.toLowerCase().includes(pattern)
          );
          
          if (matches && patternGroup.priority > maxPriority) {
            maxPriority = patternGroup.priority;
            matchedType = patternGroup.type;
          }
        }
        
        // If no pattern matched, give it a low priority
        if (maxPriority === 0) {
          maxPriority = 10;
          matchedType = 'other';
        }
        
        priorityPages.push({
          url: link,
          type: matchedType,
          priority: maxPriority
        });
      } catch (error) {
        // Skip invalid URLs
        continue;
      }
    }
    
    // Sort by priority (highest first), then by URL length (shorter = usually more important)
    priorityPages.sort((a, b) => {
      if (b.priority !== a.priority) {
        return b.priority - a.priority;
      }
      return a.url.length - b.url.length;
    });
    
    // Remove duplicates (same URL)
    const seen = new Set<string>();
    const uniquePages = priorityPages.filter(page => {
      if (seen.has(page.url)) {
        return false;
      }
      seen.add(page.url);
      return true;
    });
    
    return uniquePages;
  }

  /**
   * Check if URL is a GitHub repository
   */
  private isGitHubUrl(url: string): boolean {
    return url.toLowerCase().includes('github.com');
  }

  /**
   * Extract comprehensive GitHub intelligence for pitch deck generation
   * Revolutionary: Multi-faceted GitHub analysis with graceful error handling
   */
  private async extractGitHubIntelligence(url: string): Promise<ScrapeResult[]> {
    const intelligencePages: ScrapeResult[] = [];
    
    try {
      const githubRepoMatch = url.match(/github\.com\/([^\/]+)\/([^\/]+)/);
      if (!githubRepoMatch) {
        return [];
      }
      
      const [, owner, repo] = githubRepoMatch;
      const baseRepoUrl = `https://github.com/${owner}/${repo}`;
      
      console.log(`   📊 Extracting GitHub intelligence for ${owner}/${repo}...`);
      
      // Use Promise.allSettled to run all extractions in parallel and continue even if some fail
      const extractionPromises = [
        // 1. Repository Overview & Metrics (highest priority)
        this.extractGitHubMetrics(baseRepoUrl, owner, repo).catch(err => {
          console.warn(`   ⚠️ Metrics extraction failed: ${err.message}`);
          return null;
        }),
        
        // 2. README Deep Analysis (high priority)
        this.extractGitHubReadme(baseRepoUrl, owner, repo).catch(err => {
          console.warn(`   ⚠️ README extraction failed: ${err.message}`);
          return null;
        }),
        
        // 3. Releases (medium priority - can skip if fails)
        this.extractGitHubReleases(baseRepoUrl, owner, repo).catch(err => {
          console.warn(`   ⚠️ Releases extraction failed: ${err.message}`);
          return null;
        }),
        
        // 4. Issues (medium priority - can skip if fails)
        this.extractGitHubIssues(baseRepoUrl, owner, repo).catch(err => {
          console.warn(`   ⚠️ Issues extraction failed: ${err.message}`);
          return null;
        }),
        
        // 5. Contributors (lower priority - can skip if fails)
        this.extractGitHubContributors(baseRepoUrl, owner, repo).catch(err => {
          console.warn(`   ⚠️ Contributors extraction failed: ${err.message}`);
          return null;
        }),
        
        // 6. Tech Stack (lower priority - can skip if fails)
        this.extractGitHubTechStack(baseRepoUrl, owner, repo).catch(err => {
          console.warn(`   ⚠️ Tech stack extraction failed: ${err.message}`);
          return null;
        }),
      ];
      
      // Wait for all extractions (some may fail, that's OK)
      const results = await Promise.allSettled(extractionPromises);
      
      // Collect successful results
      for (const result of results) {
        if (result.status === 'fulfilled' && result.value) {
          intelligencePages.push(result.value);
        }
      }
      
      console.log(`   ✅ Successfully extracted ${intelligencePages.length}/6 GitHub intelligence pages`);
      return intelligencePages;
      
    } catch (error: any) {
      console.warn(`   ⚠️ Error in GitHub intelligence extraction: ${error.message}`);
      return intelligencePages; // Return what we have so far
    }
  }

  /**
   * Extract repository metrics and overview
   */
  private async extractGitHubMetrics(baseRepoUrl: string, owner: string, repo: string): Promise<ScrapeResult | null> {
    try {
      console.log(`   📈 Extracting repository metrics and overview...`);
      const metricsPrompt = `Visit ${baseRepoUrl} and extract comprehensive repository intelligence:

REPOSITORY METRICS:
- Number of stars ⭐
- Number of forks 🍴
- Number of watchers 👀
- Number of contributors 👥
- Number of open/closed issues
- Number of open/closed pull requests
- Repository size
- Language breakdown (if shown)
- License type
- Last updated date
- Created date

REPOSITORY DESCRIPTION:
- Main description/tagline
- Repository topics/tags
- Website link (if any)
- Any badges or status indicators

ACTIVITY INDICATORS:
- Recent commit activity
- Recent releases
- Community engagement signals

Format the output clearly with all metrics and descriptions.`;

      const metricsTaskId = await this.createTask(metricsPrompt);
      const metricsResult = await this.pollTask(metricsTaskId);
      
      if (metricsResult && metricsResult.trim().length > 0) {
        return {
          url: baseRepoUrl,
          title: `${repo} - Repository Metrics & Overview`,
          content: `REPOSITORY: ${owner}/${repo}\n\n${metricsResult.substring(0, 4000)}`,
          metadata: {
            description: `GitHub repository metrics, stars, forks, contributors, and activity for ${owner}/${repo}`
          },
          links: []
        };
      }
      return null;
    } catch (error: any) {
      throw new Error(`Metrics extraction failed: ${error.message}`);
    }
  }

  /**
   * Extract README deep analysis
   */
  private async extractGitHubReadme(baseRepoUrl: string, owner: string, repo: string): Promise<ScrapeResult | null> {
    try {
      console.log(`   📖 Extracting comprehensive README analysis...`);
      const readmePrompt = `Visit ${baseRepoUrl} and analyze the README file in detail. Extract:

PROJECT OVERVIEW:
- Project name and tagline
- What problem does this solve?
- Target audience/users
- Main value proposition

FEATURES & CAPABILITIES:
- Key features (list all)
- Technical capabilities
- What makes it unique/different
- Use cases and examples

TECHNOLOGY STACK:
- Programming languages used
- Frameworks and libraries
- Dependencies mentioned
- Architecture or design patterns

INSTALLATION & USAGE:
- How to install/setup
- Quick start guide
- Usage examples
- Configuration options

COMMUNITY & CONTRIBUTION:
- Contributing guidelines
- Code of conduct
- Community links (Discord, Slack, etc.)
- How to report issues

METRICS & BADGES:
- Any badges shown (build status, coverage, etc.)
- Version information
- Release information

Extract everything comprehensively - this is critical for understanding the project.`;

      const readmeTaskId = await this.createTask(readmePrompt);
      const readmeResult = await this.pollTask(readmeTaskId);
      
      if (readmeResult && readmeResult.trim().length > 0) {
        return {
          url: `${baseRepoUrl}#readme`,
          title: `${repo} - README Deep Analysis`,
          content: readmeResult.substring(0, 6000),
          metadata: {
            description: `Comprehensive README analysis for ${owner}/${repo}`
          },
          links: []
        };
      }
      return null;
    } catch (error: any) {
      throw new Error(`README extraction failed: ${error.message}`);
    }
  }

  /**
   * Extract releases and changelog
   */
  private async extractGitHubReleases(baseRepoUrl: string, owner: string, repo: string): Promise<ScrapeResult | null> {
    try {
      console.log(`   🚀 Extracting releases and changelog...`);
      const releasesPrompt = `Visit ${baseRepoUrl}/releases and extract:

RECENT RELEASES:
- Latest release version and date
- Release notes/changelog
- What's new in recent versions
- Breaking changes
- New features added
- Bug fixes
- Performance improvements

RELEASE HISTORY:
- Number of total releases
- Release frequency
- Major milestones
- Version progression

Extract release information that shows project maturity and active development.`;

      const releasesTaskId = await this.createTask(releasesPrompt);
      const releasesResult = await this.pollTask(releasesTaskId);
      
      if (releasesResult && releasesResult.trim().length > 0) {
        return {
          url: `${baseRepoUrl}/releases`,
          title: `${repo} - Releases & Changelog`,
          content: releasesResult.substring(0, 3000),
          metadata: {
            description: `Release history and changelog for ${owner}/${repo}`
          },
          links: []
        };
      }
      return null;
    } catch (error: any) {
      throw new Error(`Releases extraction failed: ${error.message}`);
    }
  }

  /**
   * Extract issues and community engagement
   */
  private async extractGitHubIssues(baseRepoUrl: string, owner: string, repo: string): Promise<ScrapeResult | null> {
    try {
      console.log(`   💬 Extracting community engagement...`);
      const issuesPrompt = `Visit ${baseRepoUrl}/issues and analyze community engagement:

COMMUNITY METRICS:
- Number of open issues
- Number of closed issues
- Issue resolution rate (if visible)
- Recent issue activity

COMMUNITY SIGNALS:
- Types of issues (bugs, features, questions)
- Response time indicators
- Community participation
- Maintainer activity

FEATURE REQUESTS:
- Popular feature requests
- What users are asking for
- Pain points mentioned

This helps understand community needs and project direction.`;

      const issuesTaskId = await this.createTask(issuesPrompt);
      const issuesResult = await this.pollTask(issuesTaskId);
      
      if (issuesResult && issuesResult.trim().length > 0) {
        return {
          url: `${baseRepoUrl}/issues`,
          title: `${repo} - Community Engagement`,
          content: issuesResult.substring(0, 3000),
          metadata: {
            description: `Community engagement and issue analysis for ${owner}/${repo}`
          },
          links: []
        };
      }
      return null;
    } catch (error: any) {
      throw new Error(`Issues extraction failed: ${error.message}`);
    }
  }

  /**
   * Extract contributors and team information
   */
  private async extractGitHubContributors(baseRepoUrl: string, owner: string, repo: string): Promise<ScrapeResult | null> {
    try {
      console.log(`   👥 Extracting contributor information...`);
      const contributorsPrompt = `Visit ${baseRepoUrl}/graphs/contributors and extract:

CONTRIBUTOR METRICS:
- Total number of contributors
- Top contributors
- Contribution activity over time
- Commit frequency
- Community growth trend

TEAM SIGNALS:
- Maintainer activity
- Community contributions
- Project ownership
- Active development indicators

This shows project health and community involvement.`;

      const contributorsTaskId = await this.createTask(contributorsPrompt);
      const contributorsResult = await this.pollTask(contributorsTaskId);
      
      if (contributorsResult && contributorsResult.trim().length > 0) {
        return {
          url: `${baseRepoUrl}/graphs/contributors`,
          title: `${repo} - Contributors & Team`,
          content: contributorsResult.substring(0, 3000),
          metadata: {
            description: `Contributor and team information for ${owner}/${repo}`
          },
          links: []
        };
      }
      return null;
    } catch (error: any) {
      throw new Error(`Contributors extraction failed: ${error.message}`);
    }
  }

  /**
   * Extract technology stack
   */
  private async extractGitHubTechStack(baseRepoUrl: string, owner: string, repo: string): Promise<ScrapeResult | null> {
    try {
      console.log(`   🔧 Extracting technology stack...`);
      const techPrompt = `Visit ${baseRepoUrl} and analyze the codebase structure:

TECHNOLOGY STACK:
- Programming languages (from file extensions and language stats)
- Frameworks and libraries (from package.json, requirements.txt, Gemfile, etc.)
- Build tools and dependencies
- Architecture patterns visible

CODE ORGANIZATION:
- Directory structure
- Key files and their purposes
- Configuration files
- Documentation structure

DEPENDENCIES:
- External dependencies
- Technology choices
- Integration capabilities

Extract what technologies and tools this project uses.`;

      const techTaskId = await this.createTask(techPrompt);
      const techResult = await this.pollTask(techTaskId);
      
      if (techResult && techResult.trim().length > 0) {
        return {
          url: baseRepoUrl,
          title: `${repo} - Technology Stack`,
          content: techResult.substring(0, 3000),
          metadata: {
            description: `Technology stack and code structure for ${owner}/${repo}`
          },
          links: []
        };
      }
      return null;
    } catch (error: any) {
      throw new Error(`Tech stack extraction failed: ${error.message}`);
    }
  }

  /**
   * Create a task with the Agent API with retry logic
   */
  private async createTask(prompt: string, retries: number = 3): Promise<string> {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        console.log(`   📤 Creating task with Browser.cash Agent API... (attempt ${attempt}/${retries})`);
      console.log(`   📡 Endpoint: ${this.baseUrl}/v1/task/create`);
      
      const response = await axios.post<TaskResponse>(
        `${this.baseUrl}/v1/task/create`,
        {
          agent: 'gemini',
          prompt: prompt,
          mode: 'text',
          stepLimit: 25, // Higher limit for comprehensive scraping (matching working example)
        },
        {
          headers: {
            'Authorization': `Bearer ${this.agentApiKey}`,
            'Content-Type': 'application/json',
          },
          timeout: 60000, // Increased to 60 seconds for task creation
          validateStatus: (status) => status < 500, // Don't throw on 4xx errors
            // Add HTTPS agent configuration for better SSL handling
            httpsAgent: new (require('https').Agent)({
              rejectUnauthorized: true,
              keepAlive: true,
              keepAliveMsecs: 1000,
            }),
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
        console.error(`   ❌ Task creation failed (attempt ${attempt}/${retries}):`, error.message);
        console.error('   Error code:', error.code);
        
        // If this is the last attempt, throw the error
        if (attempt === retries) {
          console.error('   Error details:', {
            code: error.code,
            message: error.message,
            response: error.response ? {
              status: error.response.status,
              data: error.response.data
            } : null,
            request: error.request ? 'Request made but no response' : null
          });
          
          // Handle SSL/TLS errors
          if (error.code === 'SSL_ERROR_SYSCALL' || error.code === 'ECONNRESET' || error.message?.includes('SSL') || error.message?.includes('TLS')) {
            throw new Error(`SSL/TLS connection error: Cannot establish secure connection to Browser.cash API after ${retries} attempts. This may indicate: 1) The API endpoint is incorrect, 2) Network/firewall issues, 3) The API service may be temporarily unavailable. Please check https://browser.cash for API status and correct endpoint.`);
          }
          
          // Handle network errors
          if (error.code === 'ENOTFOUND' || error.code === 'EAI_AGAIN') {
            throw new Error(`DNS resolution failed: Cannot resolve hostname 'agent-api.browser.cash'. Check your internet connection and DNS settings.`);
          }
          
          if (error.code === 'ETIMEDOUT' || error.code === 'ECONNABORTED') {
            throw new Error(`Connection timeout: The Browser.cash API did not respond within the timeout period. The service may be slow or unavailable.`);
          }
      
      if (error.response) {
        const status = error.response.status;
        const data = error.response.data;
        
        // If we get HTML back, it's likely a 404 from wrong endpoint
        if (typeof data === 'string' && data.includes('<!DOCTYPE html>')) {
              throw new Error(`Failed to create task: Endpoint not found (404). The API endpoint may be incorrect. Expected: ${this.baseUrl}/v1/task/create. Please verify the correct endpoint in Browser.cash documentation.`);
            }
            
            // Handle authentication errors
            if (status === 401 || status === 403) {
              throw new Error(`Authentication failed (HTTP ${status}): Invalid or expired API key. Please check your AGENT_API_KEY in the .env file.`);
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
            throw new Error(`No response from server: The Browser.cash API at ${this.baseUrl} did not respond after ${retries} attempts. Possible causes: 1) API endpoint is incorrect, 2) Service is down, 3) Network/firewall blocking the connection. Please verify the API endpoint and check https://browser.cash for service status.`);
          }
          
          throw new Error(`Failed to create task after ${retries} attempts: ${error.message || 'Unknown error'}`);
        }
        
        // Wait before retrying (exponential backoff)
        const waitTime = Math.min(1000 * Math.pow(2, attempt - 1), 10000); // Max 10 seconds
        console.log(`   ⏳ Waiting ${waitTime}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
    
    // This should never be reached, but TypeScript needs it
    throw new Error('Failed to create task: All retry attempts exhausted');
  }

  /**
   * Poll for task completion
   */
  private async pollTask(taskId: string): Promise<string> {
    // Wait a moment before first poll (matching working example: 5 seconds)
    console.log(`   ⏳ Waiting 5 seconds before first status check...`);
    await new Promise(resolve => setTimeout(resolve, 5000));

    let attempts = 0;
    const maxAttempts = 60; // 5 minutes total (60 * 5 seconds)
    const pollInterval = 5000; // 5 seconds (matching working example)

    console.log(`   🔄 Polling task ${taskId} every ${pollInterval}ms...`);

    while (attempts < maxAttempts) {
      attempts++;

      try {
        console.log(`   [${new Date().toLocaleTimeString()}] Check #${attempts}...`);

        const response = await axios.get<TaskStatus>(
          `${this.baseUrl}/v1/task/${taskId}`,
          {
            headers: {
              'Authorization': `Bearer ${this.agentApiKey}`,
            },
            timeout: 30000, // 30 seconds for status checks
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

        // Check if we have any response data
        if (!data) {
          console.log(`   ⚠️ No response data, will retry...`);
          await new Promise(resolve => setTimeout(resolve, pollInterval));
          continue;
        }

        // Check both 'status' (official) and 'state' (alternative) fields per docs
        const status = data.status || data.state || 'unknown';
        console.log(`   Task Status: ${status}`);

        // Handle success states (matching working example: completed, success, finished)
        if (status === 'completed' || status === 'success' || status === 'finished') {
          console.log(`   ✅ Task completed successfully!`);

          // Extract result - can be in various formats per docs
          let resultText: string | null = null;

          if (data.result) {
            if (typeof data.result === 'string') {
              resultText = data.result;
            } else if (typeof data.result === 'object') {
              // Try different possible result field names
              resultText = data.result.answer ||
                          data.result.content ||
                          data.result.text ||
                          (typeof data.result === 'object' ? JSON.stringify(data.result) : null);
            }
          }

          if (resultText && resultText.trim().length > 0) {
            console.log(`   ✅ Result extracted (${resultText.length} chars)`);
            console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
            console.log(`FINAL OUTPUT:`);
            console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
            return resultText;
          } else {
            console.warn(`   ⚠️ Task completed but result is empty or missing`);
            console.warn(`   📄 Full response:`, JSON.stringify(data, null, 2));
            throw new Error('Task completed but no result found in response');
          }
        } else if (status === 'failed' || status === 'error') {
          // Task failed - extract error reason
          console.log(`   ❌ Task failed!`);
          console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
          console.log(`FAILURE DETAILS:`);
          console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
          console.log(JSON.stringify(data, null, 2));

          const failedReason = data.failedReason ||
                              data.error ||
                              (data.result && typeof data.result === 'object' ? data.result.answer : null) ||
                              (data.result && typeof data.result === 'string' ? data.result : null) ||
                              'Unknown error';
          console.error(`   ❌ Task failed: ${failedReason}`);
          throw new Error(`Task failed: ${failedReason}`);
        } else if (status === 'active' || status === 'running' || status === 'pending' || status === 'processing' || status === 'queued') {
          // Handle active/processing states (matching working example)
          console.log(`   Task still ${status}... waiting ${pollInterval/1000} seconds\n`);
          await new Promise(resolve => setTimeout(resolve, pollInterval));
        } else {
          // Unknown status - log and continue (matching working example)
          console.log(`   ⚠️ Unknown status: ${status}`);
          console.log(`   Full response:`, JSON.stringify(data, null, 2));
          console.log(`   Continuing to poll...\n`);
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

        // Log the error but continue polling (matching working example)
        console.error(`   ⚠️ Error checking status: ${error.message}`);
        console.log(`   Retrying in ${pollInterval/1000} seconds...\n`);

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
