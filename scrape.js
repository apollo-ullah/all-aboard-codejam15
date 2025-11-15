import puppeteer from "puppeteer";
import dotenv from "dotenv";

dotenv.config(); // Load .env variables

async function scrape() {
  const token = process.env.BROWSER_CASH_TOKEN;

  if (!token) {
    console.error("Missing BROWSER_CASH_TOKEN in .env");
    process.exit(1);
  }

  // Build the Quickconnect URL dynamically
  const cdpUrl = `wss://qc.tera.space/connect?token=${token}`;

  console.log("Connecting to remote browser...");
  const browser = await puppeteer.connect({
    browserWSEndpoint: cdpUrl,
    defaultViewport: null,
  });

  const pages = await browser.pages();
  const page = pages[0] || (await browser.newPage());

  console.log("Navigating to example.com...");
  await page.goto("https://huggingface.co/datasets/builddotai/Egocentric-10K", {
    waitUntil: "networkidle0",
    timeout: 60000,
  });

  console.log("Extracting visible text...");
  const text = await page.evaluate(() => document.body.innerText);

  console.log("\n===== SCRAPED CONTENT =====\n");
  console.log(text);
  console.log("\n===========================\n");

  await browser.close();
}

scrape().catch((err) => {
  console.error("Scrape failed:", err);
});
