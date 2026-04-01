const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");

puppeteer.use(StealthPlugin());

(async () => {
  console.log("🚀 Bot starting...");

  let browser;

  try {
    browser = await puppeteer.launch({
      headless: "new",
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

    // 🔥 FORCE NIGERIA PROXY
    await page.authenticate({
      username: "docybpah-NG",
      password: "fjfywkrds2zw",
    });

    // 🌐 Real browser fingerprint
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
      "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    );

    await page.setViewport({ width: 1366, height: 768 });

    await page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, "webdriver", {
        get: () => false,
      });
    });

    // =========================
    // 🌍 CHECK IP + COUNTRY
    // =========================
    console.log("🌍 Checking IP...");

    let country = "unknown";

    try {
      await page.goto("https://ipinfo.io/json", {
        waitUntil: "domcontentloaded",
        timeout: 30000,
      });

      const ipData = await page.evaluate(() => document.body.innerText);
      console.log("🌍 IP INFO:", ipData);

      if (ipData.includes('"country": "NG"')) {
        country = "NG";
      } else if (ipData.includes('"country": "GH"')) {
        country = "GH";
      }

    } catch (err) {
      console.log("⚠️ IP check failed:", err.message);
    }

    // ❌ STOP if wrong country
    if (country !== "NG") {
      console.log("❌ WRONG COUNTRY:", country);
      console.log("⛔ Stopping script...");
      return;
    }

    console.log("✅ Correct country detected:", country);

    // =========================
    // 🌐 OPEN BETKING
    // =========================
    console.log("🌐 Opening BetKing...");

    await page.goto("https://m.betking.com/", {
      waitUntil: "domcontentloaded",
      timeout: 60000,
    });

    // 🤖 simulate human
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
    console.log("📊 Data:", body.slice(0, 300));

    // =========================
    // 🔍 FINAL STATUS
    // =========================
    if (title.toLowerCase().includes("just a moment")) {
      console.log("❌ BLOCKED BY CLOUDFLARE");
    } else if (title.toLowerCase().includes("access restricted")) {
      console.log("❌ GEO BLOCKED");
    } else {
      console.log("✅ SUCCESS — FULL ACCESS GRANTED 🎉");
    }

  } catch (err) {
    console.error("❌ MAIN ERROR:",
