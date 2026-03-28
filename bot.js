const puppeteer = require("puppeteer");

const URL = "https://example.com"; // 🔁 change later

async function scrape() {
  let browser;

  try {
    console.log("🚀 Starting scrape...");

    // 👇 Force Puppeteer to use installed Chrome
    const browserFetcher = puppeteer.createBrowserFetcher();
    const revisionInfo = await browserFetcher.download(
      puppeteer.browserRevision
    );

    browser = await puppeteer.launch({
      headless: "new",
      executablePath: revisionInfo.executablePath,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu"
      ]
    });

    const page = await browser.newPage();

    await page.goto(URL, {
      waitUntil: "networkidle2",
      timeout: 60000
    });

    console.log("✅ Page loaded");

    const data = await page.evaluate(() => {
      return {
        title: document.title,
        url: window.location.href
      };
    });

    console.log("📊 DATA:", data);

    console.log("✅ Scrape completed\n");

  } catch (error) {
    console.error("❌ ERROR:", error.message);
  } finally {
    if (browser) await browser.close();
  }
}

// 🔁 LOOP FOREVER
(async () => {
  console.log("🤖 BOT STARTED...\n");

  while (true) {
    await scrape();

    console.log("⏳ Waiting 180 seconds...\n");

    await new Promise(resolve => setTimeout(resolve, 180000));
  }
})();
