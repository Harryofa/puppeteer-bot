const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");

puppeteer.use(StealthPlugin());

const PROXY = "http://123.45.67.89:8080"; // PUT YOUR PROXY HERE

async function scrape() {
  let browser;

  try {
    console.log("🚀 Starting scrape...");

    browser = await puppeteer.launch({
      headless: true,
      args: [
        `--proxy-server=${PROXY}`,
        "--no-sandbox",
        "--disable-setuid-sandbox"
      ]
    });

    const page = await browser.newPage();

    // ONLY use this if your proxy has username/password
    // await page.authenticate({
    //   username: "your_username",
    //   password: "your_password"
    // });

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

// Run every 3 minutes
setInterval(scrape, 180000);

// Run immediately
scrape();
