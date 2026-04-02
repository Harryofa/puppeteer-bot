const puppeteer = require("puppeteer");

(async () => {
  console.log("🚀 BetKing REAL DATA BOT started...");

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

      await page.setUserAgent(
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36"
      );

      console.log("🌍 Opening BetKing Virtual...");

      // 🔥 CAPTURE ONLY JSON
      page.on("response", async (response) => {
        try {
          const headers = response.headers();
          const contentType = headers["content-type"] || "";

          if (contentType.includes("application/json")) {
            const url = response.url();

            const data = await response.json();

            if (
              url.includes("virtual") ||
              JSON.stringify(data).includes("team") ||
              JSON.stringify(data).includes("league")
            ) {
              console.log("\n🔥 MATCH DATA FOUND:");
              console.log("URL:", url);
              console.log(JSON.stringify(data).substring(0, 500));
            }
          }
        } catch (e) {}
      });

      await page.goto("https://m.betking.com/virtual", {
        waitUntil: "networkidle2",
        timeout: 60000
      });

      // ⏳ wait for websocket activity
      await new Promise((r) => setTimeout(r, 20000));

      const title = await page.title();
      console.log("Title:", title);

      if (
        title.includes("Just a moment") ||
        title.includes("Access Restricted")
      ) {
        console.log("❌ Blocked again");
      } else {
        console.log("✅ Site loaded, waiting for live data...");
      }

      await browser.close();

    } catch (err) {
      console.log("❌ ERROR:", err.message);
      if (browser) await browser.close();
    }

    console.log("⏳ Waiting...\n");
    await new Promise((r) => setTimeout(r, 60000));
  }
})();
