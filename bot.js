const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");

puppeteer.use(StealthPlugin());

// 🔥 YOUR PROXY DETAILS
const PROXY_HOST = "gate.decodo.com";
const PROXY_PORT = "10002";
const PROXY_USER = "spidm74g3d";
const PROXY_PASS = "YOUR_PASSWORD"; // paste full password

async function scrape() {
  let browser;

  try {
    console.log("🚀 Starting scrape with proxy...");

    browser = await puppeteer.launch({
      headless: true,
      args: [
        `--proxy-server=http://${PROXY_USER}:${PROXY_PASS}@${PROXY_HOST}:${PROXY_PORT}`,
        "--no-sandbox",
        "--disable-setuid-sandbox"
      ]
    });

    const page = await browser.newPage();

    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36"
    );

    console.log("🌐 Opening BetKing...");

    await page.goto(
      "https://m.betking.com/en-ng/virtuals/scheduled/leagues/kings-league",
      { waitUntil: "domcontentloaded", timeout: 60000 }
    );

    console.log("⏳ Waiting for Cloudflare...");
    await new Promise(resolve => setTimeout(resolve, 20000));

    const title = await page.title();
    console.log("📄 Title:", title);

    const body = await page.evaluate(() => document.body.innerText);

    if (body.includes("This page isn’t working") || body.includes("HTTP ERROR 407")) {
      console.log("❌ Proxy authentication failed");
    } else if (title.toLowerCase().includes("just a moment")) {
      console.log("❌ Still blocked by Cloudflare");
    } else {
      console.log("✅ FULL SUCCESS!");
      console.log("📊 Data:", body.slice(0, 500));
    }

    await browser.close();

  } catch (err) {
    console.log("❌ ERROR:", err.message);
    if (browser) await browser.close();
  }
}

scrape();
setInterval(scrape, 180000);
