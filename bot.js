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
  USE_PROXY: true, // Initial attempt with proxy
  WAIT_BEFORE_CHECK: 25000, 
  WAIT_FOR_DATA: 60000, 
  CYCLE_DELAY: 60000,
  DATA_FILE: "matches.json"
};

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms + Math.random() * 2000));

async function runBot(useProxy = true) {
  let browser;
  try {
    console.log(`🛡️  Attempting connection: ${useProxy ? "WITH PROXY" : "DIRECT (NO PROXY)"}`);
    
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

    if (useProxy) {
      launchArgs.push(`--proxy-server=${CONFIG.PROXY}`);
    }

    browser = await puppeteer.launch({
      headless: "new",
      args: launchArgs,
      defaultViewport: null
    });

    const page = await browser.newPage();
    
    await page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, 'webdriver', { get: () => false });
      window.chrome = { runtime: {} };
      Object.defineProperty(navigator, 'languages', { get: () => ['en-US', 'en'] });
      Object.defineProperty(navigator, 'plugins', { get: () => [1, 2, 3, 4, 5] });
    });

    if (useProxy) {
      await page.authenticate(CONFIG.PROXY_AUTH);
    }

    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
    );

    console.log(`🌍 Navigating to ${CONFIG.TARGET_URL}...`);

    page.on("response", async (response) => {
      try {
        const contentType = response.headers()["content-type"] || "";
        if (contentType.includes("application/json")) {
          const url = response.url();
          const data = await response.json();
          const dataStr = JSON.stringify(data);
          const isRelevant = url.includes("virtual") || dataStr.includes("match") || dataStr.includes("odds");

          if (isRelevant) {
            const timestamp = new Date().toLocaleTimeString();
            console.log(`\n🔥 [${timestamp}] DATA CAPTURED: ${url.substring(0, 80)}...`);
            fs.appendFileSync(CONFIG.DATA_FILE, JSON.stringify({ time: timestamp, url, data: dataStr.substring(0, 1000) }) + "\n");
          }
        }
      } catch (e) {}
    });

    await page.goto(CONFIG.TARGET_URL, {
      waitUntil: "networkidle2",
      timeout: 90000
    });

    await delay(5000);
    const title = await page.title();
    const content = await page.content();
    console.log("Current Page Title:", title);

    const isBlocked = title.includes("Just a moment") || content.toLowerCase().includes("cloudflare");

    if (isBlocked && !content.toLowerCase().includes("virtual football")) {
      console.log("❌ BLOCKED: Cloudflare challenge detected.");
      return false; // Signal block
    } else {
      console.log("✅ SUCCESS: Site loaded! Monitoring data...");
      await delay(CONFIG.WAIT_FOR_DATA);
      return true; // Signal success
    }

  } catch (err) {
    console.log(`❌ ERROR (${useProxy ? "Proxy" : "Direct"}):`, err.message);
    if (err.message.includes("ERR_TUNNEL_CONNECTION_FAILED")) {
      console.log("⚠️ PROXY REJECTED: Your proxy provider is being blocked.");
    }
    return false; // Signal error/failure
  } finally {
    if (browser) await browser.close();
  }
}

(async () => {
  console.log("🚀 BetKing SMART-SWITCH BOT (v4.0) started...");

  while (true) {
    // 1. Try with Proxy first
    let success = await runBot(true);
    
    // 2. If Proxy fails, try Direct immediately
    if (!success) {
      console.log("🔄 Switching to DIRECT connection for this cycle...");
      await runBot(false);
    }

    console.log(`\n⏳ Cycle complete. Sleeping for ${CONFIG.CYCLE_DELAY / 1000}s...\n`);
    await new Promise(r => setTimeout(r, CONFIG.CYCLE_DELAY));
  }
})();
