const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
const AdblockerPlugin = require("puppeteer-extra-plugin-adblocker");
const fs = require("fs");

// Add stealth and adblocker plugins
puppeteer.use(StealthPlugin());
puppeteer.use(AdblockerPlugin({ blockTrackers: true }));

// Configuration
const CONFIG = {
  TARGET_URL: "https://m.betking.com/virtual",
  PROXY: "http://p.webshare.io:80",
  PROXY_AUTH: {
    username: "docybpah-NG-GH-ET-KE",
    password: "fjfywkrds2zw"
  },
  USE_PROXY: true, // Recommended to keep true for Render
  WAIT_BEFORE_CHECK: 25000, 
  WAIT_FOR_DATA: 60000, 
  CYCLE_DELAY: 60000,
  DATA_FILE: "matches.json"
};

/**
 * Utility for random delays to mimic human behavior
 */
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms + Math.random() * 2000));

(async () => {
  console.log("🚀 BetKing ULTIMATE PRODUCTION BOT (v3.0) started...");
  console.log(`🛡️  Stealth: ENABLED | 🌐 Proxy: ${CONFIG.USE_PROXY ? "ACTIVE" : "DISABLED"}`);

  while (true) {
    let browser;

    try {
      const launchArgs = [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-blink-features=AutomationControlled",
        "--disable-features=IsolateOrigins,site-per-process",
        "--window-size=1920,1080",
        "--lang=en-US,en;q=0.9",
        "--use-gl=desktop",
        "--disable-infobars"
      ];

      if (CONFIG.USE_PROXY) {
        launchArgs.push(`--proxy-server=${CONFIG.PROXY}`);
      }

      browser = await puppeteer.launch({
        headless: "new",
        args: launchArgs,
        defaultViewport: null
      });

      const page = await browser.newPage();
      
      // Deep stealth: hide webdriver and other bot traces
      await page.evaluateOnNewDocument(() => {
        Object.defineProperty(navigator, 'webdriver', { get: () => false });
        window.chrome = { runtime: {} };
        Object.defineProperty(navigator, 'languages', { get: () => ['en-US', 'en'] });
        Object.defineProperty(navigator, 'plugins', { get: () => [1, 2, 3, 4, 5] });
      });

      if (CONFIG.USE_PROXY) {
        await page.authenticate(CONFIG.PROXY_AUTH);
      }

      // Modern User-Agent
      await page.setUserAgent(
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
      );

      console.log(`🌍 Navigating to ${CONFIG.TARGET_URL}...`);

      // 🔥 JSON DATA CAPTURE LOGIC
      page.on("response", async (response) => {
        try {
          const contentType = response.headers()["content-type"] || "";
          if (contentType.includes("application/json")) {
            const url = response.url();
            const data = await response.json();
            const dataStr = JSON.stringify(data);

            const isRelevant = url.includes("virtual") || dataStr.includes("match") || dataStr.includes("odds") || dataStr.includes("league");

            if (isRelevant) {
              const timestamp = new Date().toLocaleTimeString();
              console.log(`\n🔥 [${timestamp}] DATA CAPTURED:`);
              console.log("URL:", url.substring(0, 100));
              
              // Append to local log
              const entry = { time: timestamp, url, snippet: dataStr.substring(0, 500) };
              fs.appendFileSync(CONFIG.DATA_FILE, JSON.stringify(entry) + "\n");
            }
          }
        } catch (e) { /* Ignore parsing errors */ }
      });

      // Navigate with generous timeout
      await page.goto(CONFIG.TARGET_URL, {
        waitUntil: "networkidle2",
        timeout: 120000
      });

      // Mimic human interaction
      await delay(5000);
      await page.evaluate(() => window.scrollBy(0, 400));
      await delay(2000);
      await page.evaluate(() => window.scrollBy(0, -200));

      const title = await page.title();
      const content = await page.content();
      console.log("Current Page Title:", title);

      const isBlocked = title.includes("Just a moment") || content.toLowerCase().includes("cloudflare") || content.toLowerCase().includes("captcha");

      if (isBlocked && !content.toLowerCase().includes("virtual football")) {
        console.log("❌ BLOCKED: Cloudflare challenge or CAPTCHA detected.");
        // Optional: Save screenshot for debugging on Render
        await page.screenshot({ path: 'last_block.png' });
      } else {
        console.log("✅ SUCCESS: Site loaded! Monitoring data stream...");
        await delay(CONFIG.WAIT_FOR_DATA);
      }

      await browser.close();

    } catch (err) {
      console.log("❌ ERROR:", err.message);
      if (browser) await browser.close();
      
      // Handle Proxy Failures specifically
      if (err.message.includes("ERR_TUNNEL_CONNECTION_FAILED")) {
        console.log("⚠️ PROXY ERROR: Your proxy might be down or blacklisted.");
      }
    }

    console.log(`\n⏳ Cycle complete. Sleeping for ${CONFIG.CYCLE_DELAY / 1000}s...\n`);
    await new Promise(r => setTimeout(r, CONFIG.CYCLE_DELAY));
  }
})();
