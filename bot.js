const puppeteer = require("puppeteer");

(async () => {
  console.log("🚀 BetKing BOT (FINAL VERSION) started...");

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

      // 🔐 Proxy auth
      await page.authenticate({
        username: "docybpah-NG-GH-ET-KE",
        password: "fjfywkrds2zw"
      });

      // 🧠 Make it look real
      await page.setUserAgent(
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36"
      );

      await page.setViewport({ width: 1366, height: 768 });

      // 🔥 Capture API responses (IMPORTANT)
      let apiData = [];

      page.on("response", async (response) => {
        try {
          const url = response.url();

          if (
            url.includes("virtual") ||
            url.includes("match") ||
            url.includes("league")
          ) {
            const text = await response.text();
            if (text.length > 50) {
              apiData.push({ url, text });
            }
          }
        } catch (e) {}
      });

      console.log("🌍 Opening BetKing Virtual...");

      await page.goto("https://m.betking.com/virtual", {
        waitUntil: "networkidle2",
        timeout: 60000
      });

      // ⏳ Allow JS + API load
      await new Promise((r) => setTimeout(r, 15000));

      const title = await page.title();
      console.log("Title:", title);

      if (
        title.includes("Just a moment") ||
        title.includes("Access Restricted")
      ) {
        console.log("❌ Blocked (Cloudflare/Geo)");
        await browser.close();
        continue;
      }

      // =========================
      // 1️⃣ TRY IFRAME EXTRACTION
      // =========================
      console.log("📊 Checking iframe...");

      const frames = page.frames();
      let matches = [];

      for (const frame of frames) {
        try {
          const data = await frame.evaluate(() => {
            let results = [];

            document.querySelectorAll("*").forEach((el) => {
              const text = el.innerText;

              if (
                text &&
                (text.includes(" v ") || text.includes(" vs "))
              ) {
                results.push(text.trim());
              }
            });

            return results;
          });

          if (data.length > 0) {
            matches = data;
            break;
          }
        } catch (e) {}
      }

      // =========================
      // 2️⃣ FALLBACK: API DATA
      // =========================
      if (matches.length === 0 && apiData.length > 0) {
        console.log("📡 Using API fallback...");

        apiData.forEach((item, i) => {
          console.log(`--- API ${i + 1} ---`);
          console.log(item.url);
          console.log(item.text.substring(0, 300));
        });
      }

      // =========================
      // RESULT
      // =========================
      if (matches.length > 0) {
        console.log("🔥 MATCHES FOUND:");
        console.log(matches.slice(0, 10));
      } else if (apiData.length === 0) {
        console.log("❌ No data (proxy weak or blocked)");
      } else {
        console.log("⚠️ Data found via API only");
      }

      await browser.close();

    } catch (err) {
      console.log("❌ ERROR:", err.message);
      if (browser) await browser.close();
    }

    console.log("⏳ Waiting before next run...\n");
    await new Promise((r) => setTimeout(r, 90000)); // 1.5 mins
  }
})();
