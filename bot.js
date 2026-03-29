const puppeteer = require("puppeteer");

const URL = "https://m.betking.com/en-ng/virtuals/scheduled/leagues/kings-league";

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

    // ⏳ WAIT FOR MATCHES TO LOAD
    await page.waitForSelector("body", { timeout: 60000 });

    // Extra delay for dynamic content
    await new Promise(resolve => setTimeout(resolve, 5000));

    console.log("✅ Page fully loaded");

    // 🔍 SCRAPE MATCH DATA
    const matches = await page.evaluate(() => {
      const data = [];

      // Try multiple selectors (BetKing changes often)
      const rows = document.querySelectorAll("div");

      rows.forEach(row => {
        const text = row.innerText;

        // detect match-like rows
        if (text && text.includes("\n") && text.length < 200) {
          const parts = text.split("\n").map(t => t.trim()).filter(Boolean);

          if (parts.length >= 3) {
            data.push(parts);
          }
        }
      });

      return data.slice(0, 20); // limit noise
    });

    console.log("📊 Matches Found:", matches.length);
    console.log(matches);

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
