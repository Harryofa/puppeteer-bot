const puppeteer = require("puppeteer");

(async () => {
  const browser = await puppeteer.launch({
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--proxy-server=http://p.webshare.io:80"
    ]
  });

  const page = await browser.newPage();

  // 🔐 Authenticate proxy
  await page.authenticate({
    username: "docybpah-NG-1",
    password: "fjfywkrds2zw"
  });

  // 🌍 Real browser headers
  await page.setUserAgent(
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36"
  );

  console.log("🌍 Opening BetKing...");

  await page.goto("https://m.betking.com/en-ng/", {
    waitUntil: "domcontentloaded",
    timeout: 60000
  });

  console.log("⏳ Waiting for Cloudflare...");
  await new Promise(resolve => setTimeout(resolve, 15000));

  const title = await page.title();
  console.log("📄 Title:", title);

  const content = await page.content();
  console.log("📊 Data:", content.slice(0, 500));

  await browser.close();
})();
