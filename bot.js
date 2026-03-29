const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");

puppeteer.use(StealthPlugin());

const URL = "https://m.betking.com/en-ng/virtuals/scheduled/leagues/kings-league";

// 🔁 PUT YOUR PROXY HERE
const PROXY = "http://username:password@host:port";

async function scrape() {
  let browser;

  try {
    console.log("🚀 Starting scrape with proxy...");

    browser = await puppeteer.launch({
      headless: true,
      args: [
        `--proxy-server=${PROXY}`,
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-blink-features=AutomationControlled"
      ]
    });

    const page = await browser.newPage();

    // authenticate proxy (important)
    await page.authenticate({
      username: "username",
      password: "password"
    });

    // real browser fingerprint
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36"
    );

    await page.setViewport({ width: 1366, height: 768 });

    await page.goto(URL, {
      waitUntil: "domcontentloaded",
      timeout: 60000
    });

    console.log("⏳ Waiting for Cloudflare...");
    await new Promise(r => setTimeout(r, 15000));

    const content = await page.content();

    if (content.includes("Cloudflare") || content.includes("security")) {
      console.log("❌ STILL BLOCKED (BAD PROXY)");
    } else {
      console.log("✅ BYPASS SUCCESS 🎉");

      const text = await page.evaluate(() => document.body.innerText);
      console.log("📊 DATA SAMPLE:\n", text.slice(0, 1000));
    }

    await browser.close();

  } catch (err) {
    console.error("❌ ERROR:", err.message);
    if (browser) await browser.close();
  }
}

setInterval(scrape, 180000);
scrape();
