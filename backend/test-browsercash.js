#!/usr/bin/env node

/**
 * Standalone test script for Browser.cash API
 * Tests if the agent API is working properly
 */

const axios = require('axios');
require('dotenv').config();

const AGENT_API_KEY = process.env.AGENT_API_KEY;
const BASE_URL = 'https://agent-api.browser.cash';

// Simple test URL - not too complex
const TEST_URL = 'https://www.ycombinator.com';

console.log('🧪 Browser.cash API Test');
console.log('='.repeat(50));
console.log('API Key:', AGENT_API_KEY ? `✓ Found (${AGENT_API_KEY.length} chars)` : '✗ Missing');
console.log('Base URL:', BASE_URL);
console.log('Test URL:', TEST_URL);
console.log('='.repeat(50));
console.log('');

if (!AGENT_API_KEY) {
  console.error('❌ AGENT_API_KEY not found in .env file');
  process.exit(1);
}

async function testBrowserCash() {
  try {
    // Step 1: Create a task
    console.log('📤 Step 1: Creating task...');
    const createResponse = await axios.post(
      `${BASE_URL}/v1/task/create`,
      {
        prompt: `Visit ${TEST_URL} and extract the main heading and description. Keep it very brief.`,
        agent: 'standard',
        mode: 'full',
      },
      {
        headers: {
          'Authorization': `Bearer ${AGENT_API_KEY}`,
          'Content-Type': 'application/json',
        },
        timeout: 30000,
      }
    );

    const taskId = createResponse.data.taskId;
    console.log(`✅ Task created: ${taskId}`);
    console.log('   Response:', JSON.stringify(createResponse.data, null, 2));
    console.log('');

    // Step 2: Poll for completion
    console.log('⏳ Step 2: Polling for completion (max 2 minutes)...');
    console.log('');

    let attempts = 0;
    const maxAttempts = 24; // 2 minutes
    const pollInterval = 5000; // 5 seconds

    // Wait before first poll
    await new Promise(resolve => setTimeout(resolve, 5000));

    while (attempts < maxAttempts) {
      attempts++;
      const elapsed = Math.round((attempts * pollInterval) / 1000);

      try {
        const statusResponse = await axios.get(
          `${BASE_URL}/v1/task/${taskId}`,
          {
            headers: {
              'Authorization': `Bearer ${AGENT_API_KEY}`,
            },
            timeout: 30000,
          }
        );

        const data = statusResponse.data;
        const status = data.status || data.state || 'unknown';
        
        console.log(`[${elapsed}s] Attempt ${attempts}/${maxAttempts} - Status: ${status}`);

        // Check for completion
        if (status === 'completed' || status === 'success' || status === 'finished') {
          console.log('');
          console.log('✅ Task completed successfully!');
          console.log('='.repeat(50));
          console.log('Result:');
          console.log('='.repeat(50));
          
          if (data.result) {
            if (typeof data.result === 'string') {
              console.log(data.result);
            } else {
              console.log(JSON.stringify(data.result, null, 2));
            }
          } else {
            console.log('(No result returned)');
          }
          
          console.log('='.repeat(50));
          console.log('');
          console.log('✅ Browser.cash API is working correctly!');
          return true;
        }

        // Check for failure
        if (status === 'failed' || status === 'error') {
          console.log('');
          console.log('❌ Task failed!');
          console.log('Error:', data.error || data.failedReason || 'Unknown error');
          console.log('Full response:', JSON.stringify(data, null, 2));
          return false;
        }

        // Still in progress
        if (status === 'active' || status === 'running' || status === 'queued' || status === 'pending') {
          console.log(`   → Still ${status}...`);
        }

      } catch (pollError) {
        console.error(`   ✗ Poll error:`, pollError.message);
      }

      // Wait before next poll
      await new Promise(resolve => setTimeout(resolve, pollInterval));
    }

    // Timeout
    console.log('');
    console.log('⏱️  Timeout: Task did not complete within 2 minutes');
    console.log('');
    console.log('⚠️  This could mean:');
    console.log('   1. The URL is too complex for the agent to process quickly');
    console.log('   2. The agent service is slow or overloaded');
    console.log('   3. There might be an issue with the API');
    console.log('');
    console.log('Try testing with an even simpler URL or check the Browser.cash service status.');
    return false;

  } catch (error) {
    console.error('');
    console.error('❌ Test failed with error:');
    console.error('='.repeat(50));
    
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', JSON.stringify(error.response.data, null, 2));
      console.error('Headers:', error.response.headers);
      
      if (error.response.status === 401 || error.response.status === 403) {
        console.error('');
        console.error('⚠️  Authentication failed! Please check:');
        console.error('   1. AGENT_API_KEY is correct in your .env file');
        console.error('   2. The API key is valid and not expired');
        console.error('   3. You have access to the Browser.cash API');
      }
    } else if (error.request) {
      console.error('No response received from server');
      console.error('Request:', error.request);
      console.error('');
      console.error('⚠️  Network error! The API might be down or unreachable.');
    } else {
      console.error('Error:', error.message);
      console.error('Stack:', error.stack);
    }
    
    return false;
  }
}

// Run the test
testBrowserCash().then(success => {
  console.log('');
  console.log('='.repeat(50));
  console.log(success ? '✅ TEST PASSED' : '❌ TEST FAILED');
  console.log('='.repeat(50));
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('Unexpected error:', error);
  process.exit(1);
});

