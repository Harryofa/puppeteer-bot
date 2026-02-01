const puppeteer = require("puppeteer");

// ================= CONFIG =================
const FIXTURES_URL =
  "https://m.betking.com/en-ng/virtuals/scheduled/leagues/kings-league";
const RESULTS_URL =
  "https://m.betking.com/virtual/league/kings-league/results";
// =========================================

// ANSI COLORS
const GREEN = "\x1b[32m";
const RED = "\x1b[31m";
const RESET = "\x1b[0m";

// Store picks (in-memory for this run)
const picks = {};

console.log("🏟️ Kings League DC12 ROUND TRACKER (GitHub Actions Mode)");

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

// ---------- SCRAPE HIGHEST DC12 (CURRENT ROUND) ----------
async function scrapeHighestDC12(browser) {
  const page = await browser.newPage();

  await page.goto(FIXTURES_URL, {
    waitUntil: "networkidle2",
    timeout: 0,
  });

  const weekNumber = await scrapeWeekNumber(page);

  await page.waitForSelector('span[data-testid="match-odd-value"]', {
    timeout: 0,
  });

  const pick = await page.evaluate(() => {
    let best = null;

    document
      .querySelectorAll('div[data-testid="match-content"]')
      .forEach(match => {
        const home = match.querySelector(
          '[data-testid="match-home-team"]'
        )?.innerText.trim();

        const away = match.querySelector(
          '[data-testid="away-home-team"]'
        )?.innerText.trim();

        const odds = match.querySelectorAll(
          'span[data-testid="match-odd-value"]'
        );

        if (!home || !away || odds.length < 3) return;

        const dc12 = parseFloat(odds[1].innerText.trim());
        if (isNaN(dc12)) return;

        if (!best || dc12 > best.dc12) {
          best = { home, away, dc12 };
        }
      });

    return best;
  });

  await page.close();

  if (!pick) return null;
  return { ...pick, week: weekNumber };
}

// ---------- CHECK RESULTS ----------
async function reconcileResults(browser) {
  const page = await browser.newPage();

  await page.goto(RESULTS_URL, {
    waitUntil: "domcontentloaded",
    timeout: 0,
  });

  await page.waitForSelector('[data-testid="results-home-team"]', {
    timeout: 0,
  });

  const updates = await page.evaluate(picks => {
    const rows = Array.from(document.querySelectorAll(".row"));
    const results = [];

    for (const [fixture, pick] of Object.entries(picks)) {
      for (const row of rows) {
        const home = row.querySelector(
          '[data-testid="results-home-team"]'
        )?.innerText.trim();

        const away = row.querySelector(
          '[data-testid="results-away-team"]'
        )?.innerText.trim();

        if (!home || !away) continue;

        const sameMatch =
          (home === pick.home && away === pick.away) ||
          (home === pick.away && away === pick.home);

        if (!sameMatch) continue;

        const ft = row.querySelector(
          '[data-testid="results-ft"]'
        )?.innerText.trim();

        if (!ft) continue;

        const m = ft.match(/(\d+)\s*-\s*(\d+)/);
        if (!m) continue;

        const hg = +m[1];
        const ag = +m[2];

        results.push({
          fixture,
          ft,
          outcome: hg === ag ? "LOSE" : "WIN",
        });
      }
    }

    return results;
  }, picks);

  await page.close();
  return updates;
}

// ---------- SINGLE RUN (GITHUB ACTIONS SAFE) ----------
(async () => {
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  console.log("\n⏱ RUNNING BETKING DC12 BOT\n");

  try {
    // Pick current round
    const pick = await scrapeHighestDC12(browser);

    if (pick) {
      const fixture = `${pick.home} vs ${pick.away}`;
      picks[fixture] = { ...pick };

      console.log(
        `🎯 WEEK ${pick.week ?? "?"} PICK → ${fixture} | DC12 @ ${pick.dc12}`
      );
    }

    // Check previous results
    const results = await reconcileResults(browser);

    results.forEach(r => {
      const colour = r.outcome === "WIN" ? GREEN : RED;
      console.log(
        `${colour}🏁 RESULT → ${r.fixture} | ${r.ft} → ${r.outcome}${RESET}`
      );
    });
  } catch (err) {
    console.error("⚠️ ERROR:", err.message);
  }

  await browser.close();
})();
