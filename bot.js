const puppeteer = require("puppeteer");

async function runBot() {
  let browser;

  try {
    console.log("🚀 Running WITHOUT proxy...");

    browser = await puppeteer.launch({
      headless: "new",
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage"
      ]
    });

    const page = await browser.newPage();

    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36"
    );

    console.log("🌍 Opening BetKing...");

    await page.goto("https://m.betking.com/virtual", {
      waitUntil: "networkidle2",
      timeout: 60000
    });

    // wait for JS + live data
    await new Promise(r => setTimeout(r, 20000));

    const title = await page.title();
    console.log("📄 Title:", title);

    if (title.includes("Just a moment")) {
      console.log("❌ Cloudflare triggered");
    } else {
      console.log("✅ Site loaded successfully");
    }

    // 🔥 Extract matches from DOM
    const matches = await page.evaluate(() => {
      const data = [];

      document.querySelectorAll("*").forEach(el => {
        const text = el.innerText;

        if (text && text.includes("vs")) {
          data.push(text);
        }
      });

      return data.slice(0, 20);
    });

    console.log("🔥 MATCHES:");
    console.log(matches);

    await browser.close();

  } catch (err) {
    console.log("❌ ERROR:", err.message);
    if (browser) await browser.close();
  }
}

// run once (no loop to save resources)
runBot();
