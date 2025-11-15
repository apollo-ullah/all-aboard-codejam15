import puppeteer from "puppeteer";
import dotenv from "dotenv";

dotenv.config(); // Load .env variables

const START_URLS = [
  "https://www.scrapethissite.com",
  "https://www.scrapethissite.com/pages/simple/",
  "https://www.scrapethissite.com/pages/forms/",
];

async function createBrowser() {
  const token = process.env.BROWSER_CASH_TOKEN;

  if (!token) {
    console.error("Missing BROWSER_CASH_TOKEN in .env");
    process.exit(1);
  }

  const cdpUrl = `wss://qc.tera.space/connect?token=${token}`;

  console.log("Connecting to remote browser...");
  const browser = await puppeteer.connect({
    browserWSEndpoint: cdpUrl,
    defaultViewport: null,
  });

  return browser;
}

// Scrape a single page, but only if not visited yet
async function scrapePage(browser, url, visited) {
  if (visited.has(url)) {
    console.log(`Skipping already-scraped page: ${url}`);
    return;
  }

  console.log(`\n=== Navigating to ${url} ===`);
  const pages = await browser.pages();
  const page = pages[0] || (await browser.newPage());

  await page.goto(url, {
    waitUntil: "networkidle0",
    timeout: 60000,
  });

  visited.add(url); // mark as scraped

  const text = await page.evaluate(() => document.body.innerText);
  console.log(`\n===== SCRAPED CONTENT for ${url} =====\n`);
  console.log(text.slice(0, 500)); // print first 500 chars so it’s not insane
  console.log("\n======================================\n");
}

async function main() {
  const browser = await createBrowser();
  const visited = new Set(); // track which URLs we’ve already scraped

  try {
    for (const url of START_URLS) {
      await scrapePage(browser, url, visited);
    }

    console.log("\nVisited pages this run:", [...visited]);
  } catch (err) {
    console.error("Scrape failed:", err);
  } finally {
    await browser.close();
  }
}

main();
