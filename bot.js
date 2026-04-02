const puppeteer = require("puppeteer");

(async () => {
  console.log("🚀 BetKing Bot started...");

  while (true) {
    let browser;

    try {
      browser = await puppeteer.launch({
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

      // 🧠 Make browser look real
      await page.setUserAgent(
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36"
      );

      await page.setViewport({ width: 1366, height: 768 });

      console.log("🌍 Opening BetKing Virtual...");

      await page.goto("https://m.betking.com/virtual", {
        waitUntil: "networkidle2",
        timeout: 60000
      });

      // ⏳ Extra wait for JS rendering
      await new Promise(r => setTimeout(r, 12000));

      const title = await page.title();
      console.log("Title:", title);

      // 🚨 Better validation
      if (
        title.includes("Just a moment") ||
        title.includes("Access Restricted")
      ) {
        console.log("❌ Blocked by Cloudflare / Geo");
        await browser.close();
        continue;
      }

      console.log("📊 Extracting matches...");

      const data = await page.evaluate(() => {
        let results = [];

        document.querySelectorAll("*").forEach(el => {
          const text = el.innerText;

          if (
            text &&
            text.includes("vs") &&
            text.length < 80
          ) {
            results.push(text);
          }
        });

        return [...new Set(results)].slice(0, 10);
      });

      if (data.length === 0) {
        console.log("⚠️ No matches found (JS not loaded)");
      } else {
        console.log("🔥 MATCHES:");
        console.log(data);
      }

      await browser.close();

    } catch (err) {
      console.log("❌ ERROR:", err.message);

      if (browser) await browser.close();
    }

    console.log("⏳ Waiting before next run...");
    await new Promise(r => setTimeout(r, 90000)); // 1.5 min
  }
})();
