import express from 'express';
import axios from 'axios';
import { BrowserCashService } from '../services/BrowserCashService';
import { LLMService } from '../services/LLMService';
import { SlideGenerator } from '../services/SlideGenerator';
import { StoryboardAssistantService } from '../services/StoryboardAssistantService';
import { isValidUrl, normalizeUrl, validateStoryboard } from '../utils/validation';

const router = express.Router();

// GET /api/test-scrape - Quick test of scraping functionality
router.get('/test-scrape', async (req, res) => {
  try {
    if (!process.env.AGENT_API_KEY) {
      return res.status(500).json({ error: 'AGENT_API_KEY not configured' });
    }
    
    const browserCash = new BrowserCashService({
      agentApiKey: process.env.AGENT_API_KEY,
      baseUrl: 'https://agent-api.browser.cash'
    });
    
    console.log('🧪 Testing scrape with simple URL: https://example.com');
    const startTime = Date.now();
    
    try {
      const result = await browserCash.scrapeWebsite('https://example.com');
      const duration = Date.now() - startTime;
      
      res.json({
        success: true,
        duration: `${duration}ms`,
        mainPage: {
          title: result.mainPage.title,
          contentLength: result.mainPage.content.length,
          linksFound: result.mainPage.links.length
        },
        adjacentPages: result.adjacentPages.length
      });
    } catch (error: any) {
      const duration = Date.now() - startTime;
      res.status(500).json({
        success: false,
        duration: `${duration}ms`,
        error: error.message,
        stack: error.stack
      });
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/test-browser-cash - Test Browser.cash API connection
router.get('/test-browser-cash', async (req, res) => {
  try {
    if (!process.env.AGENT_API_KEY || !process.env.BROWSER_CASH_API_KEY) {
      return res.status(400).json({ 
        error: 'API keys not configured',
        missing: {
          agentApiKey: !process.env.AGENT_API_KEY,
          browserApiKey: !process.env.BROWSER_CASH_API_KEY
        }
      });
    }

    const baseUrl = process.env.BROWSER_CASH_BASE_URL || 'https://api.browser.cash';
    const testEndpoints = [
      `${baseUrl}/agent/run`,
      `${baseUrl}/api/agent/run`,
      `${baseUrl}/v1/agent/run`,
      `${baseUrl}/api/v1/agent/run`,
    ];

    const results = [];
    
    for (const endpoint of testEndpoints) {
      try {
        const response = await axios.get(endpoint, {
          headers: {
            'Authorization': `Bearer ${process.env.AGENT_API_KEY}`,
          },
          timeout: 5000,
          validateStatus: () => true, // Don't throw on any status
        });
        
        results.push({
          endpoint,
          status: response.status,
          statusText: response.statusText,
          success: response.status < 400,
        });
      } catch (error: any) {
        results.push({
          endpoint,
          error: error.message,
          code: error.code,
          success: false,
        });
      }
    }

    res.json({
      baseUrl,
      testResults: results,
      recommendation: results.find(r => r.success) 
        ? `✅ Working endpoint found!`
        : `❌ No working endpoints found. Check Browser.cash documentation for the correct API base URL.`
    });
  } catch (error: any) {
    res.status(500).json({ 
      error: 'Test failed',
      message: error.message 
    });
  }
});

// POST /api/scrape - Scrape website and generate storyboard
router.post('/scrape', async (req, res) => {
  const requestId = Date.now().toString(36);
  const startTime = Date.now();
  
  // Set a longer timeout for scraping requests (5 minutes)
  req.setTimeout(300000); // 5 minutes
  
  console.log(`\n📥 [${requestId}] POST /api/scrape - Request received`);
  console.log(`   Headers:`, JSON.stringify(req.headers, null, 2));
  console.log(`   Body:`, JSON.stringify(req.body, null, 2));
  console.log(`   IP:`, req.ip || req.connection.remoteAddress);
  
  // Send immediate acknowledgment to prevent timeout
  res.setTimeout(300000); // 5 minutes
  
  try {
    let { url } = req.body;
    
    console.log(`   Original URL:`, url);
    
    // Validate URL
    if (!url || typeof url !== 'string') {
      console.error(`   ❌ [${requestId}] Invalid request: URL missing or not a string`);
      return res.status(400).json({ error: 'URL is required and must be a string' });
    }
    
    // Normalize URL (add https:// if missing)
    url = normalizeUrl(url);
    console.log(`   Normalized URL:`, url);
    
    if (!isValidUrl(url)) {
      console.error(`   ❌ [${requestId}] Invalid URL format:`, url);
      return res.status(400).json({ error: 'Invalid URL format. Please provide a valid http:// or https:// URL' });
    }
    
    // 1. Scrape website using Browser.cash Agent API
    if (!process.env.AGENT_API_KEY) {
      console.error(`   ❌ [${requestId}] AGENT_API_KEY not configured`);
      return res.status(500).json({ error: 'AGENT_API_KEY not configured' });
    }
    
    console.log(`   ✅ [${requestId}] API key configured (length: ${process.env.AGENT_API_KEY.length})`);
    
    const browserCash = new BrowserCashService({
      agentApiKey: process.env.AGENT_API_KEY,
      // Base URL is hardcoded to agent-api.browser.cash (not dashboard URL)
      baseUrl: 'https://agent-api.browser.cash'
    });
    
    console.log(`🌐 [${requestId}] Starting scrape for: ${url}`);
    const scrapeStartTime = Date.now();
    
    let scrapedData;
    try {
      scrapedData = await browserCash.scrapeWebsite(url);
    } catch (scrapeError: any) {
      const scrapeDuration = Date.now() - scrapeStartTime;
      console.error(`❌ [${requestId}] Scraping failed after ${scrapeDuration}ms:`, scrapeError.message);
      throw scrapeError; // Re-throw to be caught by outer catch block
    }
    
    const scrapeDuration = Date.now() - scrapeStartTime;
    console.log(`✅ [${requestId}] Scraping completed in ${scrapeDuration}ms`);
    console.log(`   Main page title: ${scrapedData.mainPage.title}`);
    console.log(`   Main page content length: ${scrapedData.mainPage.content.length} chars`);
    console.log(`   Adjacent pages scraped: ${scrapedData.adjacentPages.length}`);
    
    // Validate that we actually scraped content
    if (!scrapedData.mainPage.content || scrapedData.mainPage.content.trim().length === 0) {
      console.error(`   ❌ [${requestId}] Scraped content is empty`);
      return res.status(500).json({ 
        error: 'Failed to scrape website content',
        message: 'The website could not be scraped. The scraping task completed but returned no content. Please try again or check if the website is accessible.',
        requestId: requestId
      });
    }
    
    // Check if we got meaningful content (at least 50 characters)
    if (scrapedData.mainPage.content.trim().length < 50) {
      console.warn(`   ⚠️ [${requestId}] Warning: Scraped content is very short: ${scrapedData.mainPage.content.length} characters`);
    }
    
    // 2. Generate storyboard using LLM
    if (!process.env.OPENAI_KEY) {
      console.error(`   ❌ [${requestId}] OPENAI_KEY not configured`);
      return res.status(500).json({ error: 'OpenAI API key not configured' });
    }
    
    const llmService = new LLMService({
      apiKey: process.env.OPENAI_KEY!
    });
    
    console.log(`🤖 [${requestId}] Generating storyboard...`);
    console.log(`   📄 Scraped content length: ${scrapedData.mainPage.content.length} characters`);
    const llmStartTime = Date.now();
    
    const storyboard = await llmService.generateStoryboard(scrapedData);
    
    const llmDuration = Date.now() - llmStartTime;
    console.log(`✅ [${requestId}] Storyboard generated in ${llmDuration}ms`);
    console.log(`   Storyboard title: ${storyboard.title}`);
    console.log(`   Nodes count: ${storyboard.nodes.length}`);
    
    const totalDuration = Date.now() - startTime;
    console.log(`✅ [${requestId}] Request completed successfully in ${totalDuration}ms`);
    
    // Return storyboard for user editing
    res.json({
      success: true,
      storyboard,
      scrapedData: {
        mainPageTitle: scrapedData.mainPage.title,
        pagesScraped: scrapedData.adjacentPages.length + 1
      }
    });
    
  } catch (error: any) {
    const totalDuration = Date.now() - startTime;
    console.error(`\n❌ [${requestId}] Error in /scrape (duration: ${totalDuration}ms):`);
    console.error(`   Error name:`, error.name);
    console.error(`   Error message:`, error.message);
    console.error(`   Error stack:`, error.stack);
    if (error.response) {
      console.error(`   Error response status:`, error.response.status);
      console.error(`   Error response data:`, JSON.stringify(error.response.data, null, 2));
    }
    if (error.config) {
      console.error(`   Request config:`, {
        method: error.config.method,
        url: error.config.url,
        baseURL: error.config.baseURL,
        timeout: error.config.timeout,
      });
    }
    
    // Provide more helpful error messages
    let errorMessage = error.message || 'Unknown error';
    let userFriendlyMessage = 'Failed to scrape and analyze website';
    
    if (error.message?.includes('Task failed') || error.message?.includes('Task not found')) {
      userFriendlyMessage = 'Failed to scrape website. The site may be inaccessible or the scraping task failed.';
      errorMessage = error.message;
    } else if (error.message?.includes('timeout') || error.message?.includes('Task timed out')) {
      userFriendlyMessage = 'Scraping took too long. The website may be slow or complex.';
      errorMessage = error.message;
    } else if (error.message?.includes('AGENT_API_KEY')) {
      userFriendlyMessage = 'Browser.cash API key not configured.';
      errorMessage = error.message;
    } else if (error.message?.includes('Network Error') || error.message?.includes('ECONNREFUSED')) {
      userFriendlyMessage = 'Cannot connect to Browser.cash API. Check your network connection and API configuration.';
      errorMessage = error.message;
    } else if (error.message?.includes('OpenAI') || error.message?.includes('storyboard')) {
      userFriendlyMessage = 'Failed to generate storyboard. The scraping succeeded but storyboard generation failed.';
      errorMessage = error.message;
    }
    
    // Ensure response hasn't been sent yet
    if (!res.headersSent) {
      res.status(500).json({ 
        error: userFriendlyMessage,
        message: errorMessage,
        details: 'Using Browser.cash Agent API for web scraping',
        requestId: requestId,
        timestamp: new Date().toISOString()
      });
    } else {
      console.error(`   ⚠️ [${requestId}] Response already sent, cannot send error response`);
    }
  }
});

// POST /api/improve-storyboard - Chat with AI assistant about storyboard
router.post('/improve-storyboard', async (req, res) => {
  try {
    const { storyboard, style, message } = req.body;
    
    if (!storyboard || !style || !message) {
      return res.status(400).json({ error: 'Missing storyboard, style, or message' });
    }
    
    if (!['YC', 'Finance'].includes(style)) {
      return res.status(400).json({ error: 'Style must be "YC" or "Finance"' });
    }
    
    if (!process.env.OPENAI_KEY) {
      return res.status(500).json({ error: 'OpenAI API key not configured' });
    }
    
    const assistant = new StoryboardAssistantService({
      apiKey: process.env.OPENAI_KEY,
    });
    
    console.log(`💬 AI Assistant request: ${message.substring(0, 50)}...`);
    const result = await assistant.chatAboutStoryboard(storyboard, style, message);
    
    res.json({
      success: true,
      response: result.response,
      updatedStoryboard: result.updatedStoryboard,
    });
    
  } catch (error: any) {
    console.error('Error in /improve-storyboard:', error);
    res.status(500).json({ 
      error: 'Failed to get AI response',
      message: error.message 
    });
  }
});

// POST /api/generate-slides - Generate slides from edited storyboard
router.post('/generate-slides', async (req, res) => {
  try {
    const { storyboard, style } = req.body; // style: "YC" or "Finance"
    
    if (!storyboard || !style) {
      return res.status(400).json({ error: 'Missing storyboard or style' });
    }
    
    if (!['YC', 'Finance'].includes(style)) {
      return res.status(400).json({ error: 'Style must be "YC" or "Finance"' });
    }
    
    // Validate storyboard structure
    const validation = validateStoryboard(storyboard);
    if (!validation.valid) {
      return res.status(400).json({ error: validation.error });
    }
    
    if (!process.env.GAMMA_API_KEY) {
      return res.status(500).json({ error: 'GAMMA API key not configured' });
    }
    
    // Generate slides using GAMMA API
    const slideGenerator = new SlideGenerator({
      apiKey: process.env.GAMMA_API_KEY!
    });
    
    console.log(`📊 Generating ${style} style slides...`);
    const result = await slideGenerator.generate(storyboard, style as 'YC' | 'Finance');

    res.json({
      success: true,
      presentationUrl: result.presentationUrl,
      embedUrl: result.embedUrl,
      downloadUrl: result.downloadUrl,
      pdfUrl: result.pdfUrl,
      slideCount: result.slideCount
    });
    
  } catch (error: any) {
    console.error('Error in /generate-slides:', error);
    res.status(500).json({ 
      error: 'Failed to generate slides',
      message: error.message 
    });
  }
});

export default router;

