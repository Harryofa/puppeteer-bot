const puppeteer = require("puppeteer");

const URL = "https://example.com"; // 🔁 change later

async function scrape() {
  let browser;

  try {
    console.log("🚀 Starting scrape...");

    browser = await puppeteer.launch({
      headless: "new",
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage"
      ]
    });

    const page = await browser.newPage();

    await page.goto(URL, {
      waitUntil: "networkidle2",
      timeout: 60000
    });

    console.log("✅ Page loaded");

    const title = await page.title();
    console.log("📄 Title:", title);

    await browser.close();

    console.log("✅ Done\n");

  } catch (err) {
    console.error("❌ ERROR:", err.message);
  }
}

// run every 3 minutes
setInterval(scrape, 180000);

// run immediately
scrape();
