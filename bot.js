const puppeteer = require("puppeteer");

const URL = "https://m.betking.com/en-ng/virtuals/scheduled/leagues/kings-league";

const INTERVAL = 170000; // 170 seconds

console.log("🚀 Kings League DC12 BOT STARTED");

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function launchBrowser() {
  return await puppeteer.launch({
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu"
    ]
  });
}

async function scrape() {
  const browser = await launchBrowser();
  const page = await browser.newPage();

  try {
    console.log("🌐 Opening page...");

    await page.goto(URL, {
      waitUntil: "domcontentloaded",
      timeout: 0
    });

    // wait for page to fully render
    await sleep(5000);

    // click Double Chance market if exists
    try {
      const dcTab = await page.$('[data-testid="double-chance-market"]');
      if (dcTab) {
        await dcTab.click();
        await sleep(3000);
        console.log("✅ Double Chance market selected");
      }
    } catch (e) {}

    // wait for matches
    await page.waitForSelector('div[data-testid="match-content"]', {
      timeout: 20000
    });

    const matches = await page.evaluate(() => {
      const data = [];

      document.querySelectorAll('div[data-testid="match-content"]').forEach(match => {
        const home = match.querySelector('[data-testid="match-home-team"]')?.innerText.trim();
        const away = match.querySelector('[data-testid="match-away-team"]')?.innerText.trim();

        const odds = match.querySelectorAll('span[data-testid="match-odd-value"]');

        if (!home || !away || odds.length < 3) return;

        const dc12 = parseFloat(odds[1].innerText.trim());

        if (!isNaN(dc12)) {
          data.push({ home, away, dc12 });
        }
      });

      return data;
    });

    if (!matches.length) {
      console.log("❌ No matches found");
      await browser.close();
      return;
    }

    console.log(`📊 Matches found: ${matches.length}`);

    // get highest DC12
    const best = matches.sort((a, b) => b.dc12 - a.dc12)[0];

    console.log(`🎯 BEST PICK → ${best.home} vs ${best.away} | DC12 @ ${best.dc12}`);

  } catch (err) {
    console.log("❌ ERROR:", err.message);
  }

  await browser.close();
}

(async () => {
  while (true) {
    console.log("\n⏱ RUNNING...\n");

    await scrape();

    console.log(`\n⏳ Waiting ${INTERVAL / 1000}s...\n`);
    await sleep(INTERVAL);
  }
})();
