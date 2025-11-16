import { chromium, Browser, BrowserContext, Page } from 'playwright';
import OpenAI from 'openai';
import { Storyboard, StoryNode } from '../types/index';
import { normalizeUrl } from '../utils/validation';
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

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
  duration?: number; // Max duration in seconds (default: 45, max: 60)
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

export interface SceneAction {
  action: 'search' | 'navigate' | 'scroll' | 'highlight';
  target?: string;
  reason: string;
  duration: number;
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
      // 1. Start browser with video recording (use smaller, standard size)
      await this.startBrowser(options.videoWidth || 1280, options.videoHeight || 720);

      // 2. Extract storyboard context (we'll generate narration live)
      const storyboardContext = this.generateStoryboardContext(options.storyboard);

      // 3. Navigate to website
      await this.navigateToWebsite(options.url);

      // 4. Run STORYBOARD-GUIDED demo (much smarter!)
      const maxDuration = Math.min(Math.max(options.duration || 45, 30), 60);
      await this.runStoryboardGuidedDemo(options.url, options.storyboard, maxDuration);

      // 5. Generate voice-over from recorded narrations
      const script = this.narrationLog.map(n => n.narration).join(' ');
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

    try {
    this.browser = await chromium.launch({
      headless: false, // Set to true for production
      args: [
          `--window-size=${width},${height}`,
        '--disable-blink-features=AutomationControlled',
        '--disable-infobars',
          '--disable-dev-shm-usage',
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-zoom',
          '--force-device-scale-factor=1'
      ]
    });
    } catch (error: any) {
      console.error('❌ Failed to launch browser. Playwright might not be installed correctly.');
      console.error('   Run: cd backend && npm run setup-playwright');
      throw new Error(`Failed to launch browser: ${error.message}. Make sure Playwright browsers are installed by running: npm run setup-playwright`);
    }

    this.context = await this.browser.newContext({
      recordVideo: {
        dir: this.videosDir,
        size: { width, height }
      },
      viewport: { width, height },
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      // Prevent zooming and ensure fixed viewport
      deviceScaleFactor: 1,
      hasTouch: false,
      isMobile: false
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

    // Normalize URL (add https:// if missing)
    const normalizedUrl = normalizeUrl(url);
    console.log(`📍 Navigating to ${normalizedUrl}...`);

    try {
      await this.page.goto(normalizedUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
    } catch {
      await this.page.goto(normalizedUrl, { timeout: 30000 });
    }

    await this.page.waitForTimeout(2000);

    // Dismiss cookie banners automatically
    await this.dismissCookieBanners();

    // Inject custom cursor overlay
    await this.injectCursorOverlay();

    // Initialize cursor position
    await this.moveCursorTo(400, 300, 20);
    await this.idleCursorMovement(1000);

    console.log(`   ✓ Page loaded and cursor initialized`);
  }

  /**
   * DEDICATED X-BUTTON CLICKER FOR TRANSLATION POPUP
   * Specifically targets and clicks the X button on Airbnb's translation modal
   */
  private async clickTranslationPopupX(): Promise<boolean> {
    if (!this.page) return false;

    try {
      // Check if translation popup exists
      const hasDialog = await this.page.locator('[role="dialog"]').count() > 0;
      if (!hasDialog) return false;

      console.log(`   🎯 Translation popup detected! Searching for X button...`);

      // Multiple X button selectors in priority order
      const xButtonSelectors = [
        '[role="dialog"] button[aria-label="Close"]',  // Exact match
        '[role="dialog"] button:first-of-type',         // First button (usually X)
        '[role="dialog"] header button:first-child',    // X in header
        '[role="dialog"] button[type="button"]:first-child',
        '[role="dialog"] button:has-text("×")',
        '[role="dialog"] button[aria-label*="close" i]',
      ];

      for (const selector of xButtonSelectors) {
        try {
          const xButton = this.page.locator(selector).first();
          const buttonCount = await xButton.count();

          if (buttonCount > 0) {
            const isVisible = await xButton.isVisible().catch(() => false);
            
            if (isVisible) {
              console.log(`   ✅ FOUND X button with selector: ${selector}`);
              
              // Get button position and animate cursor to it (looks natural!)
              const box = await xButton.boundingBox();
              if (box) {
                const targetX = box.x + box.width / 2;
                const targetY = box.y + box.height / 2;
                console.log(`   🖱️  Moving cursor to X button at (${targetX.toFixed(0)}, ${targetY.toFixed(0)})`);
                await this.moveCursorTo(targetX, targetY, 20);  // Smooth cursor movement
                await this.page.waitForTimeout(300);  // Pause like a human would
              }

              // Click the X button multiple ways
              let clicked = false;
              try {
                await xButton.click({ timeout: 3000, force: false });
                clicked = true;
                console.log(`   ✓ Clicked X with normal click`);
              } catch {
                try {
                  await xButton.click({ timeout: 3000, force: true });
                  clicked = true;
                  console.log(`   ✓ Clicked X with force click`);
                } catch {
                  // JavaScript click as last resort
                  await xButton.evaluate((el: any) => el.click());
                  clicked = true;
                  console.log(`   ✓ Clicked X with JavaScript`);
                }
              }

              if (clicked) {
                await this.page.waitForTimeout(800);  // Wait for modal to close
                
                // Verify the popup is gone
                const stillHasDialog = await this.page.locator('[role="dialog"]').count() > 0;
                if (!stillHasDialog) {
                  console.log(`   💥 Translation popup DESTROYED by X click!`);
                  return true;
                } else {
                  console.log(`   ⚠️  Dialog still present after X click, will try DOM removal...`);
                }
              }
            }
          }
        } catch (err) {
          // Try next selector
          continue;
        }
      }

      console.log(`   ⚠️  Couldn't find clickable X button`);
      return false;

    } catch (err) {
      console.log(`   ⚠️  X button clicker failed: ${err}`);
      return false;
    }
  }

  /**
   * Force remove all dialogs from DOM (nuclear option)
   */
  private async forceRemoveDialogsFromDOM(): Promise<void> {
    if (!this.page) return;

    console.log(`   💥 FORCE REMOVING dialogs from DOM...`);

    // @ts-ignore
    await this.page.evaluate(() => {
      // @ts-ignore
      const doc: any = typeof document !== 'undefined' ? document : null;
      if (!doc) return;
      
      // Remove all dialog elements
      const dialogs = doc.querySelectorAll('[role="dialog"]');
      dialogs.forEach((dialog: any) => {
        if (dialog.parentElement) {
          dialog.parentElement.remove();
        }
        dialog.remove();
      });
      
      // Remove overlays
      const overlays = doc.querySelectorAll('[class*="overlay"], [class*="backdrop"], [class*="modal-backdrop"]');
      overlays.forEach((overlay: any) => overlay.remove());
      
      // Re-enable scrolling
      doc.body.style.overflow = 'auto';
    });

    await this.page.waitForTimeout(400);
    console.log(`   ✓ Dialogs removed from DOM!`);
  }

  /**
   * Auto-dismiss ALL popups - cookie banners, modals, overlays, etc.
   * This now handles X buttons, close buttons, and accept buttons
   */
  private async dismissCookieBanners(): Promise<void> {
    if (!this.page) return;

    console.log(`   🚫 Looking for popups and overlays...`);

    // PRIORITY 0: Try clicking the X button first (most natural!)
    const xClicked = await this.clickTranslationPopupX();
    if (xClicked) {
      console.log(`   ✅ Popup dismissed via X button click!`);
      return;
    }

    // PRIORITY 1: If X button didn't work, try ESC key
    try {
      const dialogCount = await this.page.locator('[role="dialog"]').count();
      if (dialogCount > 0) {
        console.log(`   ⌨️  X button didn't work, trying ESC key...`);
        await this.page.keyboard.press('Escape');
        await this.page.waitForTimeout(500);
        
        const remainingDialogs = await this.page.locator('[role="dialog"]').count();
        if (remainingDialogs === 0) {
          console.log(`   ✓ ESC key worked!`);
          return;
        }
      }
    } catch {}

    // PRIORITY 2: Nuclear option - force remove from DOM
    try {
      const dialogCount = await this.page.locator('[role="dialog"]').count();
      if (dialogCount > 0) {
        await this.forceRemoveDialogsFromDOM();
        return;
      }
    } catch {}

    // PRIORITY 1: X buttons and close buttons (for stubborn popups that ignore ESC)
    const closeSelectors = [
      // X buttons with common patterns
      'button[aria-label="Close"]',
      'button[aria-label="close"]',
      'button[aria-label*="Close"]',
      'button[title="Close"]',
      'button[title="close"]',
      'button:has-text("×")',  // × symbol
      'button:has-text("✕")',  // ✕ symbol
      '[role="button"][aria-label*="close"]',
      '[role="button"][aria-label*="Close"]',
      // Common close button classes
      'button[class*="close"]',
      'button[class*="Close"]',
      'button[class*="dismiss"]',
      '[class*="close-button"]',
      '[class*="closeButton"]',
      '[class*="modal-close"]',
      '[class*="modalClose"]',
      // SVG-based X buttons
      'button svg[class*="close"]',
      'button svg[data-icon="close"]',
      // Translation popup specific (from screenshot)
      'button[aria-label*="translation"]',
      'dialog button[aria-label="Close"]',
    ];

    // Try to close X buttons first
    for (const selector of closeSelectors) {
      try {
        const button = this.page.locator(selector).first();
        const count = await button.count();

        if (count > 0) {
          const isVisible = await button.isVisible().catch(() => false);

          if (isVisible) {
            console.log(`   ✓ Found close button: ${selector}`);
            // Try normal click first
            try {
              await button.click({ timeout: 2000, force: false });
            } catch {
              // Fallback to force click
              await button.click({ timeout: 2000, force: true });
            }
            await this.page.waitForTimeout(800);
            console.log(`   ✓ Popup dismissed!`);
            
            // CRITICAL: Check for more popups recursively (translation modal sometimes has layers)
            const stillHasDialogs = await this.page.locator('[role="dialog"]').count() > 0;
            if (stillHasDialogs) {
              console.log(`   🔄 Another popup appeared, dismissing recursively...`);
              await this.dismissCookieBanners();  // Recursive call
            }
            return;  // Exit after successful dismissal
          }
        }
      } catch (error) {
        // Continue to next selector
      }
    }

    // PRIORITY 2: Cookie/consent accept buttons
    const cookieSelectors = [
      // Common "Accept" button text
      'button:has-text("Accept")',
      'button:has-text("Accept all")',
      'button:has-text("Accept All")',
      'button:has-text("I accept")',
      'button:has-text("I Accept")',
      'button:has-text("Got it")',
      'button:has-text("OK")',
      'button:has-text("Agree")',
      'button:has-text("Allow all")',
      'button:has-text("Continue")',
      // Airbnb specific
      '[data-testid*="accept"]',
      '[data-testid*="cookie"]',
      // Common class names
      'button[class*="accept"]',
      'button[class*="cookie"]',
      'button[class*="consent"]',
      // ARIA labels
      'button[aria-label*="Accept"]',
      'button[aria-label*="accept"]',
    ];

    for (const selector of cookieSelectors) {
      try {
        const button = this.page.locator(selector).first();
        const count = await button.count();

        if (count > 0) {
          const isVisible = await button.isVisible().catch(() => false);

          if (isVisible) {
            console.log(`   ✓ Found accept button, clicking...`);
            await button.click({ timeout: 2000 });
            await this.page.waitForTimeout(800);
            console.log(`   ✓ Cookie/consent banner dismissed`);
            return; // Found and clicked, exit
          }
        }
      } catch (error) {
        // Continue to next selector
      }
    }

    console.log(`   ℹ️  No popups found (or already dismissed)`);
  }

  /**
   * Quick popup check - call this during scene transitions
   */
  private async dismissPopups(): Promise<void> {
    // Just a quick alias for dismissCookieBanners which now handles all popups
    await this.dismissCookieBanners();
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
   * Generate context from storyboard (guidance for AI, not a script!)
   */
  private generateStoryboardContext(storyboard: Storyboard): string {
    console.log(`📝 Extracting storyboard context...`);

    // Extract key themes and topics from the storyboard to guide the AI
    const themes = storyboard.nodes.map((node, idx) => {
      const speakerNotes = node.speakerNotes || node.content || '';
      return `${idx + 1}. ${node.type}: ${speakerNotes.substring(0, 150)}`;
    }).join('\n');

    const context = `
PRODUCT: ${storyboard.title}
TAGLINE: ${storyboard.tagline || 'N/A'}

DEMONSTRATION GOALS (what the demo should highlight):
${themes}
    `.trim();

    console.log(`   ✓ Context extracted`);
    return context;
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
   * Run STORYBOARD-GUIDED demo - MUCH SMARTER!
   * Each storyboard node becomes a scene showing relevant website content
   */
  private async runStoryboardGuidedDemo(url: string, storyboard: Storyboard, maxDuration: number): Promise<void> {
    if (!this.page) throw new Error('Browser not initialized');

    console.log(`🎯 Starting STORYBOARD-GUIDED demo (max ${maxDuration}s)...`);
    console.log(`   Following ${storyboard.nodes.length} storyboard nodes`);
    this.startTime = Date.now();

    // Calculate time per scene - FAST pacing with EARLY LISTING CLICK
    // CRITICAL: We need to click a listing by 35-40 seconds!
    const maxTimePerScene = 6; // Faster scenes to reach listing click sooner
    const targetDuration = Math.min(maxDuration, 55); // Cap at 55s to stay under 60
    const timePerScene = Math.min(targetDuration / storyboard.nodes.length, maxTimePerScene);

    console.log(`   Target duration: ${targetDuration.toFixed(1)}s`);
    console.log(`   Scenes: ${storyboard.nodes.length}`);
    console.log(`   Time per scene: ${timePerScene.toFixed(1)}s (FAST pace)`);
    console.log(`   🎯 Goal: Click listing by 35-40s, total video < 60s`);

    // Process each storyboard node as a scene
    for (let i = 0; i < storyboard.nodes.length; i++) {
      const node = storyboard.nodes[i];
      const elapsed = (Date.now() - this.startTime) / 1000;

      // CRITICAL: Force listing click between scenes 2-3 if we're past 30 seconds
      if (i === 2 && elapsed > 30 && elapsed < 40) {
        console.log(`\n🚨 FORCING LISTING CLICK at ${elapsed.toFixed(1)}s to stay under 60s!`);
        // Force a listing click scene
        await this.forceListingClickScene();
      }

      if (elapsed >= targetDuration) {
        console.log(`   ⏱️  Reached target duration ${targetDuration}s, stopping...`);
        break;
      }

      if (elapsed >= 55) {
        console.log(`   ⏱️  Approaching 60s limit (currently ${elapsed.toFixed(1)}s), wrapping up...`);
        break;
      }

      console.log(`\n📍 Scene ${i + 1}/${storyboard.nodes.length}: ${node.title} (${node.type}) [${elapsed.toFixed(1)}s elapsed]`);

      // Use fixed time per scene to maintain pace
      // Quick scenes = more features shown!
      const sceneTime = Math.min(timePerScene, 6); // Max 6s per scene for faster pacing

      // Create a scene for this node (pass scene number for better AI decisions)
      await this.createSceneForNode(node, url, sceneTime, i + 1);

      // Record narration from speaker notes
      if (node.speakerNotes) {
        this.recordNarration(node.speakerNotes, `scene-${i + 1}`);
      }
    }

    // Closing
    const totalDuration = (Date.now() - this.startTime) / 1000;
    console.log(`   ✓ Storyboard-guided demo completed (${totalDuration.toFixed(1)}s, ${this.actionsTaken.length} actions)`);
  }

  /**
   * Force a listing click scene (guaranteed to click a listing)
   */
  private async forceListingClickScene(): Promise<void> {
    if (!this.page) return;

    try {
      console.log(`   🎯 FORCING LISTING CLICK...`);
      
      // Dismiss any popups first
      await this.dismissPopups();
      
      // Try to click first visible listing
      const clicked = await this.clickFirstVisibleListing();
      
      if (clicked) {
        console.log(`   ✅ Listing clicked successfully!`);
        
        // Wait for page to load
        await this.page.waitForTimeout(2000);
        
        // Dismiss any popups on new page
        await this.dismissPopups();
        
        // Generate narration for the listing page
        const narration = "Now let's take a closer look at this listing to see all the details and features available.";
        this.recordNarration(narration, 'forced-listing-click');
        
        // Show the listing page briefly
        await this.idleCursorMovement(3000);
      } else {
        console.log(`   ⚠️  Could not click listing, continuing...`);
      }
    } catch (error: any) {
      console.warn(`   ⚠️  Force listing click failed:`, error.message);
    }
  }

  /**
   * Create a video scene for a specific storyboard node - WITH REAL-TIME NARRATION
   */
  private async createSceneForNode(node: StoryNode, baseUrl: string, duration: number, sceneNumber: number = 1): Promise<void> {
    if (!this.page) return;

    try {
      // 1. Use AI to determine what to show for this node (WITH VISION!)
      const sceneAction = await this.planSceneAction(node, baseUrl, sceneNumber);

      console.log(`   🎬 Scene action: ${sceneAction.action} - ${sceneAction.target || 'N/A'}`);
      console.log(`   💬 "${sceneAction.reason}"`);

      // 2. Execute the scene action
      await this.executeSceneAction(sceneAction);

      // Quick settle - DON'T freeze here!
      await this.page.waitForTimeout(400);

      // CRITICAL: Aggressively dismiss popups before generating narration
      console.log(`   🚫 Checking for popups after scene action...`);
      await this.dismissPopups();
      await this.page.waitForTimeout(200);
      
      // Double-check for stubborn popups (like translation modal)
      const dialogCount = await this.page.locator('[role="dialog"]').count();
      if (dialogCount > 0) {
        console.log(`   ⚠️  Found ${dialogCount} dialogs, attempting aggressive dismissal...`);
        await this.page.keyboard.press('Escape');  // Try ESC key
        await this.page.waitForTimeout(200);
        await this.dismissPopups();
      }

      // 3. Generate LIVE narration based on what we actually see
      const liveNarration = await this.generateLiveNarration(node);
      console.log(`   🎤 Live: "${liveNarration}"`);
      
      // Record the live narration
      this.recordNarration(liveNarration, `scene-${node.id}`);

      // 4. Quick hold - reduced to show more features faster
      const holdTime = Math.min(duration * 1000, 2000); // Reduced to 2s max
      await this.idleCursorMovement(holdTime);

      // CRITICAL: Don't freeze! Keep the page alive
      await this.page.evaluate(() => {
        // @ts-ignore
        const doc: any = typeof document !== 'undefined' ? document : null;
        if (doc) {
          // Trigger a small scroll to keep page active
          doc.body.scrollTop = doc.body.scrollTop + 1;
        }
      });

    } catch (error: any) {
      console.warn(`   ⚠️  Scene creation failed:`, error.message);
      // Continue to next scene - DON'T let errors freeze the agent!
    }
  }

  /**
   * Use GPT-4 to plan what to show for this storyboard node
   * NOW WITH VISION: AI sees the page and makes better decisions!
   */
  private async planSceneAction(node: StoryNode, baseUrl: string, sceneNumber: number): Promise<SceneAction> {
    if (!this.page) throw new Error('Page not initialized');

    // Get current page state
    const currentUrl = await this.page.url();
    const screenshot = await this.page.screenshot({ type: 'png' });
    const screenshotB64 = screenshot.toString('base64');

    const prompt = `You are creating a demo video. This is ONE SCENE that should demonstrate the product INTERACTIVELY.

🎬 SCENE INFO:
- Scene Number: ${sceneNumber} of 8-9 total

STORYBOARD NODE (your guidance):
- Type: ${node.type}
- Title: "${node.title}"
- Content: "${node.content}"
- Goals: "${node.speakerNotes || 'N/A'}"

CURRENT STATE:
- Base URL: ${baseUrl}
- Current URL: ${currentUrl}
- Previous Actions: ${this.actionsTaken.slice(-3).join(', ') || 'none yet'}

🚨 MANDATORY ACTION SEQUENCE (FOLLOW EXACTLY):

**IF SCENE 1-2 AND you see a SEARCH BAR in the screenshot:**
→ You MUST use: {"action": "search", "target": "Paris apartments", ...}
→ Don't scroll, don't navigate - SEARCH!

**IF SCENE 3-4 AND you see LISTING CARDS in the screenshot:**
→ You MUST use: {"action": "navigate", "target": "click-first-listing", ...}
→ This is NOT optional - CLICK THE LISTING!

**IF SCENE 5+ OR on a detail page:**
→ Use: {"action": "scroll", "target": "400", ...}

🔍 WHAT TO LOOK FOR IN THE SCREENSHOT:
- **Search bar?** → Rectangle input field, usually at top, may have placeholder text
- **Listing cards?** → Rectangles with images, prices like "$120", ratings, titles
- **Detail page?** → Large hero image, detailed description, amenities list

⚡ ACTION RULES:
1. SEARCH is highest priority if you see a search bar (scenes 1-2 only)
2. CLICK LISTING is highest priority if you see cards (scene 3-4)
3. SCROLL only if no search bar or listings visible
4. Each action should be 5-7 seconds max

⚡ SPECIAL ACTIONS:
- target "click-first-listing" with navigate action → Automatically clicks first visible listing/card/product
- target "search-term" with search action → Uses search functionality

🔍 DECISION TREE (Use screenshot to decide):

**Do you see a SEARCH BAR in the screenshot?**
└─ YES + Scene 1-2? → {"action": "search", "target": "Paris apartments", "reason": "Demo search", "duration": 5}
└─ NO → Continue to next check

**Do you see LISTING CARDS with images/prices in the screenshot?**  
└─ YES + Scene 3-4? → {"action": "navigate", "target": "click-first-listing", "reason": "Show listing", "duration": 6}
└─ NO → Continue to next check

**Are you on a detail page (big images, lots of text)?**
└─ YES → {"action": "scroll", "target": "500", "reason": "Show details", "duration": 5}

**Otherwise (homepage without search bar visible):**
└─ {"action": "scroll", "target": "400", "reason": "Explore page", "duration": 4}

REMEMBER: 
- Search bars look like: [____Search____] or [Where are you going?]
- Listing cards look like: [📷 Image] [$120/night] [★★★★★] [Paris Apartment]
- Look at the SCREENSHOT to decide!

Respond ONLY with JSON (no other text):
{
  "action": "search|navigate|scroll|highlight",
  "target": "search query, path, or 'click-first-listing'",
  "reason": "brief explanation (max 5 words)",
  "duration": 4-7
}`;

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o',  // Use GPT-4o for smarter decisions
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
        response_format: { type: 'json_object' },
        max_tokens: 200,
        temperature: 0.3  // Lower temperature for more consistent results
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');
      return result as SceneAction;

    } catch (error: any) {
      console.warn(`   ⚠️  AI planning failed:`, error.message);

      // Fallback: Basic action based on node type
      return {
        action: 'scroll',
        target: '300',
        reason: 'Fallback action',
        duration: 5
      };
    }
  }

  /**
   * Execute a scene action
   */
  private async executeSceneAction(action: SceneAction): Promise<void> {
    if (!this.page) return;

    try {
      switch (action.action) {
        case 'search':
          if (action.target) {
            const searched = await this.performSearch(action.target);
            if (searched) {
              this.actionsTaken.push(`searched: ${action.target}`);
            } else {
              // Fallback to scroll
              await this.smoothScroll(400);
              this.actionsTaken.push('scrolled (search fallback)');
            }
          }
        break;

        case 'navigate':
          if (action.target) {
            try {
              // Handle special "click-first-listing" action
              if (action.target === 'click-first-listing' || action.target.includes('click-first')) {
                console.log(`   🎯 Looking for first listing/card to click...`);
                const clicked = await this.clickFirstVisibleListing();
                if (clicked) {
                  this.actionsTaken.push('clicked: first listing');
                } else {
                  console.log(`   ✗ No listing found, scrolling instead`);
                  await this.smoothScroll(400);
                  this.actionsTaken.push('scrolled (no listing found)');
                }
              } else {
                // Regular navigation
                const currentUrl = new URL(await this.page.url());
                const targetUrl = action.target.startsWith('http')
                  ? action.target
                  : `${currentUrl.origin}${action.target}`;

                await this.page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 10000 });
                await this.page.waitForTimeout(2000);
                await this.injectCursorOverlay();
                this.actionsTaken.push(`navigated: ${action.target}`);
              }
            } catch {
              console.log(`   ✗ Navigation failed, scrolling instead`);
              await this.smoothScroll(400);
            }
          }
          break;

        case 'scroll':
          const pixels = action.target && !isNaN(parseInt(action.target))
            ? parseInt(action.target)
            : 400;
          await this.smoothScroll(pixels);
          this.actionsTaken.push('scrolled');
          break;

        case 'highlight':
          // Just move cursor to highlight area and idle
          await this.idleCursorMovement(2000);
          this.actionsTaken.push('highlighted');
          break;
      }
    } catch (error: any) {
      console.warn(`   ⚠️  Action execution failed:`, error.message);
    }
  }

  /**
   * OLD METHOD - Run autonomous demo with AI navigation (DEPRECATED - NOT USED)
   * Keeping for reference but this is no longer called
   */
  // private async runAutonomousDemo(url: string, script: string, maxDuration: number): Promise<void> {
  //   // This method is deprecated and replaced by runStoryboardGuidedDemo
  // }

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
   * Use GPT-4 Vision to decide action AND generate contextual narration
   */
  private async aiDecideActionWithNarration(url: string, storyboardContext: string, elapsedTime: number, maxDuration: number): Promise<NavigationDecision | null> {
    if (!this.page) return null;

    // Get screenshot
    const screenshot = await this.page.screenshot({ type: 'png' });
    const screenshotB64 = screenshot.toString('base64');

    // Get page info
    const pageInfo = await this.page.evaluate(() => {
      // @ts-ignore
      const win: any = window;
      // @ts-ignore
      const doc: any = document;
      return {
        url: win.location.href,
        title: doc.title,
        searchInputs: Array.from(doc.querySelectorAll('input[type="search"], input[type="text"]'))
          .slice(0, 5)
          .map((input: any) => ({
            placeholder: input.placeholder || input.name || 'search',
            visible: input.getBoundingClientRect().width > 0,
            id: input.id,
            name: input.name
          })),
        buttons: Array.from(doc.querySelectorAll('button, [role="button"]'))
          .slice(0, 8)
          .map((btn: any) => btn.innerText?.trim())
          .filter((text: string) => text && text.length > 0 && text.length < 30),
        links: Array.from(doc.querySelectorAll('a[href]'))
          .slice(0, 15)
          .map((link: any) => link.innerText?.trim())
          .filter((text: string) => text && text.length > 2 && text.length < 50),
        headings: Array.from(doc.querySelectorAll('h1, h2, h3'))
          .slice(0, 5)
          .map((h: any) => h.innerText?.trim())
          .filter((text: string) => text && text.length > 0)
      };
    });

    const prompt = `You are a PRODUCT DEMO presenter showing this website to potential users.

STORYBOARD CONTEXT (what to showcase):
${storyboardContext}

CURRENT PAGE YOU SEE:
- URL: ${pageInfo.url}
- Title: ${pageInfo.title}
- Headings on page: ${pageInfo.headings.join(' | ')}
- Search boxes: ${JSON.stringify(pageInfo.searchInputs)}
- Buttons visible: ${pageInfo.buttons.slice(0, 5).join(', ')}
- Links visible: ${pageInfo.links.slice(0, 8).join(', ')}

PREVIOUS ACTIONS: ${this.actionsTaken.join(', ') || 'none yet'}
Time: ${elapsedTime.toFixed(1)}s / ${maxDuration}s

YOUR MISSION:
1. EXPLORE ACTIVELY - Don't stay on homepage! Click listings, use search, navigate pages
2. NARRATE WHAT YOU SEE - Describe the actual UI elements visible on screen
3. BE SPECIFIC - "Here's the search bar where you can find accommodations" not "Let me show you features"

ACTION PRIORITY (DO THIS IN ORDER):
1. **SEARCH** - If search exists and not used yet, USE IT! Search for: "San Francisco", "New York", "Beach house"
2. **CLICK LISTINGS/ITEMS** - Click on actual product cards, listings, items to show details
3. **CLICK BUTTONS** - "View Details", "See More", "Book Now", "Learn More"
4. **CLICK NAV LINKS** - Explore different sections
5. **SCROLL** - Only if nothing clickable

NARRATION RULES:
- Describe what's ACTUALLY VISIBLE on screen (search bars, buttons, cards, images)
- Use phrases like "Here we can see...", "At the top there's a...", "This section shows..."
- Be specific about UI elements: "search bar", "listing card", "price tag", "booking button"
- Keep it 8-15 words

Respond in JSON:
{
  "action_type": "search|click_link|click_button|scroll|wait",
  "target": "exact text to click OR search term",
  "reason": "what you're showing users",
  "narration": "Describe what's visible on screen right now (8-15 words)"
}

EXAMPLES:
- "Here at the top we can see a search bar for finding destinations"
- "Let's click on this listing to see more details about the property"
- "This section shows featured accommodations with prices and ratings"`;

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
                  detail: 'high' // Changed to high for better vision
                }
              }
            ]
          }
        ],
        max_tokens: 250,
        temperature: 0.8
      });

      let resultText = response.choices[0].message.content?.trim() || '{}';

      // Extract JSON
      if (resultText.includes('```json')) {
        resultText = resultText.split('```json')[1].split('```')[0];
      } else if (resultText.includes('```')) {
        resultText = resultText.split('```')[1].split('```')[0];
      }

      const decision = JSON.parse(resultText) as NavigationDecision;
      
      console.log(`   🎯 AI Decision: ${decision.action_type} - ${decision.target}`);
      console.log(`   💭 Reason: ${decision.reason}`);
      
      return decision;

    } catch (error: any) {
      console.warn(`   ⚠️  AI decision failed: ${error.message}`);

      // Smarter fallback - try to explore
      if (this.actionsTaken.length === 0) {
        return {
          action_type: 'scroll',
          target: '400',
          reason: 'Show page content',
          narration: 'Let me scroll down to show you what\'s available here'
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
      'input[aria-label*="search" i]',
      'input[id*="search" i]',
      'input[class*="search" i]',
      'input[type="text"]'
    ];

    for (const selector of searchSelectors) {
      try {
        const locator = this.page.locator(selector).first();
        const count = await locator.count();
        if (count > 0) {
          const isVisible = await locator.isVisible().catch(() => false);
          if (isVisible) {
            // Scroll to search box
            await locator.scrollIntoViewIfNeeded({ timeout: 5000 });
            await this.page.waitForTimeout(300);

            // Get position and move cursor
            const box = await locator.boundingBox();
            if (box) {
              const targetX = box.x + box.width / 2;
              const targetY = box.y + box.height / 2;
              await this.moveCursorTo(targetX, targetY, 25);
              await this.page.waitForTimeout(300);
            }

            // Click and focus
            await locator.click({ timeout: 5000 });
            await this.page.waitForTimeout(200);

            // Clear existing text
            await this.page.keyboard.press('Control+A');
            await this.page.waitForTimeout(100);

            // Type query
            await locator.fill(query);
          await this.page.waitForTimeout(500);

            // Submit search
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
        }
      } catch (error: any) {
        console.log(`   ⚠️  Search selector failed: ${selector} - ${error.message}`);
      }
    }

    console.log(`   ✗ Search box not found`);
    return false;
  }

  /**
   * Click on the first visible listing/card/product on the page
   * Multi-strategy approach optimized for modern SPAs (Airbnb, e-commerce, etc.)
   */
  private async clickFirstVisibleListing(): Promise<boolean> {
    if (!this.page) return false;

    console.log(`   🔍 Strategy 1: Enhanced heuristic selectors...`);
    
    // STRATEGY 1: Enhanced selectors based on real-world patterns
    // Optimized for Airbnb-like SPAs with URL patterns, nested structures, and semantic markup
    const listingSelectors = [
      // URL-based (most reliable for rental/listing sites)
      'a[href*="/rooms/"][href*="?"]',           // Airbnb with query params
      'a[href*="/rooms/"]:not([href*="/rooms/plus"])',  // Airbnb listings (not marketing)
      'a[href^="/rooms/"]',                      // Relative room URLs
      'a[href*="/listing/"]',                    // Generic listing pattern
      'a[href*="/product/"]',                    // E-commerce products
      
      // Structural patterns (link with image = likely a card)
      'a:has(img):has([class*="price"])',        // Link with image AND price
      'a:has(img):has([class*="rating"])',       // Link with image AND rating
      'a:has(> div > img)',                      // Direct child structure
      'a:has(img[loading="lazy"])',              // Lazy-loaded images (common in listings)
      
      // Data attributes (framework patterns)
      'a[data-testid*="card"]',
      'a[data-testid*="listing"]',
      'a[data-testid*="property"]',
      '[data-testid*="card-container"] a',
      '[itemprop="url"]',                        // Schema.org microdata
      
      // Semantic HTML
      'article a[href]',
      'li[role="presentation"] a[href]',         // List-based cards
      
      // Class-based (last resort, least reliable)
      'a[class*="card"]',
      'a[class*="listing"]',
      'a[class*="item"]'
    ];

    for (const selector of listingSelectors) {
      try {
        const elements = await this.page.locator(selector).all();
        
        for (const element of elements) {
          try {
            const isVisible = await element.isVisible();
            if (!isVisible) continue;
            
            // Additional validation: must have reasonable size (not a tiny icon)
            const box = await element.boundingBox();
            if (!box || box.width < 150 || box.height < 150) continue;
            
            // Success! Click this element
            return await this.executeClickOnElement(element, `selector: ${selector}`);
          } catch {}
        }
      } catch {}
    }

    console.log(`   🔍 Strategy 2: Role-based semantic search...`);
    
    // STRATEGY 2: Accessibility-based (role="link" with listing-like text)
    try {
      const links = await this.page.getByRole('link').all();
      for (const link of links) {
        try {
          const text = await link.textContent();
          const href = await link.getAttribute('href');
          
          // Look for listing indicators in text or href
          const listingPatterns = /(\$|€|£|\d+\/night|rating|reviews?|bedroom|bath|rooms\/\d+|listing|product)/i;
          
          if ((text && listingPatterns.test(text)) || (href && (href.includes('/rooms/') || href.includes('/listing/')))) {
            const isVisible = await link.isVisible();
            if (!isVisible) continue;
            
            const box = await link.boundingBox();
            if (!box || box.width < 150 || box.height < 150) continue;
            
            return await this.executeClickOnElement(link, 'role-based match');
          }
        } catch {}
      }
    } catch {}

    console.log(`   🔍 Strategy 3: GPT-4o DOM analysis (smart fallback)...`);
    
    // STRATEGY 3: AI-powered selector generation
    const aiSelector = await this.generateListingSelectorWithAI();
    if (aiSelector) {
      try {
        const element = this.page.locator(aiSelector).first();
        const isVisible = await element.isVisible();
        if (isVisible) {
          return await this.executeClickOnElement(element, `AI-generated: ${aiSelector}`);
        }
      } catch {}
    }

    console.log(`   ✗ All strategies failed - no clickable listings found`);
    return false;
  }

  /**
   * Execute click on an element with proper animation and error handling
   */
  private async executeClickOnElement(element: any, description: string): Promise<boolean> {
    try {
      await element.scrollIntoViewIfNeeded({ timeout: 5000 });
      await this.page!.waitForTimeout(300);

      // Get position and move cursor
      const box = await element.boundingBox();
      if (box) {
        const targetX = box.x + box.width / 2;
        const targetY = box.y + box.height / 2;
        await this.moveCursorTo(targetX, targetY, 25);
        await this.page!.waitForTimeout(400);
      }

      // Try multiple click methods
      try {
        await element.click({ timeout: 5000, force: false });
      } catch {
        // Fallback to JavaScript click
        await element.evaluate((el: any) => el.click());
      }

      await this.page!.waitForTimeout(2000);

      // Dismiss any popups on the new page
      await this.dismissPopups();

      // Re-inject cursor on new page
      await this.injectCursorOverlay();
      await this.moveCursorTo(
        Math.floor(Math.random() * 1500) + 200,
        Math.floor(Math.random() * 600) + 200,
        20
      );

      console.log(`   ✓ Clicked listing (${description})`);
      return true;
    } catch (error: any) {
      console.log(`   ✗ Click execution failed: ${error.message}`);
      return false;
    }
  }

  /**
   * Use GPT-4o to analyze the page and generate a selector for listings
   */
  private async generateListingSelectorWithAI(): Promise<string | null> {
    if (!this.page) return null;

    try {
      // Get DOM snapshot of visible links
      const linkData = await this.page.evaluate(() => {
        // Browser context - document and DOM APIs are available here
        // @ts-ignore
        const doc: any = typeof document !== 'undefined' ? document : null;
        if (!doc) return [];
        const links = Array.from(doc.querySelectorAll('a[href]'));
        return links.slice(0, 20).map((link: any, idx: number) => {
          const rect = link.getBoundingClientRect();
          return {
            index: idx,
            href: link.getAttribute('href'),
            text: link.textContent?.trim().slice(0, 100),
            classes: link.className,
            dataTestId: link.getAttribute('data-testid'),
            hasImage: link.querySelector('img') !== null,
            width: rect.width,
            height: rect.height,
            visible: rect.width > 0 && rect.height > 0
          };
        }).filter((l: any) => l.visible && l.width > 100 && l.height > 100);
      });

      if (linkData.length === 0) return null;

      // Ask GPT-4o to identify the listing link
      const prompt = `Analyze these links from a webpage and identify which one is most likely a LISTING/PRODUCT/CARD (e.g., Airbnb property, e-commerce product, rental listing).

Links:
${JSON.stringify(linkData, null, 2)}

Return ONLY a JSON object with the index of the most likely listing:
{"index": <number>, "reason": "<brief explanation>"}`;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',  // Faster, cheaper for this task
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 100,
        temperature: 0.3
      });

      const result = response.choices[0].message.content?.trim();
      if (!result) return null;

      const parsed = JSON.parse(result);
      const selectedLink = linkData[parsed.index];
      
      console.log(`   🤖 AI identified listing: ${selectedLink.href} (${parsed.reason})`);

      // Generate selector based on AI's choice
      if (selectedLink.dataTestId) {
        return `a[data-testid="${selectedLink.dataTestId}"]`;
      } else if (selectedLink.href.includes('/rooms/')) {
        return `a[href*="${selectedLink.href.split('?')[0].slice(0, 20)}"]`;
      } else {
        return `a:nth-of-type(${parsed.index + 1})`;
      }

    } catch (error: any) {
      console.log(`   ⚠️  AI selector generation failed: ${error.message}`);
      return null;
    }
  }

  /**
   * Click element with smooth cursor movement
   */
  private async smoothClick(selector: string, description: string = ''): Promise<boolean> {
    if (!this.page) return false;

    try {
      // Try multiple selector strategies
      const selectors = [
        selector,
        `a:has-text("${description}")`,
        `button:has-text("${description}")`,
        `[role="button"]:has-text("${description}")`,
        `text=${description}`
      ];

      let element = null;
      let foundSelector = null;

      for (const sel of selectors) {
        try {
          const locator = this.page.locator(sel).first();
          const count = await locator.count();
          if (count > 0) {
            const isVisible = await locator.isVisible().catch(() => false);
            if (isVisible) {
              element = locator;
              foundSelector = sel;
              break;
            }
          }
        } catch {}
      }

      if (!element) {
        console.log(`   ✗ Element not found: ${description || selector}`);
        return false;
      }

      await element.scrollIntoViewIfNeeded({ timeout: 5000 });
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

      // Try click with multiple methods
      try {
      await element.click({ timeout: 5000, force: false });
    } catch {
      // Fallback to JavaScript click
      await element.evaluate((el: any) => el.click());
    }

    await this.page.waitForTimeout(1000);

    // Dismiss any popups that appeared after click
    await this.dismissPopups();

      // Re-inject cursor after navigation
      await this.injectCursorOverlay();
      await this.moveCursorTo(
        Math.floor(Math.random() * 1500) + 200,
        Math.floor(Math.random() * 600) + 200,
        20
      );

      console.log(`   ✓ Clicked: ${description || foundSelector}`);
      return true;

    } catch (error: any) {
      console.log(`   ✗ Click failed: ${description || selector} - ${error.message}`);
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
   * Record narration with timestamp - WITH AGGRESSIVE CLEANING
   */
  private recordNarration(text: string, action: string): void {
    const timestamp = (Date.now() - this.startTime) / 1000;

    // CRITICAL: Clean the narration text AGAIN before recording
    const cleanedText = this.cleanNarrationText(text);
    
    console.log(`   🎤 Recording narration: "${cleanedText}"`);

    this.narrationLog.push({
      timestamp,
      action,
      narration: cleanedText
    });
  }

  /**
   * Clean narration text - remove ALL instructions and meta-commentary
   */
  private cleanNarrationText(text: string): string {
    if (!text) return '';

    // Forbidden phrases that indicate instructions (NOT narration)
    const forbiddenPhrases = [
      // Direct instructions
      'now talk about', 'now discuss', 'now explain', 'now describe',
      'transition to', 'move to', 'go to', 'navigate to',
      'click on', 'click here', 'click the',
      'show the', 'display the', 'present the',
      'highlight', 'demonstrate', 'illustrate',
      
      // Stage directions
      'scene', 'slide', 'node', 'storyboard',
      'speaker notes', 'content', 'title card',
      'cta', 'call to action',
      
      // Meta-commentary
      'for this section', 'in this part', 'this slide',
      'the goal is', 'we need to', 'make sure to',
      'focus on', 'emphasize',
      
      // Common instruction patterns
      'context:', 'goal:', 'task:', 'objective:',
      'remember to', 'don\'t forget',
    ];

    let cleaned = text.toLowerCase();

    // Remove any sentence containing forbidden phrases
    const sentences = text.split(/[.!?]+/);
    const validSentences = sentences.filter(sentence => {
      const lowerSentence = sentence.toLowerCase().trim();
      
      // Skip empty sentences
      if (lowerSentence.length < 5) return false;
      
      // Skip sentences with forbidden phrases
      const hasForbidden = forbiddenPhrases.some(phrase => 
        lowerSentence.includes(phrase)
      );
      
      return !hasForbidden;
    });

    // Join valid sentences
    let result = validSentences.join('. ').trim();

    // Ensure proper punctuation
    if (result && !result.match(/[.!?]$/)) {
      result += '.';
    }

    // If everything was filtered out, return a safe default
    if (!result || result.length < 10) {
      return "Here we can see the platform's key features and capabilities.";
    }

    return result;
  }

  /**
   * Generate voice-over audio from script using OpenAI TTS
   * Enhanced for more natural, engaging delivery!
   */
  private async generateVoiceOver(script: string, voice: string): Promise<string> {
    console.log(`🎙️  Generating voice-over...`);

    // CRITICAL: Clean the script one more time before sending to TTS
    const cleanedScript = this.cleanNarrationText(script);
    
    console.log(`   📝 TTS Input (first 200 chars): "${cleanedScript.substring(0, 200)}..."`);
    console.log(`   📏 Script length: ${cleanedScript.length} characters`);

    try {
      // Use TTS-1-HD for higher quality audio (more natural and engaging)
      const mp3 = await this.openai.audio.speech.create({
        model: 'tts-1-hd',  // HD model for better quality!
        voice: voice as any,
        input: cleanedScript,  // Use cleaned script!
        speed: 1.05  // Slightly faster for more energetic delivery (1.05 = 5% faster)
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
   * Save demo results and merge audio with video
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
      console.log(`   ✓ Raw video saved: ${videoPath}`);
    }

    // Merge audio with video if both exist - IMPROVED VERSION
    let finalVideoPath = videoPath;
    if (videoPath && audioPath && fs.existsSync(videoPath) && fs.existsSync(audioPath)) {
      try {
        const outputPath = path.join(this.videosDir, `demo_with_audio_${timestamp}.mp4`);
        console.log(`   🎵 Merging audio with video...`);
        console.log(`      Video: ${videoPath}`);
        console.log(`      Audio: ${audioPath}`);
        console.log(`      Output: ${outputPath}`);

        // Simplified FFmpeg command that works reliably
        // Convert to MP4 for better compatibility
        const ffmpegCommand = `ffmpeg -i "${videoPath}" -i "${audioPath}" -c:v libx264 -c:a aac -strict experimental -shortest -y "${outputPath}"`;

        console.log(`      Command: ${ffmpegCommand}`);

        const { stdout, stderr } = await execAsync(ffmpegCommand, {
          maxBuffer: 10 * 1024 * 1024,
          timeout: 60000 // 60 second timeout
        });

        if (stderr) {
          console.log(`      FFmpeg output: ${stderr.substring(0, 200)}...`);
        }

        if (fs.existsSync(outputPath)) {
          const stats = fs.statSync(outputPath);
          finalVideoPath = outputPath;
          console.log(`   ✅ Video with audio saved: ${finalVideoPath} (${(stats.size / 1024 / 1024).toFixed(2)} MB)`);

          // Clean up raw video if merge succeeded
          try {
            if (videoPath !== outputPath && fs.existsSync(videoPath)) {
              fs.unlinkSync(videoPath);
              console.log(`   🗑️  Cleaned up raw video`);
            }
          } catch (e) {
            console.log(`   ⚠️  Could not delete raw video: ${e}`);
          }
        } else {
          console.error(`   ❌ Output file not created!`);
          console.warn(`   ⚠️  Audio merge failed, using video without audio`);
        }
      } catch (error: any) {
        console.error(`   ❌ Failed to merge audio:`);
        console.error(`      Error: ${error.message}`);
        console.error(`      Stderr: ${error.stderr || 'N/A'}`);
        console.error(`      Stdout: ${error.stdout || 'N/A'}`);
        console.warn(`   ℹ️  Using video without audio.`);
        console.warn(`   ℹ️  Install FFmpeg: brew install ffmpeg (Mac) or apt install ffmpeg (Linux)`);
      }
    } else {
      if (!videoPath) console.warn(`   ⚠️  No video path`);
      if (!audioPath) console.warn(`   ⚠️  No audio path`);
      if (videoPath && !fs.existsSync(videoPath)) console.warn(`   ⚠️  Video file not found: ${videoPath}`);
      if (audioPath && !fs.existsSync(audioPath)) console.warn(`   ⚠️  Audio file not found: ${audioPath}`);
    }

    return {
      videoPath: finalVideoPath,
      audioPath,
      scriptPath,
      duration,
      actionsCount: this.actionsTaken.length,
      timestamp
    };
  }

  /**
   * Generate VISION-BASED narration - AI describes what it ACTUALLY SEES
   * This makes narration realistic by describing the current screenshot!
   */
  private async generateLiveNarration(node: StoryNode): Promise<string> {
    if (!this.page) return 'Let me show you this feature.';

    try {
      // Take a fresh screenshot of what's currently visible
      const screenshot = await this.page.screenshot({ type: 'png' });
      const screenshotB64 = screenshot.toString('base64');
      const currentUrl = await this.page.url();

      const prompt = `You are a professional product demo narrator. Your job is to describe what's ON THE SCREEN to viewers, NOT read storyboard instructions.

🚫 CRITICAL - DO NOT SAY THESE WORDS:
- "Transition", "Slide", "Highlight", "Node", "Storyboard", "Scene"
- "Click here", "Navigate to", "Show", "Display"
- Any technical/behind-the-scenes terminology
- Any instructions or stage directions

✅ INSTEAD, NARRATE LIKE A HUMAN PRESENTER:
- Describe what viewers can SEE on screen
- Talk about features, benefits, and user value
- Sound enthusiastic and natural
- Use "we", "you", "here's", "check out", "notice how"

CONTEXT (for your understanding only - DON'T read this out loud):
- This is showing: ${node.title}
- Goal: ${node.speakerNotes || node.content}
- URL: ${currentUrl}

YOUR JOB: Look at the screenshot and create natural voice-over as if you're presenting live to an audience.

🎯 NARRATION STYLE:
Tone: Enthusiastic, conversational, and engaging!
- Use contractions: "Let's", "Here's", "You'll", "It's"
- Show excitement: "Check this out!", "Perfect!", "Love how..."
- Be specific about features: "powerful search", "instant results", "beautiful design"
- Create interest: "Notice how...", "What's great is..."
- Length: 20-30 words (natural speech rhythm)

✅ GOOD EXAMPLES (natural presenter style):

Homepage:
"Welcome to Airbnb! Here's the search feature where you can find your perfect stay, and below you'll see featured listings with prices and ratings."

Search results:
"Perfect! Look at all these amazing options - each one shows location, price, and guest reviews to help you decide."

Property details:
"Now we're viewing a specific property. You can see all the photos, pricing, amenities, and reviews - everything you need in one place!"

After interaction:
"Let's try a search. Notice how quickly it finds relevant results with all the key details you care about!"

🎬 YOUR NARRATION (20-30 words, presenter style, NO storyboard jargon):`;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o',  // GPT-4o for vision
        messages: [
          {
            role: 'system',
            content: `You are a professional product demo presenter speaking LIVE to an audience. 

CRITICAL RULES:
1. NEVER mention technical terms like "transition", "slide", "highlight", "storyboard", "scene"
2. NEVER give instructions like "click here", "navigate to", "show"
3. ALWAYS describe what viewers can SEE on screen
4. ALWAYS sound natural, enthusiastic, and conversational
5. Talk TO the audience, not ABOUT the presentation

You're not reading a script - you're presenting a product demo!`
          },
          {
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              {
                type: 'image_url',
                image_url: {
                  url: `data:image/png;base64,${screenshotB64}`,
                  detail: 'low'  // Low detail = faster generation
                }
              }
            ]
          }
        ],
        max_tokens: 100,
        temperature: 0.8  // Higher temp = more creative and varied language
      });

      let narration = response.choices[0].message.content?.trim() || 'Here we can see the main features of this platform.';
      
      // Use the centralized cleaning function for consistency
      const cleanNarration = this.cleanNarrationText(narration);
      
      console.log(`   🎬 Scene narration: "${cleanNarration}"`);
      return cleanNarration;

    } catch (error: any) {
      console.warn(`   ⚠️  Live narration failed:`, error.message);
      // Fallback - but NEVER use raw speaker notes (they contain instructions!)
      return "Here we can see the platform's powerful features and capabilities.";
    }
  }

  /**
   * Cleanup browser resources
   */
  private async cleanup(): Promise<void> {
    console.log('🧹 Cleaning up browser...');

    try {
      // Close page first to finalize video
      if (this.page) {
        console.log('   Closing page...');
        await this.page.close();
        this.page = null;
      }

      // Close context to save video
    if (this.context) {
        console.log('   Closing context (finalizing video)...');
      await this.context.close();
        this.context = null;
    }

      // Close browser
    if (this.browser) {
        console.log('   Closing browser...');
      await this.browser.close();
        this.browser = null;
      }

      console.log('   ✓ Cleanup complete');
    } catch (error: any) {
      console.error('   ⚠️  Cleanup error:', error.message);
    }
  }
}
