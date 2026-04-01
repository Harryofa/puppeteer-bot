const puppeteer = require("puppeteer");

(async () => {
  try {
    const browser = await puppeteer.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--proxy-server=http://p.webshare.io:80"
      ]
    });

    const page = await browser.newPage();

    // AUTH (ROTATING PROXY)
    await page.authenticate({
      username: "docybpah-country-ng",
      password: "fjfywkrds2zw"
    });

    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36"
    );

    console.log("🌍 Opening BetKing...");

    await page.goto("https://m.betking.com/en-ng/", {
      waitUntil: "domcontentloaded",
      timeout: 60000
    });

    await new Promise(r => setTimeout(r, 20000));

    console.log("📄 Title:", await page.title());

    await browser.close();

  } catch (err) {
    console.log("❌ ERROR:", err.message);
  }
})();
