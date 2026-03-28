const puppeteer = require("puppeteer-core");

const URL = "https://example.com"; // 🔁 CHANGE THIS TO YOUR TARGET

async function scrape() {
  let browser;

  try {
    console.log("🚀 Starting scrape...");

    browser = await puppeteer.launch({
      headless: true,
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || "/usr/bin/chromium",
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

    // Set timeouts
    await page.setDefaultNavigationTimeout(60000);
    await page.setDefaultTimeout(60000);

    // Open site
    await page.goto(URL, {
      waitUntil: "networkidle2"
    });

    console.log("✅ Page loaded");

    // 🔥 BASIC SCRAPE (SAFE TEST)
    const result = await page.evaluate(() => {
      return {
        title: document.title,
        url: window.location.href,
        links: Array.from(document.querySelectorAll("a"))
          .slice(0, 5)
          .map(a => a.href)
      };
    });

    console.log("📊 DATA:", JSON.stringify(result, null, 2));

    console.log("✅ Scrape completed\n");

  } catch (error) {
    console.error("❌ ERROR:", error.message);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// 🔁 RUN FOREVER (NO STOP)
async function runBot() {
  console.log("🤖 BOT STARTED...\n");

  while (true) {
    await scrape();

    console.log("⏳ Waiting 180 seconds...\n");

    await new Promise(resolve => setTimeout(resolve, 180000)); // 3 mins
  }
}

runBot();
