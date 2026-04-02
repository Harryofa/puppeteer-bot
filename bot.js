const puppeteer = require("puppeteer");

(async () => {
  console.log("🚀 BetKing Bot started...");

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

      console.log("🌍 Opening BetKing...");

      await page.goto("https://m.betking.com/virtual", {
        waitUntil: "domcontentloaded",
        timeout: 30000
      });

      await new Promise(r => setTimeout(r, 8000));

      const title = await page.title();
      console.log("Title:", title);

      if (!title.includes("BetKing")) {
        console.log("❌ Failed to load properly");
        await browser.close();
        continue;
      }

      console.log("📊 Extracting matches...");

      const data = await page.evaluate(() => {
        let matches = [];

        document.querySelectorAll("div").forEach(el => {
          const text = el.innerText;

          if (
            text &&
            text.includes("vs") &&
            text.length < 100
          ) {
            matches.push(text);
          }
        });

        return matches.slice(0, 10);
      });

      console.log("🔥 MATCHES:");
      console.log(data);

      await browser.close();

    } catch (err) {
      console.log("❌ ERROR:", err.message);
    }

    console.log("⏳ Waiting before next run...");
    await new Promise(r => setTimeout(r, 60000));
  }
})();
