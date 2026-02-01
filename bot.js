const puppeteer = require("puppeteer");

(async () => {
  console.log("🚀 BetKing Puppeteer Bot started...");

  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const page = await browser.newPage();

  await page.goto("https://www.google.com", {
    waitUntil: "networkidle2",
    timeout: 60000,
  });

  console.log("✅ Page loaded successfully");

  await browser.close();
  console.log("✅ Bot finished successfully");
})();
