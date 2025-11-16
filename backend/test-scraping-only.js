#!/usr/bin/env node
/**
 * Simple test script to demonstrate Browser.cash scraping is working
 * This script ONLY tests scraping, not storyboard generation
 */

require('dotenv').config();

async function testScraping() {
  console.log('═══════════════════════════════════════════════════');
  console.log('🧪 Testing Browser.cash Scraping Pipeline');
  console.log('═══════════════════════════════════════════════════\n');

  // Dynamic import for ES modules
  const { BrowserCashService } = await import('./dist/services/BrowserCashService.js');

  const apiKey = process.env.AGENT_API_KEY || 'yl6ycfwomtu81045r2vn2gdyppkit98brg6qclo54o101jvtghnzr9b3nkgyy0va';

  console.log('📋 Configuration:');
  console.log(`   API Key: ${apiKey.substring(0, 10)}...${apiKey.substring(apiKey.length - 10)} (${apiKey.length} chars)`);
  console.log(`   Base URL: https://agent-api.browser.cash`);
  console.log();

  const service = new BrowserCashService({
    agentApiKey: apiKey,
    baseUrl: 'https://agent-api.browser.cash'
  });

  // Test with a few different URLs
  const testUrls = [
    'https://example.com',
  ];

  for (const url of testUrls) {
    console.log('─'.repeat(50));
    console.log(`🌐 Testing URL: ${url}`);
    console.log('─'.repeat(50));

    const startTime = Date.now();

    try {
      const result = await service.scrapeWebsite(url);
      const duration = Date.now() - startTime;

      console.log(`\n✅ SUCCESS! (${duration}ms)\n`);
      console.log('📄 Main Page Results:');
      console.log(`   Title: ${result.mainPage.title}`);
      console.log(`   Content Length: ${result.mainPage.content.length} characters`);
      console.log(`   Links Found: ${result.mainPage.links.length}`);
      console.log(`   Adjacent Pages: ${result.adjacentPages.length}`);
      console.log();
      console.log('📝 Content Preview (first 300 chars):');
      console.log('   ' + result.mainPage.content.substring(0, 300).replace(/\n/g, '\n   '));
      console.log();

    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`\n❌ FAILED! (${duration}ms)`);
      console.error(`   Error: ${error.message}`);
      console.error();
    }
  }

  console.log('═'.repeat(50));
  console.log('✅ Browser.cash Scraping Test Complete!');
  console.log('═'.repeat(50));
  console.log();
  console.log('💡 Next Steps:');
  console.log('   1. Add OPENAI_KEY to backend/.env for storyboard generation');
  console.log('   2. Add GAMMA_API_KEY to backend/.env for slide generation');
  console.log('   3. Start the backend: npm run dev');
  console.log('   4. Start the frontend: cd ../allaboard && npm run dev');
  console.log();
}

testScraping().catch(error => {
  console.error('\n💥 Unexpected error:', error);
  process.exit(1);
});
