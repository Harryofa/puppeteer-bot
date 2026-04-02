const puppeteer = require("puppeteer");

const PROXY = "http://p.webshare.io:10000";
const USERNAME = "docybpah-rotate";
const PASSWORD = "fjfywkrds2zw";

async function runBot() {
  let browser;

  try {
    console.log("🚀 Starting BetKing REAL BOT...");

    browser = await puppeteer.launch({
      headless: "new",
      ignoreHTTPSErrors: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        `--proxy-server=${PROXY}`,
        "--disable-dev-shm-usage",
        "--disable-blink-features=AutomationControlled"
      ]
    });

    const page = await browser.newPage();

    // 🔐 Proxy authentication
    await page.authenticate({
      username: USERNAME,
      password: PASSWORD
    });

    // 🧠 Make it look like real browser
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36"
    );

    await page.setViewport({ width: 1366, height: 768 });

    await page.setExtraHTTPHeaders({
      "accept-language": "en-US,en;q=0.9"
    });

    console.log("🌍 Opening BetKing Virtual...");

    // 🎯 Capture ONLY useful responses
    page.on("response", async (response) => {
      try {
        const url = response.url();
        const headers = response.headers();
        const type = headers["content-type"] || "";

        if (type.includes("application/json")) {
          const data = await response.json();

          // 🔥 Filter real match data
          if (
            url.includes("virtual") ||
            JSON.stringify(data).includes("team") ||
            JSON.stringify(data).includes("league")
          ) {
            console.log("\n🔥 MATCH DATA FOUND:");
            console.log("URL:", url);
            console.log(JSON.stringify(data).slice(0, 500));
          }
        }
      } catch (e) {}
    });

    await page.goto("https://m.betking.com/virtual", {
      waitUntil: "networkidle2",
      timeout: 60000
    });

    // ⏳ wait for JS + WebSocket
    console.log("⏳ Waiting for live data...");
    await new Promise((r) => setTimeout(r, 25000));

    const title = await page.title();
    console.log("📄 Title:", title);

    // 🚨 Block detection
    if (
      title.includes("Just a moment") ||
      title.includes("Access Restricted")
    ) {
      console.log("❌ Blocked by Cloudflare");
    } else {
      console.log("✅ Site loaded successfully");
    }

    await browser.close();

  } catch (err) {
    console.log("❌ ERROR:", err.message);
    if (browser) await browser.close();
  }
}

// 🔁 Continuous runner
(async () => {
  while (true) {
    await runBot();
    console.log("🔄 Restarting in 60 seconds...\n");
    await new Promise
