import { chromium, Browser, BrowserContext, Page } from 'playwright';
import OpenAI from 'openai';
import { Storyboard, StoryNode } from '../types/index';
import fs from 'fs';
import path from 'path';

/**
 * DemoVideoService - AI-powered product demo video generator
 *
 * Features:
 * - Autonomous website navigation using GPT-4 Vision
 * - Smooth cursor movements with custom overlay
 * - Voice-over generation from storyboard script
 * - Screen recording with Playwright
 * - Natural presenter-like interactions
 */

export interface DemoVideoConfig {
  openaiApiKey: string;
  videosDir?: string;
  logsDir?: string;
}

export interface DemoVideoOptions {
  url: string;
  storyboard: Storyboard;
  duration?: number; // Max duration in seconds (default: 120)
  voiceModel?: 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer';
  videoWidth?: number;
  videoHeight?: number;
}

export interface NavigationDecision {
  action_type: 'search' | 'click_link' | 'click_button' | 'scroll' | 'wait' | 'navigate';
  target?: string;
  reason: string;
  narration: string;
}

export interface DemoVideoResult {
  videoPath: string;
  audioPath?: string;
  scriptPath: string;
  duration: number;
  actionsCount: number;
  timestamp: string;
}

interface CursorPosition {
  x: number;
  y: number;
}

export class DemoVideoService {
  private openai: OpenAI;
  private videosDir: string;
  private logsDir: string;

  private browser: Browser | null = null;
  private context: BrowserContext | null = null;
  private page: Page | null = null;

  private currentCursor: CursorPosition = { x: 100, y: 100 };
  private startTime: number = 0;
  private actionsTaken: string[] = [];
  private narrationLog: Array<{
    timestamp: number;
    action: string;
    narration: string;
  }> = [];

  constructor(config: DemoVideoConfig) {
    this.openai = new OpenAI({ apiKey: config.openaiApiKey });
    this.videosDir = config.videosDir || 'demo_videos';
    this.logsDir = config.logsDir || 'demo_logs';

    // Create directories if they don't exist
    if (!fs.existsSync(this.videosDir)) {
      fs.mkdirSync(this.videosDir, { recursive: true });
    }
    if (!fs.existsSync(this.logsDir)) {
      fs.mkdirSync(this.logsDir, { recursive: true });
    }
  }

  /**
   * Generate a product demo video from a storyboard
   */
  async generateDemoVideo(options: DemoVideoOptions): Promise<DemoVideoResult> {
    console.log(`\n🎬 Starting demo video generation for: ${options.url}`);
    console.log(`   Storyboard: ${options.storyboard.title}`);
    console.log(`   Nodes: ${options.storyboard.nodes.length}`);

    try {
      // 1. Start browser with video recording
      await this.startBrowser(options.videoWidth || 1920, options.videoHeight || 1080);

      // 2. Generate script from storyboard
      const script = this.generateScriptFromStoryboard(options.storyboard);

      // 3. Navigate to website
      await this.navigateToWebsite(options.url);

      // 4. Run autonomous demo
      await this.runAutonomousDemo(options.url, script, options.duration || 120);

      // 5. Generate voice-over audio
      const audioPath = await this.generateVoiceOver(script, options.voiceModel || 'alloy');

      // 6. Save results
      const result = await this.saveResults(options.url, options.storyboard.title, audioPath);

      console.log(`✅ Demo video generated successfully!`);
      console.log(`   Video: ${result.videoPath}`);
      console.log(`   Audio: ${result.audioPath}`);
      console.log(`   Duration: ${result.duration.toFixed(1)}s`);

      return result;

    } catch (error: any) {
      console.error(`❌ Demo video generation failed:`, error.message);
      throw error;
    } finally {
      await this.cleanup();
    }
  }

  /**
   * Start browser with video recording enabled
   */
  private async startBrowser(width: number, height: number): Promise<void> {
    console.log(`🚀 Starting browser (${width}x${height})...`);

    this.browser = await chromium.launch({
      headless: false, // Set to true for production
      args: [
        '--start-maximized',
        '--disable-blink-features=AutomationControlled',
        '--disable-infobars',
      ]
    });

    this.context = await this.browser.newContext({
      recordVideo: {
        dir: this.videosDir,
        size: { width, height }
      },
      viewport: { width, height },
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    });

    // Add stealth
    await this.context.addInitScript(() => {
      Object.defineProperty(navigator, 'webdriver', {
        get: () => undefined
      });
    });

    this.page = await this.context.newPage();
    this.page.setDefaultTimeout(30000);

    console.log(`   ✓ Browser started`);
  }

  /**
   * Navigate to website and inject cursor overlay
   */
  private async navigateToWebsite(url: string): Promise<void> {
    if (!this.page) throw new Error('Browser not initialized');

    console.log(`📍 Navigating to ${url}...`);

    try {
      await this.page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    } catch {
      await this.page.goto(url, { timeout: 30000 });
    }

    await this.page.waitForTimeout(2000);

    // Inject custom cursor overlay
    await this.injectCursorOverlay();

    // Initialize cursor position
    await this.moveCursorTo(400, 300, 20);
    await this.idleCursorMovement(1000);

    console.log(`   ✓ Page loaded and cursor initialized`);
  }

  /**
   * Inject custom cursor overlay for better visibility
   */
  private async injectCursorOverlay(): Promise<void> {
    if (!this.page) return;

    const cursorScript = `
      (() => {
        if (window.customCursor) {
          window.customCursor.remove();
        }

        const cursor = document.createElement('div');
        cursor.id = 'custom-cursor';
        cursor.style.cssText = \`
          position: fixed;
          width: 28px;
          height: 28px;
          background: radial-gradient(circle, rgba(255,50,50,0.95) 0%, rgba(255,50,50,0.6) 40%, rgba(255,100,100,0.3) 70%, transparent 100%);
          border: 3px solid rgba(255,255,255,0.95);
          border-radius: 50%;
          pointer-events: none;
          z-index: 2147483647;
          box-shadow: 0 0 15px rgba(255,0,0,0.8), 0 0 30px rgba(255,0,0,0.4);
          transition: none;
        \`;
        document.body.appendChild(cursor);

        window.customCursor = cursor;
        window.updateCursorPosition = (x, y) => {
          cursor.style.left = (x - 14) + 'px';
          cursor.style.top = (y - 14) + 'px';
        };

        window.updateCursorPosition(100, 100);
      })();
    `;

    try {
      await this.page.evaluate(cursorScript);
      await this.page.evaluate(`window.updateCursorPosition(${this.currentCursor.x}, ${this.currentCursor.y})`);
      console.log(`   ✓ Cursor overlay injected`);
    } catch (error) {
      console.warn(`   ⚠️  Cursor injection failed:`, error);
    }
  }

  /**
   * Move cursor smoothly from current position to target
   */
  private async moveCursorTo(x: number, y: number, steps: number = 30): Promise<void> {
    if (!this.page) return;

    const startX = this.currentCursor.x;
    const startY = this.currentCursor.y;

    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      // Smoothstep easing
      const easedT = t * t * (3 - 2 * t);

      const newX = startX + (x - startX) * easedT;
      const newY = startY + (y - startY) * easedT;

      // Move real mouse
      try {
        await this.page.mouse.move(newX, newY);
      } catch {}

      // Update visual cursor
      try {
        await this.page.evaluate(`window.updateCursorPosition && window.updateCursorPosition(${newX}, ${newY})`);
      } catch {}

      this.currentCursor = { x: newX, y: newY };

      await this.page.waitForTimeout(15); // 60fps movement
    }
  }

  /**
   * Natural idle cursor movement (like a human presenter pointing)
   */
  private async idleCursorMovement(duration: number): Promise<void> {
    if (!this.page) return;

    const startTime = Date.now();

    while (Date.now() - startTime < duration) {
      const offsetX = Math.floor(Math.random() * 60) - 30;
      const offsetY = Math.floor(Math.random() * 40) - 20;

      const targetX = Math.max(100, Math.min(1820, this.currentCursor.x + offsetX));
      const targetY = Math.max(100, Math.min(980, this.currentCursor.y + offsetY));

      await this.moveCursorTo(targetX, targetY, 15);
      await this.page.waitForTimeout(200);
    }
  }

  /**
   * Generate script from storyboard nodes
   */
  private generateScriptFromStoryboard(storyboard: Storyboard): string {
    console.log(`📝 Generating script from storyboard...`);

    const scriptParts: string[] = [];

    // Introduction
    scriptParts.push(`Welcome! Let me show you ${storyboard.title || 'this amazing product'}.`);

    // Process each node
    for (const node of storyboard.nodes) {
      if (node.content && node.content.trim()) {
        // Convert node content to narration
        const narration = this.nodeToNarration(node);
        if (narration) {
          scriptParts.push(narration);
        }
      }
    }

    // Conclusion
    scriptParts.push(`That's the quick tour! I hope you found this helpful.`);

    const script = scriptParts.join(' ');
    console.log(`   ✓ Script generated (${script.length} characters)`);

    return script;
  }

  /**
   * Convert storyboard node to narration text
   */
  private nodeToNarration(node: StoryNode): string {
    const content = node.content.trim();

    // Add context based on node type
    switch (node.type) {
      case 'title':
        return `Let's explore ${content}.`;
      case 'problem':
        return `Here's the challenge: ${content}.`;
      case 'solution':
        return `The solution is simple: ${content}.`;
      case 'feature':
        return `Check out this feature: ${content}.`;
      case 'benefit':
        return `This means ${content}.`;
      case 'cta':
        return `${content}`;
      default:
        return content;
    }
  }

  /**
   * Run autonomous demo with AI navigation
   */
  private async runAutonomousDemo(url: string, script: string, maxDuration: number): Promise<void> {
    if (!this.page) throw new Error('Browser not initialized');

    console.log(`🤖 Starting autonomous demo (max ${maxDuration}s)...`);
    this.startTime = Date.now();

    // Split script into segments for narration
    const scriptSegments = this.splitScriptIntoSegments(script);
    let segmentIndex = 0;

    while (true) {
      const elapsed = (Date.now() - this.startTime) / 1000;

      if (elapsed > maxDuration - 5) {
        console.log(`   ⏱️  Approaching time limit, wrapping up...`);
        break;
      }

      // Get next narration segment
      const narration = segmentIndex < scriptSegments.length
        ? scriptSegments[segmentIndex]
        : 'Let me show you more features.';

      segmentIndex++;

      // Record narration
      this.recordNarration(narration, 'navigation');
      console.log(`\n🎤 [${elapsed.toFixed(1)}s] ${narration}`);

      // Move cursor naturally while narrating
      const narrationDuration = Math.min(narration.length * 50, 2000);
      await this.idleCursorMovement(narrationDuration);

      // AI decides next action
      const decision = await this.aiDecideNextAction(url, elapsed);

      if (!decision) {
        console.log(`   ℹ️  No more actions to take`);
        break;
      }

      // Execute action
      await this.executeAction(decision);

      // Idle movement between actions
      await this.idleCursorMovement(800);

      // Stop if we've exhausted script segments
      if (segmentIndex >= scriptSegments.length && this.actionsTaken.length > 8) {
        break;
      }
    }

    // Closing narration
    this.recordNarration('Thanks for watching!', 'conclusion');
    await this.idleCursorMovement(2000);

    const totalDuration = (Date.now() - this.startTime) / 1000;
    console.log(`   ✓ Demo completed (${totalDuration.toFixed(1)}s, ${this.actionsTaken.length} actions)`);
  }

  /**
   * Split script into narration segments
   */
  private splitScriptIntoSegments(script: string): string[] {
    // Split by sentences
    const sentences = script.match(/[^.!?]+[.!?]+/g) || [script];

    // Group sentences into segments of 1-2 sentences
    const segments: string[] = [];
    for (let i = 0; i < sentences.length; i += 2) {
      const segment = sentences.slice(i, i + 2).join(' ').trim();
      if (segment) {
        segments.push(segment);
      }
    }

    return segments;
  }

  /**
   * Use GPT-4 Vision to decide next action
   */
  private async aiDecideNextAction(url: string, elapsedTime: number): Promise<NavigationDecision | null> {
    if (!this.page) return null;

    // Get screenshot
    const screenshot = await this.page.screenshot({ type: 'png' });
    const screenshotB64 = screenshot.toString('base64');

    // Get page info
    const pageInfo = await this.page.evaluate(() => {
      return {
        url: window.location.href,
        title: document.title,
        searchInputs: Array.from(document.querySelectorAll('input[type="search"], input[type="text"]'))
          .slice(0, 3)
          .map((input: any) => ({
            placeholder: input.placeholder || input.name || 'search',
            visible: input.getBoundingClientRect().width > 0
          })),
        buttons: Array.from(document.querySelectorAll('button, [role="button"]'))
          .slice(0, 5)
          .map((btn: any) => btn.innerText?.trim())
          .filter(text => text && text.length > 0),
        links: Array.from(document.querySelectorAll('a[href]'))
          .slice(0, 10)
          .map((link: any) => link.innerText?.trim())
          .filter(text => text && text.length > 2 && text.length < 50)
      };
    });

    const prompt = `You are demonstrating a website to potential customers.

Current Page:
- URL: ${pageInfo.url}
- Title: ${pageInfo.title}
- Search inputs: ${JSON.stringify(pageInfo.searchInputs)}
- Buttons: ${pageInfo.buttons.slice(0, 3).join(', ')}
- Links: ${pageInfo.links.slice(0, 5).join(', ')}

Actions taken: ${this.actionsTaken.join(', ')}
Time elapsed: ${elapsedTime.toFixed(1)}s

Decide the NEXT BEST action to showcase this website. Be dynamic and interactive:
- Search for products/features
- Click on interesting items
- Navigate to different sections
- Scroll to reveal content
- Keep actions brief (5-10 seconds each)

Respond in JSON:
{
  "action_type": "search|click_link|click_button|scroll|wait",
  "target": "what to click or search term",
  "reason": "why this showcases value",
  "narration": "brief explanation (max 15 words)"
}`;

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              {
                type: 'image_url',
                image_url: {
                  url: `data:image/png;base64,${screenshotB64}`,
                  detail: 'low'
                }
              }
            ]
          }
        ],
        max_tokens: 200,
        temperature: 0.7
      });

      let resultText = response.choices[0].message.content?.trim() || '{}';

      // Extract JSON
      if (resultText.includes('```json')) {
        resultText = resultText.split('```json')[1].split('```')[0];
      } else if (resultText.includes('```')) {
        resultText = resultText.split('```')[1].split('```')[0];
      }

      const decision = JSON.parse(resultText) as NavigationDecision;
      return decision;

    } catch (error) {
      console.warn(`   ⚠️  AI decision failed:`, error);

      // Fallback action
      if (this.actionsTaken.length < 3) {
        return {
          action_type: 'scroll',
          target: '300',
          reason: 'Explore page content',
          narration: 'Let me show you more features here'
        };
      }

      return null;
    }
  }

  /**
   * Execute a navigation action
   */
  private async executeAction(decision: NavigationDecision): Promise<void> {
    if (!this.page) return;

    const { action_type, target } = decision;

    try {
      switch (action_type) {
        case 'search':
          if (target) {
            await this.performSearch(target);
            this.actionsTaken.push(`searched:${target}`);
          }
          break;

        case 'click_link':
          if (target) {
            const success = await this.smoothClick(`text=${target}`, target);
            if (success) {
              this.actionsTaken.push(`clicked:${target}`);
            } else {
              await this.smoothScroll(300);
            }
          }
          break;

        case 'click_button':
          if (target) {
            const success = await this.smoothClick(`button:has-text("${target}")`, target);
            if (success) {
              this.actionsTaken.push(`clicked:${target}`);
            } else {
              await this.smoothScroll(300);
            }
          }
          break;

        case 'scroll':
          const pixels = target && !isNaN(parseInt(target)) ? parseInt(target) : 400;
          await this.smoothScroll(pixels);
          this.actionsTaken.push('scrolled');
          break;

        case 'wait':
          await this.idleCursorMovement(2000);
          break;
      }
    } catch (error) {
      console.warn(`   ⚠️  Action failed:`, error);
    }
  }

  /**
   * Perform search with smooth cursor movement
   */
  private async performSearch(query: string): Promise<boolean> {
    if (!this.page) return false;

    const searchSelectors = [
      'input[type="search"]',
      'input[name*="search" i]',
      'input[placeholder*="search" i]',
      'input[type="text"]'
    ];

    for (const selector of searchSelectors) {
      try {
        const count = await this.page.locator(selector).count();
        if (count > 0) {
          await this.smoothClick(selector, 'search box');

          // Type query
          for (const char of query) {
            await this.page.keyboard.type(char);
            await this.page.waitForTimeout(80);
          }

          await this.page.waitForTimeout(500);
          await this.page.keyboard.press('Enter');
          await this.page.waitForTimeout(2000);

          // Re-inject cursor
          await this.injectCursorOverlay();
          await this.moveCursorTo(
            Math.floor(Math.random() * 1300) + 300,
            Math.floor(Math.random() * 400) + 300,
            20
          );

          console.log(`   ✓ Searched for: ${query}`);
          return true;
        }
      } catch {}
    }

    return false;
  }

  /**
   * Click element with smooth cursor movement
   */
  private async smoothClick(selector: string, description: string = ''): Promise<boolean> {
    if (!this.page) return false;

    try {
      const element = this.page.locator(selector).first();
      await element.scrollIntoViewIfNeeded();
      await this.page.waitForTimeout(300);

      // Get element position
      const box = await element.boundingBox();
      if (box) {
        const targetX = box.x + box.width / 2;
        const targetY = box.y + box.height / 2;

        // Move cursor to element
        await this.moveCursorTo(targetX, targetY, 25);
        await this.page.waitForTimeout(400);
      }

      await element.click();
      await this.page.waitForTimeout(600);

      // Re-inject cursor after navigation
      await this.injectCursorOverlay();
      await this.moveCursorTo(
        Math.floor(Math.random() * 1500) + 200,
        Math.floor(Math.random() * 600) + 200,
        20
      );

      console.log(`   ✓ Clicked: ${description || selector}`);
      return true;

    } catch (error) {
      console.log(`   ✗ Click failed: ${selector}`);
      return false;
    }
  }

  /**
   * Smooth scroll with cursor following
   */
  private async smoothScroll(pixels: number): Promise<void> {
    if (!this.page) return;

    // Move cursor to middle
    await this.moveCursorTo(960, 540, 20);

    const steps = 20;
    for (let i = 0; i < steps; i++) {
      await this.page.evaluate(`window.scrollBy(0, ${pixels / steps})`);

      // Cursor follows scroll slightly
      this.currentCursor.y = Math.max(100, Math.min(980, this.currentCursor.y - (pixels / steps) * 0.3));
      try {
        await this.page.evaluate(`window.updateCursorPosition && window.updateCursorPosition(${this.currentCursor.x}, ${this.currentCursor.y})`);
      } catch {}

      await this.page.waitForTimeout(30);
    }

    await this.idleCursorMovement(500);
  }

  /**
   * Record narration with timestamp
   */
  private recordNarration(text: string, action: string): void {
    const timestamp = (Date.now() - this.startTime) / 1000;

    this.narrationLog.push({
      timestamp,
      action,
      narration: text
    });
  }

  /**
   * Generate voice-over audio from script using OpenAI TTS
   */
  private async generateVoiceOver(script: string, voice: string): Promise<string> {
    console.log(`🎙️  Generating voice-over...`);

    try {
      const mp3 = await this.openai.audio.speech.create({
        model: 'tts-1',
        voice: voice as any,
        input: script,
        speed: 1.0
      });

      const buffer = Buffer.from(await mp3.arrayBuffer());
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const audioPath = path.join(this.logsDir, `voiceover_${timestamp}.mp3`);

      fs.writeFileSync(audioPath, buffer);

      console.log(`   ✓ Voice-over saved: ${audioPath}`);
      return audioPath;

    } catch (error: any) {
      console.warn(`   ⚠️  Voice-over generation failed:`, error.message);
      return '';
    }
  }

  /**
   * Save demo results
   */
  private async saveResults(url: string, title: string, audioPath: string): Promise<DemoVideoResult> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const duration = (Date.now() - this.startTime) / 1000;

    // Save narration log
    const scriptPath = path.join(this.logsDir, `demo_script_${timestamp}.json`);
    fs.writeFileSync(scriptPath, JSON.stringify({
      url,
      title,
      duration,
      actionsCount: this.actionsTaken.length,
      actions: this.actionsTaken,
      narrations: this.narrationLog,
      timestamp: new Date().toISOString()
    }, null, 2));

    console.log(`   ✓ Script saved: ${scriptPath}`);

    // Get video path
    let videoPath = '';
    if (this.page && this.page.video()) {
      videoPath = await this.page.video()!.path();
      console.log(`   ✓ Video saved: ${videoPath}`);
    }

    return {
      videoPath,
      audioPath,
      scriptPath,
      duration,
      actionsCount: this.actionsTaken.length,
      timestamp
    };
  }

  /**
   * Cleanup browser resources
   */
  private async cleanup(): Promise<void> {
    if (this.context) {
      await this.context.close();
    }
    if (this.browser) {
      await this.browser.close();
    }

    this.browser = null;
    this.context = null;
    this.page = null;
  }
}
