#!/usr/bin/env node
/**
 * CEO's example script for Browser.cash API
 * Modified to test with our use case
 */

const axios = require('axios');
require('dotenv').config();

const AGENT_API_KEY = process.env.AGENT_API_KEY || '';
const BASE_URL = 'https://agent-api.browser.cash/v1';

// Helper function to wait
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function testAgentAPI() {
  console.log('🚀 Starting Agent API Test (CEO\'s Example Format)\n');
  console.log('API Key:', AGENT_API_KEY ? `✓ Found (${AGENT_API_KEY.length} chars)` : '✗ Missing');
  console.log('Base URL:', BASE_URL);
  console.log('='.repeat(50));
  console.log('');

  if (!AGENT_API_KEY) {
    console.error('❌ AGENT_API_KEY not found in .env file');
    console.error('Please add it to backend/.env file:');
    console.error('AGENT_API_KEY=your_key_here');
    process.exit(1);
  }

  try {
    // Step 1: Create task (using CEO's format but with simple web scraping task)
    console.log('📝 Creating task...');
    const createResponse = await axios.post(
      `${BASE_URL}/task/create`,
      {
        agent: 'gemini',  // CEO uses 'gemini'
        prompt: 'Go to https://www.ycombinator.com and extract the main heading, description, and list the top 5 links you find on the page. Be concise.',
        mode: 'text',  // CEO uses 'text' mode
        stepLimit: 25  // CEO includes stepLimit
      },
      {
        headers: { 
          'Authorization': `Bearer ${AGENT_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('✅ Task created successfully!');
    console.log('Response:', JSON.stringify(createResponse.data, null, 2));

    const taskId = createResponse.data.taskId;
    console.log(`\n🆔 Task ID: ${taskId}\n`);

    // Step 2: Wait initial delay before first check
    console.log('⏳ Waiting 5 seconds before first status check...\n');
    await sleep(5000);

    // Step 3: Poll for status (with 2 minute timeout for our use case)
    console.log('🔄 Polling task status every 5 seconds (max 2 minutes)...\n');

    let attempts = 0;
    const maxAttempts = 24; // 2 minutes
    const pollInterval = 5000; // 5 seconds

    while (attempts < maxAttempts) {
      attempts++;

      try {
        console.log(`[${new Date().toLocaleTimeString()}] Check #${attempts}/${maxAttempts}...`);

        const statusResponse = await axios.get(
          `${BASE_URL}/task/${taskId}`,
          {
            headers: { 
              'Authorization': `Bearer ${AGENT_API_KEY}`
            }
          }
        );

        const status = statusResponse.data;

        // Check if we have any response data
        if (!status) {
          console.log('⚠️ No response data, will retry...\n');
          await sleep(pollInterval);
          continue;
        }

        // Get the status - it might be in different fields
        const taskStatus = status.status || status.state || 'unknown';
        console.log(`   Status: ${taskStatus}`);

        if (taskStatus === 'completed' || taskStatus === 'success' || taskStatus === 'finished') {
          console.log('\n✅ Task completed successfully!');
          console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
          console.log('FINAL OUTPUT:');
          console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
          console.log(JSON.stringify(status, null, 2));
          console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
          console.log('✅ Browser.cash API is WORKING!');
          return true;
        } else if (taskStatus === 'failed' || taskStatus === 'error') {
          console.log('\n❌ Task failed!');
          console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
          console.log('FAILURE DETAILS:');
          console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
          console.log(JSON.stringify(status, null, 2));
          console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
          return false;
        } else if (taskStatus === 'active' || taskStatus === 'running' || taskStatus === 'pending' || taskStatus === 'processing' || taskStatus === 'queued') {
          console.log(`   → Task still ${taskStatus}... waiting 5 seconds\n`);
          await sleep(pollInterval);
        } else {
          console.log(`   ⚠️ Unknown status: ${taskStatus}`);
          console.log('   Continuing to poll...\n');
          await sleep(pollInterval);
        }
      } catch (pollError) {
        console.error(`   ⚠️ Error checking status: ${pollError.message}`);
        console.log('   Retrying in 5 seconds...\n');
        await sleep(pollInterval);
      }
    }

    // Timeout
    console.log('\n⏱️  TIMEOUT: Task did not complete within 2 minutes');
    console.log('The agent may still be processing. Task ID:', taskId);
    return false;

  } catch (error) {
    console.error('\n❌ Error occurred:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', JSON.stringify(error.response.data, null, 2));
      console.error('Headers:', error.response.headers);
      
      if (error.response.status === 401 || error.response.status === 403) {
        console.error('\n⚠️  Authentication failed! Please check:');
        console.error('   1. AGENT_API_KEY is correct in your .env file');
        console.error('   2. The API key is valid and not expired');
      }
    } else if (error.request) {
      console.error('No response received:', error.message);
    } else {
      console.error('Error:', error.message);
    }
    return false;
  }
}

// Run the test
testAgentAPI().then(success => {
  console.log('\n' + '='.repeat(50));
  console.log(success ? '✅ TEST PASSED' : '❌ TEST FAILED');
  console.log('='.repeat(50));
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('Unexpected error:', error);
  process.exit(1);
});

