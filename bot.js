const puppeteer = require("puppeteer");
const http = require("http");

// 1. RENDER HEALTH CHECK (Keeps the service alive)
http.createServer((req, res) => {
  res.writeHead(200);
  res.end("Bot is Active");
}).listen(process.env.PORT || 3000);

(async () => {
  // 2. LAUNCH WITH PROXY
  const browser = await puppeteer.launch({
    headless: "new",
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/google-chrome-stable',
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      `--proxy-server=${process.env.PROXY_URL}` // Uses your Webshare proxy
    ]
  });

  const page = await browser.newPage();

  // 3. PROXY AUTHENTICATION
  if (process.env.PROXY_USERNAME && process.env.PROXY_PASSWORD) {
    await page.authenticate({
      username: process.env.PROXY_USERNAME,
      password: process.env.PROXY_PASSWORD
    });
  }

  console.log("🚀 Bot started with Proxy. Tracking Kings League...");
  
  // Your scraping logic continues here...
})();
