const puppeteer = require("puppeteer");

(async () => {
  const browser = await puppeteer.launch({
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--proxy-server=http://p.webshare.io:443"
    ]
  });

  const page = await browser.newPage();

  await page.authenticate({
    username: "docybpah-NG-1",
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

  await new Promise(r => setTimeout(r, 15000));

  console.log("📄 Title:", await page.title());

  await browser.close();
})();
