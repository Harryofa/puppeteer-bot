const puppeteer = require("puppeteer");

const URL = "https://example.com"; // 🔁 CHANGE THIS TO YOUR TARGET SITE

async function scrape() {
  let browser;

  try {
    console.log("🚀 Starting scrape...");

    browser = await puppeteer.launch({
      headless: "new",
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || puppeteer.executablePath(),
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
        "--no-zygote",
        "--single-process"
      ]
    });

    const page = await browser.newPage();

    // Set timeout
    await page.setDefaultNavigationTimeout(60000);

    await page.goto(URL, {
      waitUntil: "networkidle2"
    });

    console.log("✅ Page loaded");

    // ✅ Example scraping (SAFE TEST)
    const data = await page.evaluate(() => {
      return {
        title: document.title,
        url: window.location.href
      };
    });

    console.log("📊 SCRAPED DATA:", data);

    console.log("✅ Scrape completed\n");

  } catch (error) {
    console.error("❌ SCRAPE ERROR:", error.message);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// 🔁 RUN CONTINUOUSLY
async function startBot() {
  console.log("🤖 Bot started...\n");

  while (true) {
    await scrape();

    console.log("⏳ Waiting 180 seconds...\n");

    await new Promise(resolve => setTimeout(resolve, 180000)); // 3 minutes
  }
}

startBot();
