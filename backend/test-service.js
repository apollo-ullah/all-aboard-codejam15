#!/usr/bin/env node
/**
 * Quick test of BrowserCashService
 */

require('dotenv').config();

async function testService() {
  console.log('🧪 Testing BrowserCashService...\n');

  // Dynamic import for ES modules
  const { BrowserCashService } = await import('./dist/services/BrowserCashService.js');

  const service = new BrowserCashService({
    agentApiKey: process.env.AGENT_API_KEY || 'yl6ycfwomtu81045r2vn2gdyppkit98brg6qclo54o101jvtghnzr9b3nkgyy0va',
    baseUrl: 'https://agent-api.browser.cash'
  });

  console.log('Testing with simple URL: https://example.com\n');

  try {
    const result = await service.scrapeWebsite('https://example.com');
    console.log('\n✅ SUCCESS!');
    console.log('Main page title:', result.mainPage.title);
    console.log('Content length:', result.mainPage.content.length);
    console.log('Content preview:', result.mainPage.content.substring(0, 200));
  } catch (error) {
    console.error('\n❌ FAILED:', error.message);
    console.error('Stack:', error.stack);
  }
}

testService().catch(error => {
  console.error('Unexpected error:', error);
  process.exit(1);
});
