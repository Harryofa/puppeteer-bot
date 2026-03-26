const puppeteer = require("puppeteer");
const http = require("http"); // Added for Render health check

// ================= CONFIG =================
const FIXTURES_URL = "https://m.betking.com/en-ng/virtuals/scheduled/leagues/kings-league";
const RESULTS_URL = "https://m.betking.com/virtual/league/kings-league/results";
const INTERVAL_MS = 170 * 1000; 

// ANSI COLORS
const GREEN = "\x1b[32m";
const RED = "\x1b[31m";
const RESET = "\x1b[0m";

const picks = {}; 

// ---------- HEALTH CHECK SERVER ----------
// This prevents Render from marking your deployment as "Failed"
http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('BetKing Bot is Running\n');
}).listen(process.env.PORT || 3000);

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function scrapeWeekNumber(page) {
  return await page.evaluate(() => {
    const span = Array.from(document.querySelectorAll("span"))
      .find(s => /week\s+\d+/i.test(s.innerText));
    if (!span) return null;
    const m = span.innerText.match(/week\s+(\d+)/i);
    return m ? parseInt(m[1], 10) : null;
  });
}

async function scrapeHighestDC12(browser) {
  const page = await browser.newPage();
  // Set User Agent to avoid detection
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36');

  try {
    await page.goto(FIXTURES_URL, { waitUntil: "networkidle2", timeout: 60000 });
    const weekNumber = await scrapeWeekNumber(page);
    const dcTab = await page.$('[data-testid="double-chance-market"]');
    if (dcTab) {
      await dcTab.click();
      await sleep(3000);
    }

    const pick = await page.evaluate(() => {
      const matchRows = document.querySelectorAll('div[data-testid="match-content"]');
      let best = null;
      matchRows.forEach(match => {
        const home = match.querySelector('[data-testid="match-home-team"]')?.innerText.trim();
        const away = match.querySelector('[data-testid="match-away-team"]')?.innerText.trim();
        const odds = match.querySelectorAll('span[data-testid="match-odd-value"]');
        if (!home || !away || odds.length < 2) return;
        const dc12 = parseFloat(odds[1].innerText.trim());
        if (!isNaN(dc12) && (!best || dc12 > best.dc12)) {
          best = { home, away, dc12 };
        }
      });
      return best;
    });
    return pick ? { ...pick, week: weekNumber } : null;
  } catch (e) {
    console.error("Scrape Fixture Error:", e.message);
    return null;
  } finally {
    await page.close();
  }
}

async function reconcileResults(browser) {
  const page = await browser.newPage();
  try {
    await page.goto(RESULTS_URL, { waitUntil: "domcontentloaded", timeout: 60000 });
    await page.waitForSelector('[data-testid="results-home-team"]', { timeout: 15000 });

    const updates = await page.evaluate(currentPicks => {
      const rows = Array.from(document.querySelectorAll(".row, .mvs-results-list__item"));
      const results = [];
      for (const [fixture, pick] of Object.entries(currentPicks)) {
        if (pick.status !== "PENDING") continue;
        for (const row of rows) {
          const home = row.querySelector('[data-testid="results-home-team"]')?.innerText.trim();
          const away = row.querySelector('[data-testid="results-away-team"]')?.innerText.trim();
          if (home === pick.home && away === pick.away) {
            const ft = row.querySelector('[data-testid="results-ft"]')?.innerText.trim();
            if (!ft) continue;
            const scores = ft.split('-').map(s => parseInt(s.trim()));
            results.push({ fixture, ft, outcome: scores[0] === scores[1] ? "LOSE" : "WIN" });
          }
        }
      }
      return results;
    }, picks);
    return updates;
  } catch (e) {
    console.error("Reconcile Error:", e.message);
    return [];
  } finally {
    await page.close();
  }
}

(async () => {
  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"]
  });

  console.log("🚀 Bot started. Monitoring Kings League...");

  while (true) {
    try {
      const pick = await scrapeHighestDC12(browser);
      if (pick) {
        const fixture = `${pick.home} vs ${pick.away}`;
        if (!picks[fixture]) {
          picks[fixture] = { ...pick, status: "PENDING" };
          console.log(`🎯 WEEK ${pick.week ?? "?"} PICK → ${fixture} | DC12 @ ${pick.dc12}`);
        }
      }

      const updates = await reconcileResults(browser);
      updates.forEach(r => {
        if (picks[r.fixture]) {
          picks[r.fixture].status = r.outcome;
          const colour = r.outcome === "WIN" ? GREEN : RED;
          console.log(`${colour}🏁 RESULT → ${r.fixture} | ${r.ft} → ${r.outcome}${RESET}`);
          delete picks[r.fixture]; // Clean up memory
        }
      });
    } catch (err) {
      console.error("⚠️ Loop Error:", err.message);
    }
    await sleep(INTERVAL_MS);
  }
})();
