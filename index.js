const puppeteer = require("puppeteer");

(async () => {
  console.log("🚀 Puppeteer bot started");

  const browser = await puppeteer.launch({
    headless: "new",
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu"
    ]
  });

  const page = await browser.newPage();

  await page.goto("https://example.com", {
    waitUntil: "networkidle2"
  });

  const title = await page.title();
  console.log("📄 Page title:", title);

  await browser.close();
  console.log("✅ Bot finished successfully");
})();
