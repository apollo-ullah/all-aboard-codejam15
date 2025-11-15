import puppeteer from "puppeteer";
import dotenv from "dotenv";
import url from "url";

dotenv.config();

const START_URL = "https://www.scrapethissite.com";
const MAX_PAGES = 10; // prevent infinite crawling

// ------------------------
// Connect to Browser Cash
// ------------------------
async function createBrowser() {
  const token = process.env.BROWSER_CASH_TOKEN;

  if (!token) {
    console.error("Missing BROWSER_CASH_TOKEN in .env");
    process.exit(1);
  }

  const cdpUrl = `wss://qc.tera.space/connect?token=${token}`;

  console.log("Connecting to remote browser...");
  return await puppeteer.connect({
    browserWSEndpoint: cdpUrl,
    defaultViewport: null,
  });
}

// ------------------------------------
// Extract all same-domain internal links
// ------------------------------------
function extractLinks(baseUrl, anchors) {
  const baseDomain = new URL(baseUrl).hostname;

  const links = anchors
    .map((a) => a.href)
    .filter((href) => href && href.startsWith("http"))
    .filter((href) => new URL(href).hostname === baseDomain);

  return links;
}

// -----------------------------
// Scrape + return text + links
// -----------------------------
async function scrapePage(page, link) {
  console.log(`\n=== Visiting: ${link} ===\n`);

  await page.goto(link, {
    waitUntil: "domcontentloaded",
    timeout: 90000, // give more time
  });

  const text = await page.evaluate(() => document.body.innerText);
  console.log(text.slice(0, 400)); // only print first 400 chars

  // Extract links
  const anchors = await page.$$eval("a", (as) =>
    as.map((a) => ({ href: a.href }))
  );

  const links = extractLinks(link, anchors);

  console.log(`\nFound ${links.length} internal links.\n`);

  return { text, links };
}

// -----------------------------
// BFS CRAWLER
// -----------------------------
async function bfsCrawler() {
  const browser = await createBrowser();
  const page = (await browser.pages())[0] || (await browser.newPage());

  const visited = new Set();
  const queue = [START_URL];

  while (queue.length > 0 && visited.size < MAX_PAGES) {
    const nextUrl = queue.shift();

    if (visited.has(nextUrl)) continue;
    visited.add(nextUrl);

    try {
      const { links } = await scrapePage(page, nextUrl);

      // Add unseen links to queue
      for (const link of links) {
        if (!visited.has(link)) {
          queue.push(link);
        }
      }
    } catch (err) {
      console.log(`❌ Failed to scrape ${nextUrl}:`, err.message);
      continue;
    }
  }

  console.log("\nBFS Complete. Visited pages:");
  console.log([...visited]);

  await browser.close();
}

bfsCrawler();
