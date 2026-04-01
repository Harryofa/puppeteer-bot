const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");

puppeteer.use(StealthPlugin());

(async () => {
  console.log("🚀 Bot starting...");

  let browser;

  try {
    browser = await puppeteer.launch({
      headless: "new", // safer for Render
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-blink-features=AutomationControlled",
        "--ignore-certificate-errors",
        "--proxy-server=http://p.webshare.io:9999",
      ],
    });

    const page = await browser.newPage();

    // ✅ Proxy authentication
    await page.authenticate({
      username: "docybpah-NG-GH-ET-KE",
      password: "fjfywkrds2zw",
    });

    // ✅ Real browser fingerprint
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
      "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    );

    await page.setViewport({ width: 1366, height: 768 });

    // ✅ Remove webdriver flag
    await page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, "webdriver", {
        get: () => false,
      });
    });

    // =========================
    // 🌍 CHECK IP
    // =========================
    console.log("🌍 Checking IP...");

    try {
      await page.goto("https://ipinfo.io/json", {
        waitUntil: "domcontentloaded",
        timeout: 30000,
      });

      const ip = await page.evaluate(() => document.body.innerText);
      console.log("🌍 IP INFO:", ip);
    } catch (err) {
      console.log("⚠️ IP check failed:", err.message);
    }

    // =========================
    // 🌐 OPEN BETKING
    // =========================
    console.log("🌐 Opening BetKing...");

    await page.goto("https://m.betking.com/", {
      waitUntil: "domcontentloaded",
      timeout: 60000,
    });

    // =========================
    // 🤖 HUMAN BEHAVIOR
    // =========================
    await new Promise(r => setTimeout(r, 5000));

    await page.mouse.move(100, 200);
    await page.mouse.move(300, 400);
    await page.mouse.move(500, 600);

    await page.keyboard.press("ArrowDown");

    await new Promise(r => setTimeout(r, 10000));

    // =========================
    // 📄 RESULT
    // =========================
    const title = await page.title();
    console.log("📄 Title:", title);

    const body = await page.evaluate(() => document.body.innerText);
    console.log("📊 Data:", body.slice(0, 200));

    // =========================
    // 🔍 STATUS CHECK
    // =========================
    if (title.toLowerCase().includes("just a moment")) {
      console.log("❌ BLOCKED BY CLOUDFLARE");
    } else {
      console.log("✅ SUCCESS — SITE LOADED");
    }

  } catch (err) {
    console.error("❌ MAIN ERROR:", err.message);
  } finally {
    if (browser) {
      await browser.close();
      console.log("🔒 Browser closed");
    }
  }
})();
