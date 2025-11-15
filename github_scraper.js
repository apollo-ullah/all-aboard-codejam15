// ===============================
// github_scraper.js
// GitHub Smart Scraper (Agent 1)
// Browser.Cash + Puppeteer
// ===============================

import puppeteer from "puppeteer";
import dotenv from "dotenv";

dotenv.config();

// -----------------------------------------
// Connect to Browser.Cash remote browser
// -----------------------------------------
async function createBrowser() {
  const token = process.env.BROWSER_CASH_TOKEN;

  if (!token) {
    console.error("Missing BROWSER_CASH_TOKEN in .env");
    process.exit(1);
  }

  const cdpUrl = `wss://qc.tera.space/connect?token=${token}`;

  console.log("🌐 Connecting to Browser.Cash...");
  const browser = await puppeteer.connect({
    browserWSEndpoint: cdpUrl,
    defaultViewport: null,
  });

  return browser;
}

// -----------------------------------------
// Parse GitHub URL → owner + repo
// -----------------------------------------
function parseGithubUrl(repoUrl) {
  const u = new URL(repoUrl);

  if (!u.hostname.includes("github.com")) {
    throw new Error("Not a valid GitHub URL");
  }

  const parts = u.pathname.split("/").filter(Boolean); // ["owner","repo",...]
  if (parts.length < 2) {
    throw new Error("GitHub URL must be like https://github.com/owner/repo");
  }

  const [owner, repo] = parts;

  return {
    owner,
    repo,
    normalizedUrl: `https://github.com/${owner}/${repo}`,
  };
}

// -----------------------------------------
// Scrape metadata (description, topics, languages)
// -----------------------------------------
async function scrapeRepoMeta(page) {
  return await page.evaluate(() => {
    const getText = (sel) =>
      document.querySelector(sel)?.innerText.trim() || "";

    // Repo description (fallback to meta)
    const metaDesc =
      document.querySelector("meta[name='description']")?.content ||
      getText("p.f4");

    // Topics
    const topics = Array.from(document.querySelectorAll("a.topic-tag")).map(
      (a) => a.innerText.trim()
    );

    // Languages (right sidebar chips)
    const languages = Array.from(
      document.querySelectorAll("ul li a[href*='search?l=']")
    ).map((a) => {
      const spans = a.querySelectorAll("span");
      const name = spans[0]?.innerText.trim() || "";
      const percent = spans[1]?.innerText.trim() || "";
      return { name, percent };
    });

    return {
      description: metaDesc,
      topics,
      languages,
    };
  });
}

// -----------------------------------------
// Scrape README → full text + headings
// -----------------------------------------
async function scrapeReadme(page) {
  return await page.evaluate(() => {
    const article = document.querySelector("article.markdown-body");
    if (!article) return { text: "", sections: [] };

    const fullText = article.innerText.replace(/\s+\n/g, "\n").trim();

    const headingsEls = article.querySelectorAll("h1, h2, h3");
    const sections = Array.from(headingsEls).map((h) => ({
      heading: h.innerText.trim(),
      content: "", // keep simple for now; full text is in `text`
    }));

    return {
      text: fullText,
      sections,
    };
  });
}

// -----------------------------------------
// Recursively scrape full file tree
// Uses GitHub's newer DOM + turbo-frame
// -----------------------------------------
async function scrapeFullFileTree(page, owner, repo, options = {}) {
  const maxFiles = options.maxFiles ?? 300;
  const maxDirs = options.maxDirs ?? 40;

  const visitedDirs = new Set();
  const fileSet = new Set();
  const dirQueue = [`https://github.com/${owner}/${repo}`];

  while (
    dirQueue.length > 0 &&
    visitedDirs.size < maxDirs &&
    fileSet.size < maxFiles
  ) {
    const dirUrl = dirQueue.shift();
    if (visitedDirs.has(dirUrl)) continue;
    visitedDirs.add(dirUrl);

    console.log(`   📂 Visiting directory: ${dirUrl}`);
    await page.goto(dirUrl, {
      waitUntil: "domcontentloaded",
      timeout: 90000,
    });

    const { files, subdirs } = await page.evaluate(
      (owner, repo) => {
        const scope =
          document.querySelector("turbo-frame#repo-content-turbo-frame") ||
          document;

        const anchors = Array.from(scope.querySelectorAll("a[href]"));
        const filePaths = [];
        const dirUrls = [];

        const repoMarker = `/${owner}/${repo}/`;

        for (const a of anchors) {
          const hrefRaw = a.getAttribute("href");
          if (!hrefRaw) continue;

          // Normalize to path part (GitHub may use absolute or relative)
          let href;
          try {
            const url = new URL(hrefRaw, window.location.origin);
            href = url.pathname;
          } catch {
            href = hrefRaw;
          }

          if (!href.includes(repoMarker)) continue;

          // We only care about actual tree/blob entries (file/dir)
          if (!(href.includes("/blob/") || href.includes("/tree/"))) continue;

          const segments = href.split("/").filter(Boolean); // ["owner","repo","blob","branch","path","to","file"]
          const typeIndex = segments.findIndex(
            (s) => s === "blob" || s === "tree"
          );
          if (typeIndex === -1 || typeIndex + 2 > segments.length - 1) continue;

          const kind = segments[typeIndex]; // "blob" or "tree"
          const relPath = segments.slice(typeIndex + 2).join("/");
          if (!relPath) continue;

          if (kind === "blob") {
            if (!filePaths.includes(relPath)) filePaths.push(relPath);
          } else if (kind === "tree") {
            // Absolute URL for directory
            try {
              const abs = new URL(href, window.location.origin).href;
              if (!dirUrls.includes(abs)) dirUrls.push(abs);
            } catch {
              // ignore malformed
            }
          }
        }

        return { files: filePaths, subdirs: dirUrls };
      },
      owner,
      repo
    );

    for (const fp of files) {
      if (fileSet.size >= maxFiles) break;
      fileSet.add(fp);
    }

    for (const sub of subdirs) {
      if (!visitedDirs.has(sub)) dirQueue.push(sub);
    }
  }

  return Array.from(fileSet);
}

// -----------------------------------------
// Classify files into buckets using paths
// -----------------------------------------
function classifyFiles(filePaths) {
  const buckets = {
    frontend: [],
    backend: [],
    config: [],
    routes: [],
    other: [],
  };

  const match = (regex, text) => regex.test(text.toLowerCase());

  for (const path of filePaths) {
    const p = path.toLowerCase();

    const isConfig = match(
      /(package\.json|tsconfig|vite\.config|webpack\.config|next\.config|dockerfile|docker-compose|\.env)/,
      p
    );

    const isFrontend =
      match(/^(src|frontend|client|app|pages|components)\//, p) ||
      match(/\.(tsx|jsx|ts|js|css|scss|vue|svelte)$/, p);

    const isBackend =
      match(/^(server|backend|api)\//, p) || match(/\.(py|rb|go|java|cs)$/, p);

    const isRoute =
      match(/\/pages\/api\/|\/routes\/|\/api\//, p) ||
      match(/route\.(ts|js)$/, p);

    if (isConfig) buckets.config.push(path);
    else if (isRoute) buckets.routes.push(path);
    else if (isFrontend) buckets.frontend.push(path);
    else if (isBackend) buckets.backend.push(path);
    else buckets.other.push(path);
  }

  return buckets;
}

// -----------------------------------------
// Infer tech stack from README + file paths
// -----------------------------------------
function inferTechStack({ files, readme }) {
  const text = (
    (readme?.text || "") +
    " " +
    files.frontend.join(" ") +
    " " +
    files.backend.join(" ") +
    " " +
    files.config.join(" ")
  )
    .toLowerCase()
    .trim();

  const tech = {
    frontend: [],
    backend: [],
    infrastructure: [],
    database: [],
  };

  const add = (cond, bucket, label) => {
    if (cond && !bucket.includes(label)) bucket.push(label);
  };

  // Frontend
  add(/react/.test(text), tech.frontend, "React");
  add(/next\.js/.test(text), tech.frontend, "Next.js");
  add(/vue/.test(text), tech.frontend, "Vue");
  add(/svelte/.test(text), tech.frontend, "Svelte");

  // Backend
  add(/express|fastify|koa/.test(text), tech.backend, "Node.js");
  add(/django/.test(text), tech.backend, "Django");
  add(/flask/.test(text), tech.backend, "Flask");
  add(/spring/.test(text), tech.backend, "Spring Boot");

  // Infra
  add(/dockerfile|docker-compose/.test(text), tech.infrastructure, "Docker");
  add(/kubernetes|k8s/.test(text), tech.infrastructure, "Kubernetes");
  add(/vercel|netlify/.test(text), tech.infrastructure, "Serverless / Vercel");

  // DB
  add(/postgres/.test(text), tech.database, "PostgreSQL");
  add(/mongodb|mongoose/.test(text), tech.database, "MongoDB");
  add(/mysql/.test(text), tech.database, "MySQL");
  add(/sqlite/.test(text), tech.database, "SQLite");
  add(/prisma/.test(text), tech.database, "Prisma ORM");

  return tech;
}

// -----------------------------------------
// MAIN: Extract full repo context JSON
// -----------------------------------------
export async function extractRepoContext(repoUrl) {
  const { owner, repo, normalizedUrl } = parseGithubUrl(repoUrl);

  const browser = await createBrowser();
  const page = (await browser.pages())[0] || (await browser.newPage());

  console.log(`🔍 Loading repo: ${normalizedUrl}`);
  await page.goto(normalizedUrl, {
    waitUntil: "domcontentloaded",
    timeout: 90000,
  });

  // 1. Meta
  console.log("📌 Scraping metadata...");
  const meta = await scrapeRepoMeta(page);

  // 2. README
  console.log("📄 Scraping README...");
  const readme = await scrapeReadme(page);

  // 3. Full file tree (recursive)
  console.log("📁 Scraping full file tree...");
  const allFilePaths = await scrapeFullFileTree(page, owner, repo, {
    maxFiles: 400,
    maxDirs: 50,
  });

  console.log(`   ✅ Collected ${allFilePaths.length} files`);

  const files = classifyFiles(allFilePaths);

  // 4. Tech stack inference
  console.log("🧠 Inferring tech stack...");
  const techStack = inferTechStack({
    files,
    readme,
  });

  await browser.close();

  return {
    repoUrl: normalizedUrl,
    owner,
    name: repo,
    description: meta.description,
    topics: meta.topics,
    languages: meta.languages,
    techStack,
    readme,
    files,
  };
}

// -----------------------------------------
// Auto-run with a hardcoded TEST_REPO
// -----------------------------------------

// ⚠️ Change this to any repo you want to test
const TEST_REPO = "https://github.com/wlsf82/frontend-and-backend";

async function run() {
  try {
    console.log("🚀 Starting GitHub scraper...");
    console.log("Target:", TEST_REPO);

    const ctx = await extractRepoContext(TEST_REPO);

    console.log("\n===== GITHUB REPO CONTEXT JSON =====\n");
    console.log(JSON.stringify(ctx, null, 2));
  } catch (err) {
    console.error("❌ Scraper error:", err);
  }
}

run();
