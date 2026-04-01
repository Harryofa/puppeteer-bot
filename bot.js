const puppeteer = require("puppeteer");

(async () => {
  console.log("🚀 Starting...");

  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox"]
  });

  const page = await browser.newPage();

  await page.goto("https://example.com");

  const title = await page.title();
  console.log("Title:", title);

  await browser.close();
})();
