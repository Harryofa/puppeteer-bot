const puppeteer = require("puppeteer");

(async () => {
  try {
    const browser = await puppeteer.launch({
      headless: false, // IMPORTANT (Cloudflare bypass)
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--proxy-server=http://p.webshare.io:80"
      ]
    });

    const page = await browser.newPage();

    // Proxy auth
    await page.authenticate({
      username: "docybpah-country-ng",
      password: "fjfywkrds2zw"
    });

    // Real browser fingerprint
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36"
    );

    console.log("🌍 Opening BetKing...");

    await page.goto("https://m.betking.com/en-ng/", {
      waitUntil: "networkidle2",
      timeout: 60000
    });

    // 🧠 WAIT for Cloudflare + JS rendering
    console.log("⏳ Waiting for full load...");
    await new Promise(r => setTimeout(r, 30000));

    // 👆 simulate human behavior
    await page.mouse.move(100, 200);
    await page.mouse.move(200, 400);
    await page.waitForTimeout(5000);

    // scroll like human
    await page.evaluate(() => window.scrollBy(0, 500));
    await page.waitForTimeout(3000);

    const title = await page.title();
    const content = await page.content();

    console.log("📄 Title:", title);

    // Check if blocked
    if (content.includes("Access Restricted")) {
      console.log("❌ STILL BLOCKED (bad proxy)");
    } else if (content.includes("Just a moment")) {
      console.log("⚠️ Cloudflare still active");
    } else {
      console.log("✅ SUCCESS - Real page loaded");
    }

    await browser.close();

  } catch (err) {
    console.log("❌ ERROR:", err.message);
  }
})();
