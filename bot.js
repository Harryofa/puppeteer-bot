const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
const AdblockerPlugin = require("puppeteer-extra-plugin-adblocker");

// Add stealth and adblocker plugins
puppeteer.use(StealthPlugin());
puppeteer.use(AdblockerPlugin({ blockTrackers: true }));

// ─── Configuration ────────────────────────────────────────────────────────────
const CONFIG = {
  TARGET_URL:        "https://m.betking.com/virtual",
  PROXY:             process.env.PROXY_URL  || "http://p.webshare.io:80",
  PROXY_AUTH: {
    username:        process.env.PROXY_USER || "docybpah-NG-GH-ET-KE",
    password:        process.env.PROXY_PASS || "fjfywkrds2zw"
  },
  USE_PROXY:         process.env.USE_PROXY !== "false",   // set USE_PROXY=false in Render env to disable
  WAIT_BEFORE_CHECK: Number(process.env.WAIT_BEFORE_CHECK) || 25000,
  WAIT_FOR_DATA:     Number(process.env.WAIT_FOR_DATA)     || 60000,
  CYCLE_DELAY:       Number(process.env.CYCLE_DELAY)       || 60000,
  MAX_RETRIES:       Number(process.env.MAX_RETRIES)       || 3
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function log(emoji, ...args) {
  console.log(`${emoji} [${new Date().toLocaleTimeString()}]`, ...args);
}

async function buildBrowser(useProxy) {
  const args = [
    "--no-sandbox",
    "--disable-setuid-sandbox",
    "--disable-blink-features=AutomationControlled",
    "--disable-infobars",
    "--disable-dev-shm-usage",       // important on Render (low /dev/shm)
    "--disable-gpu",                 // Render has no GPU
    "--window-size=1920,1080",
    "--lang=en-US,en;q=0.9"
  ];

  if (useProxy) {
    args.push(`--proxy-server=${CONFIG.PROXY}`);
    log("🔌", `Proxy enabled → ${CONFIG.PROXY}`);
  } else {
    log("🚫", "Proxy disabled — connecting directly");
  }

  return puppeteer.launch({
    headless: "new",
    args,
    defaultViewport: null
  });
}

async function setupPage(browser, useProxy) {
  const page = await browser.newPage();

  // Extra stealth: hide webdriver flag
  await page.evaluateOnNewDocument(() => {
    Object.defineProperty(navigator, "webdriver", { get: () => false });
  });

  if (useProxy) {
    await page.authenticate(CONFIG.PROXY_AUTH);
  }

  await page.setUserAgent(
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) " +
    "AppleWebKit/537.36 (KHTML, like Gecko) " +
    "Chrome/122.0.0.0 Safari/537.36"
  );

  // Extra headers to look more like a real browser
  await page.setExtraHTTPHeaders({
    "Accept-Language": "en-US,en;q=0.9",
    "Accept":          "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8"
  });

  return page;
}

function attachResponseListener(page) {
  page.on("response", async (response) => {
    try {
      const contentType = response.headers()["content-type"] || "";
      if (!contentType.includes("application/json")) return;

      const url     = response.url();
      const data    = await response.json();
      const dataStr = JSON.stringify(data);

      if (
        url.includes("virtual") ||
        dataStr.includes("team")  ||
        dataStr.includes("match")
      ) {
        log("🔥", "DATA FOUND");
        console.log("  URL    :", url);
        console.log("  PAYLOAD:", dataStr.substring(0, 400) + "...\n");
      }
    } catch (_) {
      // silently ignore non-JSON or read errors
    }
  });
}

// ─── Single cycle ─────────────────────────────────────────────────────────────
async function runCycle(useProxy) {
  let browser;

  try {
    browser = await buildBrowser(useProxy);
    const page = await setupPage(browser, useProxy);
    attachResponseListener(page);

    log("🌍", `Navigating to ${CONFIG.TARGET_URL} …`);

    await page.goto(CONFIG.TARGET_URL, {
      waitUntil: "networkidle2",
      timeout:   120000
    });

    // Human-like scroll to trigger lazy-loaded content
    await page.evaluate(() => window.scrollBy(0, 500));
    await sleep(2000);
    await page.evaluate(() => window.scrollBy(0, -200));

    await sleep(CONFIG.WAIT_BEFORE_CHECK);

    const title   = await page.title();
    const content = await page.content();
    log("📄", "Page title:", title);

    const isCloudflareBlock =
      title.toLowerCase().includes("just a moment") ||
      content.toLowerCase().includes("cloudflare");

    const hasContent =
      content.toLowerCase().includes("virtual football") ||
      content.toLowerCase().includes("virtual");

    if (isCloudflareBlock && !hasContent) {
      log("❌", "Blocked by Cloudflare.");
      try { await page.screenshot({ path: "blocked.png" }); } catch (_) {}
      return { success: false, reason: "cloudflare" };
    }

    log("✅", "Site loaded! Monitoring for data …");
    await sleep(CONFIG.WAIT_FOR_DATA);
    return { success: true };

  } catch (err) {
    const isTunnelError = err.message.includes("ERR_TUNNEL_CONNECTION_FAILED");
    const isProxyError  = err.message.includes("ERR_PROXY_CONNECTION_FAILED");

    if (isTunnelError || isProxyError) {
      log("⚠️", "Proxy connection failed:", err.message);
      return { success: false, reason: "proxy_failed" };
    }

    log("❌", "Unexpected error:", err.message);
    return { success: false, reason: "unknown", error: err.message };

  } finally {
    if (browser) {
      try { await browser.close(); } catch (_) {}
    }
  }
}

// ─── Main loop ────────────────────────────────────────────────────────────────
(async () => {
  log("🚀", "BetKing ULTIMATE STEALTH BOT started");
  log("⚙️ ", `Proxy: ${CONFIG.USE_PROXY ? CONFIG.PROXY : "disabled"}`);

  let consecutiveProxyFails = 0;

  while (true) {
    // If proxy keeps failing, fall back to direct connection automatically
    const useProxy = CONFIG.USE_PROXY && consecutiveProxyFails < CONFIG.MAX_RETRIES;

    if (CONFIG.USE_PROXY && consecutiveProxyFails >= CONFIG.MAX_RETRIES) {
      log("🔄", `Proxy failed ${consecutiveProxyFails}x in a row — falling back to direct connection`);
    }

    const result = await runCycle(useProxy);

    if (result.reason === "proxy_failed") {
      consecutiveProxyFails++;
      log("🔁", `Proxy fail count: ${consecutiveProxyFails}/${CONFIG.MAX_RETRIES}`);
    } else {
      consecutiveProxyFails = 0; // reset on any non-proxy result
    }

    log("⏳", `Cycle finished. Waiting ${CONFIG.CYCLE_DELAY / 1000}s …\n`);
    await sleep(CONFIG.CYCLE_DELAY);
  }
})();
