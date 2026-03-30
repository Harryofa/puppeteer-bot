const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");

puppeteer.use(StealthPlugin());

async function scrape() {
  let browser;

  try {
    console.log("🚀 Starting scrape...");

    browser = await puppeteer.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox"
      ]
    });

    const page = await browser.newPage();

    await page.goto(
      "https://m.betking.com/en-ng/virtuals/scheduled/leagues/kings-league",
      { waitUntil: "networkidle2", timeout: 60000 }
    );

    console.log("✅ Page loaded");

    const title = await page.title();
    console.log("📄 Title:", title);

    await browser.close();

  } catch (err) {
    console.log("❌ ERROR:", err.message);
    if (browser) await browser.close();
  }
}

setInterval(scrape, 180000);
scrape();
