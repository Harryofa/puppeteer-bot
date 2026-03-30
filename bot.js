const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");

puppeteer.use(StealthPlugin());

// ==========================================
// 🔐 PROXY CONFIGURATION (from env vars)
// ==========================================
const PROXY_HOST = process.env.PROXY_HOST || "gate.decodo.com";
const PROXY_PORT = process.env.PROXY_PORT || "10002";
const PROXY_USER = process.env.PROXY_USER || "spidm74g3d";
const PROXY_PASS = process.env.PROXY_PASSWORD;

if (!PROXY_PASS) {
  console.error("❌ ERROR: PROXY_PASSWORD environment variable is not set!");
  console.error("Set it in Render Dashboard → Environment Variables");
  process.exit(1);
}

// ==========================================
// 🎯 SCRAPE CONFIGURATION
// ==========================================
const TARGET_URL = "https://m.betking.com/en-ng/virtuals/scheduled/leagues/kings-league";
const SCRAPE_INTERVAL = parseInt(process.env.SCRAPE_INTERVAL) || 180000; // 3 minutes
const CLOUDFLARE_TIMEOUT = parseInt(process.env.CLOUDFLARE_TIMEOUT) || 35000;

// ==========================================
// 🚀 MAIN SCRAPE FUNCTION
// ==========================================
async function scrape() {
  const timestamp = new Date().toLocaleTimeString();
  console.log(`\n[${timestamp}] 🚀 Starting scrape...`);
  console.log(`[${timestamp}] 🔗 Proxy: ${PROXY_HOST}:${PROXY_PORT}`);

  let browser = null;

  try {
    // Launch browser with proxy
    browser = await puppeteer.launch({
      headless: "new", // Use new headless mode
      args: [
        `--proxy-server=http://${PROXY_HOST}:${PROXY_PORT}`,
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-accelerated-2d-canvas",
        "--disable-gpu",
        "--window-size=1920,1080"
      ]
    });

    const page = await browser.newPage();

    // 🔐 Authenticate with proxy (CRITICAL)
    await page.authenticate({
      username: PROXY_USER,
      password: PROXY_PASS
    });

    // 🕵️ Stealth configurations
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.0.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.0"
    );

    await page.setViewport({ width: 1920, height: 1080 });

    // Extra stealth: override webdriver property
    await page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, "webdriver", { get: () => undefined });
      Object.defineProperty(navigator, "plugins", { get: () => [1, 2, 3, 4, 5] });
      window.chrome = { runtime: {} };
    });

    console.log(`[${timestamp}] 🌐 Navigating to BetKing...`);

    // Navigate with extended timeout
    const response = await page.goto(TARGET_URL, {
      waitUntil: "networkidle2",
      timeout: 60000
    });

    console.log(`[${timestamp}] ⏳ Waiting for Cloudflare/Content...`);
    await new Promise(resolve => setTimeout(resolve, CLOUDFLARE_TIMEOUT));

    // Get page info
    const title = await page.title();
    const url = page.url();
    const body = await page.evaluate(() => document.body.innerText);
    const html = await page.content();

    console.log(`[${timestamp}] 📄 Title: ${title}`);
    console.log(`[${timestamp}] 🔗 Final URL: ${url}`);

    // ==========================================
    // 🔍 DETAILED ERROR DETECTION
    // ==========================================
    
    // Check for proxy auth failure
    if (body.includes("407") || body.includes("Proxy Authentication Required")) {
      console.error(`[${timestamp}] ❌ PROXY AUTH FAILED (407)`);
      console.error(`[${timestamp}] 💡 Check your PROXY_PASSWORD env var`);
      return { success: false, error: "PROXY_AUTH_FAILED" };
    }

    // Check for Cloudflare challenge
    if (
      title.toLowerCase().includes("just a moment") ||
      title.toLowerCase().includes("attention required") ||
      body.includes("cf-browser-verification") ||
      body.includes("challenge-platform") ||
      html.includes("cf-turnstile")
    ) {
      console.error(`[${timestamp}] ❌ BLOCKED BY CLOUDFLARE`);
      console.error(`[${timestamp}] 💡 Try increasing CLOUDFLARE_TIMEOUT or use residential proxies`);
      return { success: false, error: "CLOUDFLARE_BLOCKED" };
    }

    // Check for access denied / blocked
    if (
      body.includes("Access Denied") ||
      body.includes("blocked") ||
      response.status() === 403
    ) {
      console.error(`[${timestamp}] ❌ ACCESS DENIED (403)`);
      return { success: false, error: "ACCESS_DENIED" };
    }

    // Check for successful load
    if (
      title.toLowerCase().includes("betking") ||
      body.includes("kings league") ||
      body.includes("virtual")
    ) {
      console.log(`[${timestamp}] ✅ SUCCESS! Page loaded correctly`);
      
      // Extract data (customize this section)
      const data = await page.evaluate(() => {
        // Example: extract match data
        const matches = [];
        const elements = document.querySelectorAll('[class*="match"], [class*="game"]');
        elements.forEach(el => {
          matches.push(el.innerText.slice(0, 100));
        });
        return matches;
      });

      console.log(`[${timestamp}] 📊 Extracted ${data.length} items`);
      console.log(`[${timestamp}] 📝 Preview:`, data.slice(0, 3));
      
      return { success: true, data, title };
    }

    // Unknown state
    console.warn(`[${timestamp}] ⚠️ UNKNOWN STATE`);
    console.warn(`[${timestamp}] 📝 Body preview:`, body.slice(0, 300));
    return { success: false, error: "UNKNOWN_STATE", body: body.slice(0, 500) };

  } catch (err) {
    console.error(`[${timestamp}] ❌ CRITICAL ERROR:`, err.message);
    if (err.message.includes("ERR_TUNNEL_CONNECTION_FAILED")) {
      console.error(`[${timestamp}] 💡 Proxy connection failed - check proxy settings`);
    }
    return { success: false, error: err.message };
  } finally {
    if (browser) {
      await browser.close();
      console.log(`[${timestamp}] 🔒 Browser closed`);
    }
  }
}

// ==========================================
// 🔄 SCHEDULER WITH ERROR HANDLING
// ==========================================
async function runWithRetry() {
  const result = await scrape();
  
  if (!result.success) {
    console.log(`⏱️ Retrying in ${SCRAPE_INTERVAL / 1000} seconds...`);
  }
}

// Initial run
runWithRetry();

// Schedule subsequent runs
setInterval(runWithRetry, SCRAPE_INTERVAL);

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("🛑 SIGTERM received, shutting down...");
  process.exit(0);
});
