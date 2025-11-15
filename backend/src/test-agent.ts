import axios from 'axios';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const AGENT_API_KEY = process.env.AGENT_API_KEY;
const BASE_URL = 'https://agent-api.browser.cash';

if (!AGENT_API_KEY) {
  console.error('❌ AGENT_API_KEY not found in .env file');
  process.exit(1);
}

// TypeScript now knows AGENT_API_KEY is defined
const API_KEY = AGENT_API_KEY;

async function testAgent() {
  console.log('🧪 Testing Browser.cash Agent API\n');
  console.log(`📡 Base URL: ${BASE_URL}`);
  console.log(`🔑 API Key: ${API_KEY.substring(0, 10)}...\n`);

  try {
    // Step 1: Create a task - using CEO's exact example
    console.log('📝 Step 1: Creating task...');
    console.log('   Prompt: "Recent canadian news" (CEO example)');
    console.log('   Agent: gemini');
    console.log('   Mode: text');
    console.log('   StepLimit: 10\n');

    const createResponse = await axios.post(
      `${BASE_URL}/v1/task/create`,
      {
        agent: 'gemini',
        prompt: 'Recent canadian news',
        mode: 'text',
        stepLimit: 10,
      },
      {
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Content-Type': 'application/json',
        },
        timeout: 30000,
      }
    );

    const taskId = createResponse.data.taskId;
    if (!taskId) {
      console.error('❌ No taskId in response:', createResponse.data);
      return;
    }

    console.log(`✅ Task created successfully!`);
    console.log(`   Task ID: ${taskId}\n`);

    // Step 2: Poll for task status
    console.log('📊 Step 2: Polling for task completion...\n');
    
    // Wait a moment before first poll to let task start
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    let completed = false;
    let attempts = 0;
    const maxAttempts = 60;
    const pollInterval = 3000; // 3 seconds

    while (!completed && attempts < maxAttempts) {
      attempts++;
      
      try {
        const statusResponse = await axios.get(
          `${BASE_URL}/v1/task/${taskId}`,
          {
            headers: {
              'Authorization': `Bearer ${API_KEY}`,
            },
            timeout: 10000,
          }
        );

        const data = statusResponse.data;
        
        // Log full response on first attempt
        if (attempts === 1) {
          console.log('🔍 First response structure:');
          console.log(JSON.stringify(data, null, 2));
          console.log('\n');
        }

        // Status field is called "state" in Browser.cash API
        const state = data.state;
        const result = data.result;

        console.log(`   Attempt ${attempts}/${maxAttempts}: State = "${state}"`);
        
        // Show additional info
        if (data.startedAt) {
          const duration = data.stoppedAt ? (data.stoppedAt - data.startedAt) : (Date.now() - data.startedAt);
          console.log(`   Duration: ${Math.round(duration / 1000)}s`);
        }
        if (data.attemptsMade !== undefined) {
          console.log(`   Attempts made by agent: ${data.attemptsMade}`);
        }
        if (result) {
          console.log(`   Result available: ${typeof result === 'string' ? result.substring(0, 100) + '...' : 'object'}`);
        }

        // Check for completed status
        if (state === 'completed' || state === 'done' || state === 'success') {
          console.log('\n✅ Task completed!\n');
          console.log('📄 Full response:');
          console.log(JSON.stringify(data, null, 2));
          if (data.result) {
            console.log('\n📝 Result:');
            console.log(typeof data.result === 'string' ? data.result : JSON.stringify(data.result, null, 2));
          }
          completed = true;
          break;
        }

        // Check for failed status
        if (state === 'failed' || state === 'error' || state === 'failure') {
          console.error('\n❌ Task failed!');
          console.log('Failed reason:', data.failedReason || data.error || data.message || 'Unknown error');
          console.log('Full response:', JSON.stringify(data, null, 2));
          break;
        }
        
        // Check for active/running states
        if (state === 'active' || state === 'queued' || state === 'running' || state === 'pending') {
          console.log(`   ⏳ Task is ${state}, waiting...`);
          
          // If we have a result even though state is active, it might be done
          if (result && attempts > 10) {
            console.log('\n✅ Task appears complete (has result data, state still active)\n');
            console.log('📄 Full response:');
            console.log(JSON.stringify(data, null, 2));
            if (result) {
              console.log('\n📝 Result:');
              console.log(typeof result === 'string' ? result : JSON.stringify(result, null, 2));
            }
            completed = true;
            break;
          }
        }

        // Wait before next poll
        if (attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, pollInterval));
        }
      } catch (error: any) {
        console.error(`\n❌ Error polling task: ${error.message}`);
        if (error.response) {
          console.error('Response status:', error.response.status);
          console.error('Response data:', error.response.data);
        }
        break;
      }
    }

    if (!completed) {
      console.error(`\n⏱️  Task timed out after ${attempts} attempts`);
    }

  } catch (error: any) {
    console.error('\n❌ Error creating task:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

async function testWebScraping() {
  console.log('\n\n🧪 Testing Browser.cash Agent API for Web Scraping\n');
  console.log(`📡 Base URL: ${BASE_URL}`);
  console.log(`🔑 API Key: ${API_KEY.substring(0, 10)}...\n`);

  try {
    // Test with a web scraping prompt
    console.log('📝 Step 1: Creating web scraping task...');
    console.log('   Prompt: "Scrape the website https://cluely.com and extract all the main content, features, and key information"');
    console.log('   Agent: gemini');
    console.log('   Mode: text');
    console.log('   StepLimit: 20\n');

    const createResponse = await axios.post(
      `${BASE_URL}/v1/task/create`,
      {
        agent: 'gemini',
        prompt: 'Scrape the website https://cluely.com and extract all the main content, features, and key information. Provide a comprehensive summary of the website.',
        mode: 'text',
        stepLimit: 20,
      },
      {
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Content-Type': 'application/json',
        },
        timeout: 30000,
      }
    );

    const taskId = createResponse.data.taskId;
    if (!taskId) {
      console.error('❌ No taskId in response:', createResponse.data);
      return;
    }

    console.log(`✅ Task created successfully!`);
    console.log(`   Task ID: ${taskId}\n`);

    // Step 2: Poll for task status
    console.log('📊 Step 2: Polling for task completion...\n');
    
    // Wait a moment before first poll to let task start
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    let completed = false;
    let attempts = 0;
    const maxAttempts = 60;
    const pollInterval = 3000; // 3 seconds

    while (!completed && attempts < maxAttempts) {
      attempts++;
      
      try {
        const statusResponse = await axios.get(
          `${BASE_URL}/v1/task/${taskId}`,
          {
            headers: {
              'Authorization': `Bearer ${API_KEY}`,
            },
            timeout: 10000,
          }
        );

        const data = statusResponse.data;
        const state = data.state;
        const result = data.result;

        console.log(`   Attempt ${attempts}/${maxAttempts}: State = "${state}"`);
        
        if (data.startedAt) {
          const duration = data.stoppedAt ? (data.stoppedAt - data.startedAt) : (Date.now() - data.startedAt);
          console.log(`   Duration: ${Math.round(duration / 1000)}s`);
        }
        if (data.attemptsMade !== undefined) {
          console.log(`   Attempts made by agent: ${data.attemptsMade}`);
        }
        if (result) {
          const resultPreview = typeof result === 'string' 
            ? result.substring(0, 150) + '...' 
            : (result.answer ? result.answer.substring(0, 150) + '...' : 'object');
          console.log(`   Result available: ${resultPreview}`);
        }

        if (state === 'completed' || state === 'done' || state === 'success') {
          console.log('\n✅ Web scraping task completed!\n');
          if (data.result) {
            console.log('📝 Scraped Content:');
            const answer = typeof data.result === 'string' ? data.result : data.result.answer;
            console.log(answer || JSON.stringify(data.result, null, 2));
          }
          completed = true;
          break;
        }

        if (state === 'failed' || state === 'error' || state === 'failure') {
          console.error('\n❌ Web scraping task failed!');
          console.log('Failed reason:', data.failedReason || data.error || data.message || 'Unknown error');
          break;
        }
        
        if (state === 'active' || state === 'queued' || state === 'running' || state === 'pending') {
          console.log(`   ⏳ Task is ${state}, waiting...`);
        }

        // Wait before next poll
        if (attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, pollInterval));
        }
      } catch (error: any) {
        console.error(`\n❌ Error polling task: ${error.message}`);
        break;
      }
    }

    if (!completed) {
      console.error(`\n⏱️  Task timed out after ${attempts} attempts`);
    }

  } catch (error: any) {
    console.error('\n❌ Error creating web scraping task:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

// Run both tests
async function runAllTests() {
  await testAgent();
  await testWebScraping();
}

runAllTests()
  .then(() => {
    console.log('\n✨ All tests completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Tests failed:', error);
    process.exit(1);
  });

