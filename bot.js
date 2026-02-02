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

console.log("🚀 BetKing Kings League DC12 Bot Started");

// ---------- SCRAPE WEEK ----------
async function scrapeWeek(page) {
  return await page.evaluate(() => {
    const span = [...document.querySelectorAll("span")]
      .find(s => /week\s+\d+/i.test(s.innerText));
    if (!span) return "?";
    const m = span.innerText.match(/week\s+(\d+)/i);
    return m ? m[1] : "?";
  });
}

// ---------- SCRAPE HIGHEST DC12 ----------
async function getHighestDC12(page) {
  return await page.evaluate(() => {
    const week = document.querySelector("mvs-match-week");
    if (!week) return null;

    let best = null;

    week.querySelectorAll('div[data-testid="match-content"]').forEach(match => {
      const home = match.querySelector('[data-testid="match-home-team"]')?.innerText.trim();
      const away = match.querySelector('[data-testid="away-home-team"]')?.innerText.trim();
      const odds = match.querySelectorAll('span[data-testid="match-odd-value"]');

      if (!home || !away || odds.length !== 3) return;

      const dc12 = parseFloat(odds[1].innerText);
      if (isNaN(dc12)) return;

      if (!best || dc12 > best.dc12) {
        best = { home, away, dc12 };
      }
    });

    return best;
  });
}

// ---------- CHECK RESULT ----------
async function checkResult(page, pick) {
  return await page.evaluate(pick => {
    const rows = document.querySelectorAll(".row");

    for (const row of rows) {
      const home = row.querySelector('[data-testid="results-home-team"]')?.innerText.trim();
      const away = row.querySelector('[data-testid="results-away-team"]')?.innerText.trim();

      if (
        (home === pick.home && away === pick.away) ||
        (home === pick.away && away === pick.home)
      ) {
        const ft = row.querySelector('[data-testid="results-ft"]')?.innerText;
        if (!ft) return null;

        const m = ft.match(/(\d+)\s*-\s*(\d+)/);
        if (!m) return null;

        const hg = +m[1];
        const ag = +m[2];

        return {
          ft,
          outcome: hg === ag ? "LOSE" : "WIN"
        };
      }
    }

    return null;
  }, pick);
}

// ---------- MAIN ----------
(async () => {
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"]
  });

  const page = await browser.newPage();

  // 1️⃣ FIXTURES
  await page.goto(FIXTURES_URL, { waitUntil: "networkidle2" });
  const week = await scrapeWeek(page);
  const pick = await getHighestDC12(page);

  if (!pick) {
    console.log("❌ No DC12 pick found");
    await browser.close();
    return;
  }

  console.log(
    `🎯 WEEK ${week} PICK → ${pick.home} vs ${pick.away} | DC12 @ ${pick.dc12}`
  );

  // 2️⃣ RESULTS
  await page.goto(RESULTS_URL, { waitUntil: "domcontentloaded" });
  const result = await checkResult(page, pick);

  if (!result) {
    console.log("⏳ Result not yet available");
  } else {
    const color = result.outcome === "WIN" ? GREEN : RED;
    console.log(
      `${color}🏁 RESULT → ${pick.home} vs ${pick.away} | ${result.ft} → ${result.outcome}${RESET}`
    );
  }

  await browser.close();
  console.log("✅ Bot finished successfully");
})();
