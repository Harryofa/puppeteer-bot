const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");

puppeteer.use(StealthPlugin());

(async () => {
  try {
    const browser = await puppeteer.launch({
      headless: false, // VERY IMPORTANT
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-blink-features=AutomationControlled",
        "--ignore-certificate-errors",
        "--proxy-server=http://p.webshare.io:9999", // FORCE 9999
      ],
    });

    const page = await browser.newPage();

    // ✅ PROXY AUTH
    await page.authenticate({
      username: "docybpah-NG-GH-ET-KE",
      password: "fjfywkrds2zw",
    });

    // ✅ REAL USER AGENT
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
      "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    );

    // ✅ VIEWPORT (IMPORTANT)
    await page.setViewport({ width: 1366, height: 768 });

    // ✅ REMOVE WEBDRIVER FLAG
    await page.evaluateOnNewDocument(() => {
      Object.defineProperty(n
