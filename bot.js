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
  USE_PROXY: true, 
  WAIT_BEFORE_CHECK: 25000, 
  WAIT_FOR_DATA: 60000, 
  CYCLE_DELAY: 60000
};

(async () => {
  console.log("🚀 BetKing ULTIMATE STEALTH BOT started...");

  while (true) {
    let browser;

    try {
      const launchArgs = [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-blink-features=AutomationControlled",
        "--use-gl=desktop",
        "--disable-infobars",
        "--window-size=1920,1080",
        "--lang=en-US,en;q=0.9"
      ];

      if (CONFIG.USE_PROXY) {
        launchArgs.push(`--proxy-server=${CONFIG.PROXY}`);
      }

      browser = await puppeteer.launch({
        headless: "new", // Render requires headless: "new" or true
        args: launchArgs,
        defaultViewport: null
      });

      const page = await browser.newPage();
      
      // Override webdriver property to be even more stealthy
      await page.evaluateOnNewDocument(() => {
        Object.defineProperty(navigator, 'webdriver', { get: () => false });
      });

      if (CONFIG.USE_PROXY) {
        await page.authenticate(CONFIG.PROXY_AUTH);
      }

      // Use a very specific, modern User-Agent
      await page.setUserAgent(
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
      );

      console.log(`🌍 Opening ${CONFIG.TARGET_URL} with Ultimate Stealth...`);

      // 🔥 CAPTURE ONLY JSON
      page.on("response", async (response) => {
        try {
          const contentType = response.headers()["content-type"] || "";
          if (contentType.includes("application/json")) {
            const url = response.url();
            const data = await response.json();
            const dataStr = JSON.stringify(data);

            if (url.includes("virtual") || dataStr.includes("team") || dataStr.includes("match")) {
              console.log(`\n🔥 DATA FOUND: ${new Date().toLocaleTimeString()}`);
              console.log("URL:", url);
              console.log(dataStr.substring(0, 300) + "...");
            }
          }
        } catch (e) {}
      });

      // Navigate with a longer timeout and specific wait condition
      await page.goto(CONFIG.TARGET_URL, {
        waitUntil: "networkidle2",
        timeout: 120000
      });

      // Human-like scroll to trigger lazy loading and bypass simple bot checks
      await page.evaluate(() => window.scrollBy(0, 500));
      await new Promise(r => setTimeout(r, 2000));
      await page.evaluate(() => window.scrollBy(0, -200));

      await new Promise((r) => setTimeout(r, CONFIG.WAIT_BEFORE_CHECK));

      const title = await page.title();
      const content = await page.content();
      
      console.log("Page Title:", title);

      const isBlocked = title.includes("Just a moment") || content.toLowerCase().includes("cloudflare");

      if (isBlocked && !content.toLowerCase().includes("virtual football")) {
        console.log("❌ Still Blocked. Cloudflare is tough today.");
        // Take a screenshot if possible for debugging on Render (saves to disk)
        try { await page.screenshot({ path: 'blocked.png' }); } catch(e) {}
      } else {
        console.log("✅ SUCCESS! Site loaded. Monitoring for 60s...");
        await new Promise((r) => setTimeout(r, CONFIG.WAIT_FOR_DATA));
      }

      await browser.close();

    } catch (err) {
      console.log("❌ ERROR:", err.message);
      if (browser) await browser.close();
    }

    console.log(`\n⏳ Cycle finished. Waiting ${CONFIG.CYCLE_DELAY / 1000}s...\n`);
    await new Promise((r) => setTimeout(r, CONFIG.CYCLE_DELAY));
  }
})();
