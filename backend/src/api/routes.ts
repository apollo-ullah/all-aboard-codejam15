import express from 'express';
import { BrowserCashService } from '../services/BrowserCashService';
import { LLMService } from '../services/LLMService';
import { SlideGenerator } from '../services/SlideGenerator';
import { isValidUrl, normalizeUrl, validateStoryboard } from '../utils/validation';

const router = express.Router();

// POST /api/scrape - Scrape website and generate storyboard
router.post('/scrape', async (req, res) => {
  try {
    let { url } = req.body;
    
    // Validate URL
    if (!url || typeof url !== 'string') {
      return res.status(400).json({ error: 'URL is required and must be a string' });
    }
    
    // Normalize URL (add https:// if missing)
    url = normalizeUrl(url);
    
    if (!isValidUrl(url)) {
      return res.status(400).json({ error: 'Invalid URL format. Please provide a valid http:// or https:// URL' });
    }
    
    // 1. Scrape website using Browser.cash
    if (!process.env.AGENT_API_KEY) {
      return res.status(500).json({ error: 'Agent API key not configured' });
    }
    
    if (!process.env.BROWSER_CASH_API_KEY) {
      return res.status(500).json({ error: 'Browser.cash API key not configured' });
    }
    
    const browserCash = new BrowserCashService({
      agentApiKey: process.env.AGENT_API_KEY!,
      browserApiKey: process.env.BROWSER_CASH_API_KEY!,
      baseUrl: process.env.BROWSER_CASH_BASE_URL || 'https://api.browser.cash'
    });
    
    console.log('🌐 Scraping website:', url);
    const scrapedData = await browserCash.scrapeWebsite(url);
    
    // 2. Generate storyboard using LLM
    if (!process.env.OPENAI_KEY) {
      return res.status(500).json({ error: 'OpenAI API key not configured' });
    }
    
    const llmService = new LLMService({
      apiKey: process.env.OPENAI_KEY!
    });
    
    console.log('🤖 Generating storyboard...');
    const storyboard = await llmService.generateStoryboard(scrapedData);
    
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
    console.error('Error in /scrape:', error);
    res.status(500).json({ 
      error: 'Failed to scrape and analyze website',
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
      downloadUrl: result.downloadUrl,
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

