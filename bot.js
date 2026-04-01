const puppeteer = require("puppeteer");

(async () => {
  const browser = await puppeteer.launch({
    headless: "new",
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--proxy-server=http://p.webshare.io:9999", // 🔥 FORCE 9999
    ],
  });

  const page = await browser.newPage();

  // AUTH
  await page.authenticate({
    username: "docybpah-NG-GH-ET-KE",
    password: "fjfywkrds2zw",
  });

  // TEST IP
  console.log("🌍 Checking IP...");
  await page.goto("https://ipinfo.io/json");

  const ip = await page.evaluate(() => document.body.innerText);
  console.log(ip);

  // OPEN SITE
  console.log("🌐 Opening BetKing...");
  await page.goto("https://m.betking.com/", {
    waitUntil: "domcontentloaded",
    timeout: 60000,
  });

  await new Promise(r => setTimeout(r, 10000));

  const title = await page.title();
  console.log("📄 Title:", title);

  const body = await page.evaluate(() => document.body.innerText);
  console.log("📊 Data:", body.slice(0, 200));

  await browser.close();
})();
