const puppeteer = require("puppeteer");

(async () => {
  console.log("🚀 Bot started...");

  while (true) {
    try {
      const browser = await puppeteer.launch({
        headless: "new",
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--proxy-server=http://p.webshare.io:80"
        ]
      });

      const page = await browser.newPage();

      await page.authenticate({
        username: "docybpah-NG-GH-ET-KE",
        password: "fjfywkrds2zw"
      });

      console.log("🌍 Checking IP...");

      try {
        await page.goto("https://ipinfo.io/json", {
          waitUntil: "domcontentloaded",
          timeout: 20000
        });

        const ip = await page.evaluate(() => document.body.innerText);
        console.log("IP:", ip);
      } catch (e) {
        console.log("⚠️ IP check failed");
      }

      console.log("🌐 Opening BetKing...");

      await page.goto("https://m.betking.com/", {
        waitUntil: "domcontentloaded",
        timeout: 30000
      });

      await new Promise(r => setTimeout(r, 8000));

      const title = await page.title();
      console.log("Title:", title);

      if (title.includes("Just a moment")) {
        console.log("❌ Cloudflare blocking");
      } else if (title.includes("Access Restricted")) {
        console.log("❌ Geo blocked");
      } else {
        console.log("✅ SUCCESS - Site Loaded");
      }

      await browser.close();

    } catch (err) {
      console.log("❌ ERROR:", err.message);
    }

    console.log("⏳ Waiting before retry...");
    await new Promise(r => setTimeout(r, 60000)); // 1 min loop
  }
})();
