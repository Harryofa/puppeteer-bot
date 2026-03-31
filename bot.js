const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");

puppeteer.use(StealthPlugin());

// 🔥 USE ONE PROXY (CHANGE NUMBER TO ROTATE)
const PROXY_HOST = "p.webshare.io";
const PROXY_PORT = "80";
const PROXY_USER = "docybpah-1"; // change -1, -2, -3...
const PROXY_PASS = "fjfywkrds2zw";

async function scrape() {
  let browser;

  try {
    console.log(`🚀 Using proxy ${PROXY_USER}...`);

    browser = await puppeteer.launch({
      headless: true,
      args: [
        `--proxy-server=http://${PROXY_HOST}:${PROXY_PORT}`,
        "--no-sandbox",
        "--disable-setuid-sandbox"
      ]
    });

    const page = await browser.newPage();

    // 🔐 AUTH
    await page.authenticate({
      username: PROXY_USER,
      password: PROXY_PASS
    });

    // 🌐 Real browser
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36"
    );

    console.log("🌍 Opening BetKing...");

    await page.goto(
      "https://m.betking.com/en-ng/virtuals/scheduled/leagues/kings-league",
      { waitUntil: "domcontentloaded", timeout: 60000 }
    );

    console.log("⏳ Waiting...");
    await new Promise(resolve => setTimeout(resolve, 20000));

    const title = await page.title();
    console.log("📄 Title:", title);

    if (title.toLowerCase().includes("just a moment")) {
      console.log("❌ Blocked → change proxy number");
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

scrape();
setInterval(scrape, 180000);
