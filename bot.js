const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");

puppeteer.use(StealthPlugin());

// 🔥 YOUR PROXY DETAILS
const PROXY_HOST = "gate.decodo.com";
const PROXY_PORT = "10002"; // you can rotate (10003, 10004...)
const PROXY_USER = "spidm74g3d";
const PROXY_PASS = "YOUR_PASSWORD_HERE";

async function scrape() {
  let browser;

  try {
    console.log("🚀 Starting scrape with proxy...");

    browser = await puppeteer.launch({
      headless: true,
      args: [
        `--proxy-server=http://${PROXY_HOST}:${PROXY_PORT}`,
        "--no-sandbox",
        "--disable-setuid-sandbox"
      ]
    });

    const page = await browser.newPage();

    // ✅ AUTHENTICATION (VERY IMPORTANT)
    await page.authenticate({
      username: PROXY_USER,
      password: PROXY_PASS
    });

    // ✅ Make it look like real browser
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36"
    );

    await page.goto(
      "https://m.betking.com/en-ng/virtuals/scheduled/leagues/kings-league",
      { waitUntil: "networkidle2", timeout: 60000 }
    );

    console.log("⏳ Waiting for Cloudflare...");
    await page.waitForTimeout(15000);

    const title = await page.title();
    console.log("📄 Title:", title);

    if (title.includes("Just a moment")) {
      console.log("❌ STILL BLOCKED (try another port)");
    } else {
      console.log("✅ SUCCESS — Cloudflare bypassed!");
    }

    await browser.close();

  } catch (err) {
    console.log("❌ ERROR:", err.message);
    if (browser) await browser.close();
  }
}

// 🔁 Run every 3 mins
setInterval(scrape, 180000);

// 🚀 Run immediately
scrape();
