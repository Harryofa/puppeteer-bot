const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");

puppeteer.use(StealthPlugin());

// 🔁 PUT YOUR PROXY DETAILS HERE
const PROXY_HOST = "YOUR_HOST";
const PROXY_PORT = "YOUR_PORT";
const PROXY_USER = "YOUR_USERNAME";
const PROXY_PASS = "YOUR_PASSWORD";

const URL = "https://m.betking.com/en-ng/virtuals/scheduled/leagues/kings-league";

async function scrape() {
  let browser;

  try {
    console.log("🚀 Starting scrape with proxy...");

    browser = await puppeteer.launch({
      headless: true,
      args: [
        `--proxy-server=http://${PROXY_HOST}:${PROXY_PORT}`,
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-blink-features=AutomationControlled"
      ]
    });

    const page = await browser.newPage();

    // ✅ Authenticate proxy (IMPORTANT)
    await page.authenticate({
      username: PROXY_USER,
      password: PROXY_PASS
    });

    // ✅ Real browser identity
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36"
    );

    await page.setViewport({ width: 1366, height: 768 });

    await page.setExtraHTTPHeaders({
      "accept-language": "en-US,en;q=0.9"
    });

    await page.goto(URL, {
      waitUntil: "domcontentloaded",
      timeout: 60000
    });

    console.log("⏳ Waiting for Cloudflare...");
    await new Promise(r => setTimeout(r, 15000));

    const content = await page.content();

    // ❌ STILL BLOCKED
    if (
      content.includes("Cloudflare") ||
      content.includes("security verification")
    ) {
      console.log("❌ STILL BLOCKED (BAD OR WEAK PROXY)");
    } else {
      console.log("✅ BYPASS SUCCESS 🎉");

      // 📊 Extract visible text
      const data = await page.evaluate(() => {
        return document.body.innerText;
      });

      console.log("📊 DATA SAMPLE:\n");
      console.log(data.slice(0, 1500));
    }

    await browser.close();
    console.log("✅ Done\n");

  } catch (err) {
    console.error("❌ ERROR:", err.message);
    if (browser) await browser.close();
  }
}

// 🔁 Run every 3 minutes
setInterval(scrape, 180000);

// ▶ Run immediately
scrape();
