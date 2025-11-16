"""
Smart AI Demo Agent v2.1
FIXES:
- Centered fullscreen window
- Removed screen zoom glitches
- Continuous cursor movement to simulate human presenter
- Always-visible cursor with natural pointing motions
"""

import json
import time
import base64
import random
from pathlib import Path
from typing import Dict, List, Optional
from datetime import datetime
from playwright.sync_api import sync_playwright, Page, Browser, BrowserContext
import openai


class SmartDemoAgent:
    """
    AI agent that demonstrates websites with human-like cursor movements.
    """
    
    def __init__(
        self,
        company_data_path: str,
        openai_api_key: str,
        video_dir: str = "demo_videos",
        log_dir: str = "demo_logs"
    ):
        """Initialize the smart demo agent."""
        self.video_dir = Path(video_dir)
        self.log_dir = Path(log_dir)
        self.video_dir.mkdir(exist_ok=True)
        self.log_dir.mkdir(exist_ok=True)
        
        # Load company data
        with open(company_data_path, 'r') as f:
            self.company_data = json.load(f)
        
        # Initialize OpenAI
        self.client = openai.OpenAI(api_key=openai_api_key)
        self.narration_log = []
        
        # Playwright components
        self.playwright = None
        self.browser: Optional[Browser] = None
        self.context: Optional[BrowserContext] = None
        self.page: Optional[Page] = None
        
        # Demo state
        self.start_time = None
        self.actions_taken = []
        self.current_mouse_x = 100
        self.current_mouse_y = 100
        
        # Enhanced cursor with better visibility
        self.cursor_script = """
        (() => {
            if (window.customCursor) {
                window.customCursor.remove();
            }
            
            const cursor = document.createElement('div');
            cursor.id = 'custom-cursor';
            cursor.style.cssText = `
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
            `;
            document.body.appendChild(cursor);
            
            window.customCursor = cursor;
            window.updateCursorPosition = (x, y) => {
                cursor.style.left = (x - 14) + 'px';
                cursor.style.top = (y - 14) + 'px';
            };
            
            // Initial position
            window.updateCursorPosition(100, 100);
        })();
        """
        
    def start_browser(self):
        """Start browser in centered fullscreen."""
        self.playwright = sync_playwright().start()
        
        # Launch with centered window
        self.browser = self.playwright.chromium.launch(
            headless=False,
            args=[
                '--start-maximized',
                '--disable-blink-features=AutomationControlled',
                '--disable-infobars',
                '--disable-web-security'
            ]
        )
        
        # Create context with no viewport to use full window size
        self.context = self.browser.new_context(
            record_video_dir=str(self.video_dir),
            record_video_size={"width": 1920, "height": 1080},
            no_viewport=True,  # Use full window size, no artificial viewport
            user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        )
        
        # Add stealth
        self.context.add_init_script("""
            Object.defineProperty(navigator, 'webdriver', {
                get: () => undefined
            });
        """)
        
        self.page = self.context.new_page()
        self.page.set_default_timeout(30000)
        
        # Make window fullscreen and centered programmatically
        self.page.evaluate("""
            () => {
                window.moveTo(0, 0);
                window.resizeTo(screen.width, screen.height);
            }
        """)
        
        print(f"🚀 Browser started in fullscreen for {self.company_data['company_name']}")
        
    def inject_cursor(self):
        """Inject custom cursor overlay."""
        try:
            self.page.evaluate(self.cursor_script)
            # Set initial cursor position
            self.page.evaluate(f"window.updateCursorPosition({self.current_mouse_x}, {self.current_mouse_y})")
            print("   ✓ Cursor overlay injected")
        except Exception as e:
            print(f"   ⚠️  Cursor injection failed: {e}")
    
    def move_cursor_to(self, x: float, y: float, steps: int = 30):
        """
        Move cursor smoothly from current position to target.
        Updates both real mouse and visual cursor overlay.
        """
        start_x = self.current_mouse_x
        start_y = self.current_mouse_y
        
        for i in range(steps + 1):
            t = i / steps
            # Easing function for natural movement
            eased_t = t * t * (3 - 2 * t)  # Smoothstep
            
            new_x = start_x + (x - start_x) * eased_t
            new_y = start_y + (y - start_y) * eased_t
            
            # Move real mouse
            try:
                self.page.mouse.move(new_x, new_y)
            except:
                pass
            
            # Update visual cursor
            try:
                self.page.evaluate(f"window.updateCursorPosition && window.updateCursorPosition({new_x}, {new_y})")
            except:
                pass
            
            self.current_mouse_x = new_x
            self.current_mouse_y = new_y
            
            time.sleep(0.015)  # Smooth 60fps movement
    
    def idle_cursor_movement(self, duration: float = 1.0):
        """
        Move cursor naturally while talking/waiting (like a human presenter pointing).
        """
        start_time = time.time()
        
        while time.time() - start_time < duration:
            # Small random movements around current position
            offset_x = random.randint(-30, 30)
            offset_y = random.randint(-20, 20)
            
            target_x = max(100, min(1820, self.current_mouse_x + offset_x))
            target_y = max(100, min(980, self.current_mouse_y + offset_y))
            
            self.move_cursor_to(target_x, target_y, steps=15)
            time.sleep(0.2)
    
    def get_screenshot_base64(self) -> str:
        """Get current page screenshot."""
        screenshot = self.page.screenshot()
        return base64.b64encode(screenshot).decode('utf-8')
    
    def ai_decide_next_action(self, elapsed_time: float) -> Optional[Dict]:
        """Use GPT-4 Vision to analyze page and decide next action."""
        if elapsed_time > 110:
            return None
        
        screenshot_b64 = self.get_screenshot_base64()
        
        page_info = self.page.evaluate("""
            () => {
                const info = {
                    url: window.location.href,
                    title: document.title,
                    searchInputs: [],
                    buttons: [],
                    links: []
                };
                
                // Find search inputs
                document.querySelectorAll('input[type="search"], input[type="text"]').forEach((input, i) => {
                    if (i < 3) {
                        const rect = input.getBoundingClientRect();
                        if (rect.width > 0 && rect.height > 0) {
                            info.searchInputs.push({
                                placeholder: input.placeholder || input.name || 'search',
                                visible: true
                            });
                        }
                    }
                });
                
                // Find clickable buttons
                document.querySelectorAll('button, [role="button"]').forEach((btn, i) => {
                    if (i < 5) {
                        const text = btn.innerText.trim();
                        const rect = btn.getBoundingClientRect();
                        if (text && rect.width > 0 && rect.height > 0) {
                            info.buttons.push(text);
                        }
                    }
                });
                
                // Find interesting links
                document.querySelectorAll('a[href]').forEach((link, i) => {
                    if (i < 10) {
                        const text = link.innerText.trim();
                        const rect = link.getBoundingClientRect();
                        if (text && text.length > 2 && text.length < 50 && rect.width > 0) {
                            info.links.push(text);
                        }
                    }
                });
                
                return info;
            }
        """)
        
        prompt = f"""You are an expert salesman demonstrating {self.company_data['company_name']}'s website.

Company Info: {self.company_data['description']}
Time Elapsed: {elapsed_time:.1f}s / 120s total

Current Page:
- URL: {page_info['url']}
- Title: {page_info['title']}
- Search Inputs: {page_info['searchInputs']}
- Buttons: {page_info['buttons'][:3]}
- Links: {page_info['links'][:5]}

Actions Already Taken: {self.actions_taken}

As a salesman, decide the NEXT BEST action to showcase this website's value. Be DYNAMIC and INTERACTIVE:
- Search for products/features
- Click on items to show details
- Navigate to different sections
- Keep each section brief (5-10 seconds)

Respond in JSON:
{{
    "action_type": "search|click_link|click_button|scroll|wait",
    "target": "what to click or search term",
    "reason": "why this showcases value",
    "narration": "one sentence explaining this to viewer (max 20 words)"
}}
"""

        try:
            response = self.client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {
                        "role": "user",
                        "content": [
                            {"type": "text", "text": prompt},
                            {
                                "type": "image_url",
                                "image_url": {
                                    "url": f"data:image/png;base64,{screenshot_b64}",
                                    "detail": "low"
                                }
                            }
                        ]
                    }
                ],
                max_tokens=200,
                temperature=0.7
            )
            
            result_text = response.choices[0].message.content.strip()
            if "```json" in result_text:
                result_text = result_text.split("```json")[1].split("```")[0]
            elif "```" in result_text:
                result_text = result_text.split("```")[1].split("```")[0]
            
            decision = json.loads(result_text)
            return decision
            
        except Exception as e:
            print(f"⚠️  AI decision failed: {e}")
            if len(self.actions_taken) < 3:
                return {
                    "action_type": "scroll",
                    "target": "300",
                    "reason": "explore page",
                    "narration": "Let me show you more great features here"
                }
            return None
    
    def smooth_scroll(self, pixels: int = 400):
        """Scroll smoothly while moving cursor."""
        # Move cursor to middle of screen during scroll
        self.move_cursor_to(960, 540, steps=20)
        
        steps = 20
        for _ in range(steps):
            self.page.evaluate(f"window.scrollBy(0, {pixels/steps})")
            # Cursor follows scroll slightly
            self.current_mouse_y = max(100, min(980, self.current_mouse_y - (pixels/steps) * 0.3))
            try:
                self.page.evaluate(f"window.updateCursorPosition && window.updateCursorPosition({self.current_mouse_x}, {self.current_mouse_y})")
            except:
                pass
            time.sleep(0.03)
        
        # Small idle movement after scroll
        self.idle_cursor_movement(0.5)
    
    def smooth_click(self, selector: str, description: str = ""):
        """Click with smooth cursor movement."""
        try:
            element = self.page.locator(selector).first
            element.scroll_into_view_if_needed()
            time.sleep(0.3)
            
            # Get element position
            box = element.bounding_box()
            if box:
                target_x = box['x'] + box['width'] / 2
                target_y = box['y'] + box['height'] / 2
                
                # Move cursor to element smoothly
                self.move_cursor_to(target_x, target_y, steps=25)
                
                # Hover for a moment
                time.sleep(0.4)
            
            element.click()
            time.sleep(0.6)
            
            # Re-inject cursor after navigation
            self.inject_cursor()
            
            # Move cursor to new position on new page
            self.move_cursor_to(random.randint(200, 1700), random.randint(200, 800), steps=20)
            
            print(f"   ✓ Clicked: {description or selector}")
            return True
            
        except Exception as e:
            print(f"   ✗ Click failed: {e}")
            return False
    
    def perform_search(self, query: str):
        """Perform a search with cursor movements."""
        try:
            search_selectors = [
                'input[type="search"]',
                'input[name*="search" i]',
                'input[placeholder*="search" i]',
                'input[type="text"]'
            ]
            
            for selector in search_selectors:
                if self.page.locator(selector).count() > 0:
                    # Click on search box with cursor movement
                    self.smooth_click(selector, "search box")
                    
                    # Type query
                    for char in query:
                        self.page.keyboard.type(char)
                        time.sleep(0.08)
                    
                    time.sleep(0.5)
                    self.page.keyboard.press("Enter")
                    time.sleep(2)
                    
                    # Re-inject cursor and position it
                    self.inject_cursor()
                    self.move_cursor_to(random.randint(300, 1600), random.randint(300, 700), steps=20)
                    
                    print(f"   ✓ Searched for: {query}")
                    return True
            
            return False
            
        except Exception as e:
            print(f"   ✗ Search failed: {e}")
            return False
    
    def narrate(self, text: str, action: str):
        """Log narration and move cursor naturally while narrating."""
        timestamp = time.time() - self.start_time if self.start_time else 0
        
        self.narration_log.append({
            "timestamp": timestamp,
            "time_formatted": self._format_time(timestamp),
            "action": action,
            "narration": text
        })
        
        print(f"\n🎤 [{self._format_time(timestamp)}] {text}")
        
        # Move cursor naturally while narrator is speaking
        duration = len(text) * 0.05  # Estimate speaking time
        self.idle_cursor_movement(min(duration, 2.0))
    
    def run_demo(self):
        """Run the interactive demo."""
        try:
            self.start_browser()
            self.start_time = time.time()
            
            # Opening
            self.narrate(
                f"Welcome! Let me show you {self.company_data['company_name']} and its amazing features!",
                "introduction"
            )
            
            # Navigate
            print(f"\n📍 Navigating to {self.company_data['website_url']}...")
            try:
                self.page.goto(self.company_data['website_url'], wait_until='domcontentloaded', timeout=30000)
            except:
                self.page.goto(self.company_data['website_url'], timeout=30000)
            
            time.sleep(2)
            
            # Inject cursor overlay
            self.inject_cursor()
            
            # Initial cursor position
            self.move_cursor_to(400, 300, steps=20)
            self.idle_cursor_movement(1.0)
            
            # Main demo loop
            while True:
                elapsed = time.time() - self.start_time
                
                if elapsed > 115:
                    break
                
                # AI decides next action
                decision = self.ai_decide_next_action(elapsed)
                
                if not decision:
                    break
                
                # Narrate (cursor moves naturally during narration)
                self.narrate(decision.get('narration', 'Continuing demo'), decision.get('action_type', 'action'))
                
                # Execute action
                action_type = decision.get('action_type', 'scroll')
                target = decision.get('target', '')
                
                if action_type == 'search' and target:
                    self.perform_search(target)
                    self.actions_taken.append(f"searched:{target}")
                    
                elif action_type == 'click_link' and target:
                    success = self.smooth_click(f"text={target}", target)
                    if success:
                        self.actions_taken.append(f"clicked:{target}")
                    else:
                        self.smooth_scroll(300)
                        
                elif action_type == 'click_button' and target:
                    success = self.smooth_click(f"button:has-text('{target}')", target)
                    if success:
                        self.actions_taken.append(f"clicked:{target}")
                    else:
                        self.smooth_scroll(300)
                        
                elif action_type == 'scroll':
                    pixels = int(target) if target.isdigit() else 400
                    self.smooth_scroll(pixels)
                    self.actions_taken.append("scrolled")
                    
                elif action_type == 'wait':
                    self.idle_cursor_movement(2.0)
                
                # Small idle movement between actions
                self.idle_cursor_movement(0.8)
            
            # Closing with cursor movement
            self.narrate(
                f"That's {self.company_data['company_name']}! Hope you enjoyed this quick tour!",
                "conclusion"
            )
            self.idle_cursor_movement(2.0)
            
            print("\n✨ Demo complete!")
            
        finally:
            self._cleanup()
    
    def _format_time(self, seconds: float) -> str:
        """Format timestamp."""
        mins = int(seconds // 60)
        secs = seconds % 60
        return f"{mins:02d}:{secs:06.3f}"
    
    def _cleanup(self):
        """Save outputs and close."""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        company_slug = self.company_data['company_name'].lower().replace(' ', '_')
        log_path = self.log_dir / f"narration_{company_slug}_{timestamp}.json"
        
        with open(log_path, 'w') as f:
            json.dump({
                "company": self.company_data['company_name'],
                "website": self.company_data['website_url'],
                "total_duration": time.time() - self.start_time if self.start_time else 0,
                "actions_taken": self.actions_taken,
                "narrations": self.narration_log
            }, f, indent=2)
        
        print(f"\n📝 Narration log saved: {log_path}")
        
        video_path = None
        if self.page and self.page.video:
            video_path = self.page.video.path()
        
        if self.context:
            self.context.close()
        if self.browser:
            self.browser.close()
        if self.playwright:
            self.playwright.stop()
        
        if video_path:
            print(f"🎥 Video saved: {video_path}")
        else:
            print("⚠️  Video path not available - check demo_videos folder manually")


def main():
    """Run demo."""
    import sys
    
    if len(sys.argv) < 2:
        print("Usage: python smart_agent.py <company_json>")
        sys.exit(1)
    
    api_key = "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"
    
    print("="*70)
    print("  🎬 SMART AI DEMO AGENT v2.1")
    print("="*70)
    print("\n✨ Improvements:")
    print("  ✓ Centered fullscreen window")
    print("  ✓ No zoom glitches")
    print("  ✓ Always-visible cursor with natural movement")
    print("  ✓ Cursor moves continuously like human presenter")
    print("  ✓ Points at content while narrating")
    print("\n")
    
    agent = SmartDemoAgent(
        company_data_path=sys.argv[1],
        openai_api_key=api_key
    )
    
    agent.run_demo()


if __name__ == "__main__":
    main()
