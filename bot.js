const puppeteer = require('puppeteer');

async function scrape() {
  try {
    console.log("🚀 Starting scrape...");

    const browser = await puppeteer.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage"
      ]
    });

    const page = await browser.newPage();

    await page.goto('https://example.com', {
      waitUntil: 'networkidle2',
      timeout: 60000
    });

    console.log("✅ Page loaded");

    const title = await page.title();
    console.log("📄 Title:", title);

    await browser.close();
    console.log("✅ Done");

  } catch (error) {
    console.error("❌ SCRAPE ERROR:", error.message);
  }
}

// Run every 3 minutes
setInterval(scrape, 180000);

// Run immediately
scrape();
