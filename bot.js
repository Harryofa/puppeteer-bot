const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");

puppeteer.use(StealthPlugin());

// 🔥 PROXY LIST (rotate automatically)
const PROXIES = [
  { port: "10002" },
  { port: "10003" },
  { port: "10004" },
  { port: "10005" }
];

const PROXY_HOST = "gate.decodo.com";
const PROXY_USER = "spidm74g3d";
const PROXY_PASS = "YOUR_PASSWORD_HERE";

// 🔁 pick random proxy port each run
function getRandomProxy() {
  return PROXIES[Math.floor(Math.random() * PROXIES.length)];
}

async function scrape() {
  let browser;

  const proxy = getRandomProxy();

  try {
    console.log(`🚀 Starting scrape with proxy port ${proxy.port}...`);

    browser = await puppeteer.launch({
      headless: true,
      args: [
        `--proxy-server=http://${PROXY_HOST}:${proxy.port}`,
        "--no-sandbox",
        "--disable-setuid-sandbox"
      ]
    });

    const page = await browser.newPage();

    // 🔐 Proxy authentication
    await page.authenticate({
      username: PROXY_USER,
      password: PROXY_PASS
    });

    // 🌐 Real browser identity
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36"
    );

    await page.setViewport({ width: 1366, height: 768 });

    console.log("🌍 Opening page...");

    await page.goto(
      "https://m.betking.com/en-ng/virtuals/scheduled/leagues/kings-league",
      { waitUntil: "domcontentloaded", timeout: 60000 }
    );

    // ⏳ Wait for Cloudflare challenge
    console.log("⏳ Waiting for Cloudflare...");
    await new Promise(resolve => setTimeout(resolve, 20000));

    const title = await page.title();
    console.log("📄 Title:", title);

    // ❌ blocked
    if (title.toLowerCase().includes("just a moment")) {
      console.log("❌ BLOCKED → switching proxy next run");
    } else {
      console.log("✅ SUCCESS — Page accessed!");

      // 🔥 Example scrape (you can modify later)
      const data = await page.evaluate(() => {
        return document.body.innerText.slice(0, 500);
      });

      console.log("📊 Sample Data:", data);
    }

    await browser.close();

  } catch (err) {
    console.log("❌ ERROR:", err.message);
    if (browser) await browser.close();
  }
}

// 🚀 run immediately
scrape();

// 🔁 run every 3 minutes
setInterval(scrape, 180000);
