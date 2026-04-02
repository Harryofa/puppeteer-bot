const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
const AdblockerPlugin = require("puppeteer-extra-plugin-adblocker");

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
  USE_PROXY: false, // Set to true if you want to use the proxy
  WAIT_BEFORE_CHECK: 15000,
  WAIT_FOR_DATA: 30000,
  CYCLE_DELAY: 60000
};

(async () => {
  console.log("🚀 BetKing PRODUCTION DATA BOT started...");

  while (true) {
    let browser;

    try {
      const launchArgs = [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-blink-features=AutomationControlled",
        "--disable-features=IsolateOrigins,site-per-process",
        "--window-size=1920,1080"
      ];

      if (CONFIG.USE_PROXY) {
        launchArgs.push(`--proxy-server=${CONFIG.PROXY}`);
      }

      browser = await puppeteer.launch({
        headless: "new",
        args: launchArgs
      });

      const page = await browser.newPage();
      await page.setViewport({ width: 1920, height: 1080 });

      if (CONFIG.USE_PROXY) {
        await page.authenticate(CONFIG.PROXY_AUTH);
      }

      // Set a realistic User-Agent
      await page.setUserAgent(
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      );

      // Add extra headers
      await page.setExtraHTTPHeaders({
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      });

      console.log(`🌍 Opening ${CONFIG.TARGET_URL}...`);

      // 🔥 CAPTURE ONLY JSON
      page.on("response", async (response) => {
        try {
          const headers = response.headers();
          const contentType = headers["content-type"] || "";

          if (contentType.includes("application/json")) {
            const url = response.url();
            const data = await response.json();
            const dataStr = JSON.stringify(data);

            // Filter for relevant data
            const isRelevant = 
              url.includes("virtual") || 
              dataStr.includes("team") || 
              dataStr.includes("league") || 
              dataStr.includes("match") ||
              dataStr.includes("odds");

            if (isRelevant) {
              console.log(`\n🔥 MATCH DATA FOUND: ${new Date().toLocaleTimeString()}`);
              console.log("URL:", url);
              // Print a snippet of the data
              console.log(dataStr.substring(0, 500) + "...");
            }
          }
        } catch (e) {
          // Ignore processing errors
        }
      });

      // Handle page errors
      page.on('error', err => console.log('❌ PAGE ERROR:', err.message));
      page.on('pageerror', err => console.log('❌ PAGE JS ERROR:', err.message));

      // Navigate to the target page
      await page.goto(CONFIG.TARGET_URL, {
        waitUntil: "networkidle2",
        timeout: 90000
      });

      // Human-like delay
      await new Promise((r) => setTimeout(r, CONFIG.WAIT_BEFORE_CHECK));

      const title = await page.title();
      const content = await page.content();
      
      console.log("Page Title:", title);

      // Refined check for Cloudflare or access restriction
      const isBlocked = 
        title.includes("Just a moment") || 
        title.includes("Access Restricted") ||
        content.toLowerCase().includes("cloudflare") ||
        content.toLowerCase().includes("cf-challenge") ||
        content.toLowerCase().includes("ddos-guard");

      if (isBlocked && !content.toLowerCase().includes("virtual football")) {
        console.log("❌ Blocked by Cloudflare or Access Restriction.");
      } else {
        console.log("✅ Site loaded successfully! Monitoring data...");
        await new Promise((r) => setTimeout(r, CONFIG.WAIT_FOR_DATA));
      }

      await browser.close();

    } catch (err) {
      console.log("❌ GLOBAL ERROR:", err.message);
      if (browser) await browser.close();
    }

    console.log(`\n⏳ Cycle finished. Waiting ${CONFIG.CYCLE_DELAY / 1000}s...\n`);
    await new Promise((r) => setTimeout(r, CONFIG.CYCLE_DELAY));
  }
})();
