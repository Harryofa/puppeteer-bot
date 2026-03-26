const puppeteer = require("puppeteer");
const http = require("http");

// ================= CONFIG =================
const FIXTURES_URL = "https://m.betking.com/en-ng/virtuals/scheduled/leagues/kings-league";
const RESULTS_URL = "https://m.betking.com/virtual/league/kings-league/results";
const INTERVAL_MS = 170 * 1000; // 2m 50s cycle

const GREEN = "\x1b[32m";
const RED = "\x1b[31m";
const YELLOW = "\x1b[33m";
const RESET = "\x1b[0m";

const picks = {}; 

// ---------- HEALTH CHECK SERVER FOR RENDER ----------
http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Bot is Active and Monitoring BetKing...\n');
}).listen(process.env.PORT || 3000);

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

// ---------- SCRAPE WEEK NUMBER ----------
async function scrapeWeekNumber(page) {
  return await page.evaluate(() => {
    const span = Array.from(document.querySelectorAll("span"))
      .find(s => /week\s+\d+/i.test(s.innerText));
    if (!span) return null;
    const m = span.innerText.match(/week\s+(\d+)/i);
    return m ? parseInt(m[1], 10) : null;
  });
}

// ---------- SCRAPE HIGHEST DC12 ----------
async function scrapeHighestDC12(browser) {
  const page = await browser.newPage();
  try {
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36');
    await page.goto(FIXTURES_URL, { waitUntil: "networkidle2", timeout: 60000 });

    const weekNumber = await scrapeWeekNumber(page);

    const dcTab = await page.waitForSelector('[data-testid="double-chance-market"]', { timeout: 10000 });
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

        if (home && away && odds.length >= 2) {
          const dc12 = parseFloat(odds[1].innerText.trim()); 
          if (!isNaN(dc12) && (!best || dc12 > best.dc12)) {
            best = { home, away, dc12 };
          }
        }
      });
      return best;
    });

    return pick ? { ...pick, week: weekNumber } : null;
  } catch (e) {
    console.log(RED + "Scrape Error: " + e.message + RESET);
    return null;
  } finally {
    await page.close();
  }
}

// ---------- CHECK RESULTS ----------
async function reconcileResults(browser) {
  const page = await browser.newPage();
  try {
    await page.goto(RESULTS_URL, { waitUntil: "domcontentloaded", timeout: 60000 });
    await page.waitForSelector('[data-testid="results-home-team"]', { timeout: 15000 });

    return await page.evaluate((currentPicks) => {
      const results = [];
      const rows = document.querySelectorAll(".mvs-results-list__item, .row");

      rows.forEach(row => {
        const home = row.querySelector('[data-testid="results-home-team"]')?.innerText.trim();
        const away = row.querySelector('[data-testid="results-away-team"]')?.innerText.trim();
        const ft = row.querySelector('[data-testid="results-ft"]')?.innerText.trim();
        
        if (!home || !away || !ft) return;

        for (const [fixture, pick] of Object.entries(currentPicks)) {
            if (pick.status !== "PENDING") continue;
            
            if (home === pick.home && away === pick.away) {
                const score = ft.split('-').map(s => parseInt(s.trim()));
                const outcome = score[0] !== score[1] ? "WIN" : "LOSE";
                results.push({ fixture, ft, outcome });
            }
        }
      });
      return results;
    }, picks);
  } catch (e) {
    return [];
  } finally {
    await page.close();
  }
}

// ---------- MAIN LOOP ----------
(async () => {
  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"]
  });

  console.log(YELLOW + "🚀 Bot started. Tracking Kings League..." + RESET);

  while (true) {
    try {
      const pick = await scrapeHighestDC12(browser);
      if (pick) {
        const fixture = `${pick.home} vs ${pick.away}`;
        if (!picks[fixture]) {
          picks[fixture] = { ...pick, status: "PENDING" };
          console.log(`🎯 [WEEK ${pick.week ?? '?'}] NEW PICK: ${fixture} | DC12 @ ${pick.dc12}`);
        }
      }

      const updates = await reconcileResults(browser);
      updates.forEach(upd => {
        if (picks[upd.fixture]) {
          picks[upd.fixture].status = upd.outcome;
          const color = upd.outcome === "WIN" ? GREEN : RED;
          console.log(`${color}🏁 RESULT: ${upd.fixture} | Score: ${upd.ft} | ${upd.outcome}${RESET}`);
          
          // Optional: delete from memory after result found to save space
          // delete picks[upd.fixture]; 
        }
      });

    } catch (err) {
      console.error("Loop Error:", err);
    }
    await sleep(INTERVAL_MS);
  }
})();
