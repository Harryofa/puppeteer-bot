const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");

puppeteer.use(StealthPlugin());

const URL = "https://m.betking.com/en-ng/virtuals/scheduled/leagues/kings-league";

async function scrape() {
  let browser;

  try {
    console.log("🚀 Starting scrape...");

    browser = await puppeteer.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-blink-features=AutomationControlled"
      ]
    });

    const page = await browser.newPage();

    // 🧠 Fake real browser fingerprint
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36"
    );

    await page.setViewport({
      width: 1366,
      height: 768
    });

    // extra headers
    await page.setExtraHTTPHeaders({
      "accept-language": "en-US,en;q=0.9"
    });

    await page.goto(URL, {
      waitUntil: "domcontentloaded",
      timeout: 60000
    });

    // ⏳ wait for cloudflare check
    console.log("⏳ Waiting for verification...");
    await new Promise(resolve => setTimeout(resolve, 15000));

    const content = await page.content();

    // 🔍 check if still blocked
    if (content.includes("security verification") || content.includes("Cloudflare")) {
      console.log("❌ STILL BLOCKED BY CLOUDFLARE");
    } else {
      console.log("✅ BYPASS SUCCESS");

      // try extract text
      const data = await page.evaluate(() => {
        return document.body.innerText.slice(0, 1000);
      });

      console.log("📊 DATA SAMPLE:\n", data);
    }

    await browser.close();

    console.log("✅ Done\n");

  } catch (err) {
    console.error("❌ ERROR:", err.message);
    if (browser) await browser.close();
  }
}

// run every 3 minutes
setInterval(scrape, 180000);
scrape();
