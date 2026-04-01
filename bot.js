const puppeteer = require("puppeteer");

const PROXY_HOST = "p.webshare.io";
const PROXY_PORT = 80;
const PROXY_USER_BASE = "docybpah-ET-GH-KE-NG";
const PROXY_PASS = "fjfywkrds2zw";

// how many proxies you want to rotate through
const MAX_PROXIES = 50;
const MAX_RETRIES = 10;

async function runBot() {
  for (let i = 0; i < MAX_RETRIES; i++) {
    const proxyIndex = Math.floor(Math.random() * MAX_PROXIES) + 1;
    const proxyUser = `${PROXY_USER_BASE}-${proxyIndex}`;

    console.log(`🚀 Trying proxy: ${proxyUser}`);

    let browser;

    try {
      browser = await puppeteer.launch({
        headless: "new",
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          `--proxy-server=http://${PROXY_HOST}:${PROXY_PORT}`,
        ],
      });

      const page = await browser.newPage();

      // ✅ Authenticate proxy
      await page.authenticate({
        username: proxyUser,
        password: PROXY_PASS,
      });

      // ✅ Set real browser headers
      await page.setUserAgent(
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
        "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      );

      await page.setExtraHTTPHeaders({
        "accept-language": "en-US,en;q=0.9",
      });

      // =========================
      // 🌍 STEP 1: CHECK IP LOCATION
      // =========================
      console.log("🌍 Checking IP...");

      await page.goto("https://ipinfo.io/json", {
        waitUntil: "domcontentloaded",
        timeout: 60000,
      });

      const ipData = await page.evaluate(() => {
        return JSON.parse(document.body.innerText);
      });

      console.log("🌍 IP INFO:", ipData);

      if (!["NG", "GH"].includes(ipData.country)) {
        console.log("❌ Wrong country, rotating...");
        await browser.close();
        continue;
      }

      console.log("✅ Good location:", ipData.country);

      // =========================
      // 🎯 STEP 2: OPEN BETKING
      // =========================
      console.log("🌐 Opening BetKing...");

      await page.goto("https://m.betking.com/en-ng/", {
        waitUntil: "domcontentloaded",
        timeout: 60000,
      });

      const title = await page.title();
      console.log("📄 Title:", title);

      const content = await page.content();

      if (
        content.includes("Access Restricted") ||
        content.includes("not working")
      ) {
        console.log("❌ Blocked by BetKing, retrying...");
        await browser.close();
        continue;
      }

      console.log("🎉 SUCCESS! BetKing Loaded");

      // =========================
      // 🧠 OPTIONAL: SCRAPE DATA
      // =========================
      // Example:
      // const data = await page.evaluate(() => document.body.innerText);
      // console.log(data);

      await browser.close();
      return;

    } catch (error) {
      console.log("❌ ERROR:", error.message);

      if (browser) await browser.close();
    }
  }

  console.log("💀 All retries failed");
}

runBot();
