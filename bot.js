const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");

puppeteer.use(StealthPlugin());

// 🔥 PROXY SETTINGS
const PROXY_HOST = "gate.decodo.com";
const PROXY_PORT = "10002"; // you can change
const PROXY_USER = "spidm74g3d";
const PROXY_PASS = "YOUR_PASSWORD_HERE";

async function scrape() {
  let browser;

  try {
    console.log("🚀 Starting scrape with proxy...");

    browser = await puppeteer.launch({
      headless: true,
      args: [
        `--proxy-server=http://${PROXY_HOST}:${PROXY_PORT}`,
        "--no-sandbox",
        "--disable-setuid-sandbox"
      ]
    });

    const page = await browser.newPage();

    // 🔐 Proxy auth
    await page.authenticate({
      username: PROXY_USER,
      password: PROXY_PASS
    });

    // 🌍 Real browser identity
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36"
    );

    await page.setViewport({ width: 1366, height: 768 });

    console.log("🌐 Opening BetKing...");

    await page.goto(
      "https://m.betking.com/en-ng/virtuals/scheduled/leagues/kings-league",
      { waitUntil: "domcontentloaded", timeout: 60000 }
    );

    // ⏳ FIXED WAIT (NO ERROR)
    console.log("⏳ Waiting for Cloudflare...");
    await new Promise(resolve => setTimeout(resolve, 20000));

    const title = await page.title();
    console.log("📄 Title:", title);

    if (title.toLowerCase().includes("just a moment")) {
      console.log("❌ Still blocked by Cloudflare");
    } else {
      console.log("✅ SUCCESS!");

      const data = await page.evaluate(() => {
        return document.body.innerText.slice(0, 500);
      });

      console.log("📊 Data:", data);
    }

    await browser.close();

  } catch (err) {
    console.log("❌ ERROR:", err.message);
    if (browser) await browser.close();
  }
}

// 🚀 run
scrape();

// 🔁 repeat every 3 minutes
setInterval(scrape, 180000);
