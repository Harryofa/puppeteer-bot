import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import express from 'express';
import fs from 'fs';
import path from 'path';

puppeteer.use(StealthPlugin());

const app = express();
const PORT = process.env.PORT || 3000;
const CSV_PATH = path.join('/tmp', `betking_virtuals_${Date.now()}.csv`);

app.get('/', (req, res) => {
  res.send(`
    <h1>BetKing Virtual Scraper (Render)</h1>
    <p><a href="/scrape">🚀 Start scraping BetKing Virtuals</a></p>
    <p><a href="/download">📥 Download latest CSV</a></p>
  `);
});

app.get('/scrape', async (req, res) => {
  try {
    console.log('Starting BetKing Virtual scrape...');
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
    });

    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 Chrome/130 Mobile Safari/537.36');

    // Main virtuals page (mobile version works better for scraping)
    await page.goto('https://m.betking.com/virtual', { waitUntil: 'networkidle2', timeout: 90000 });

    // Try to go to a specific instant league (e.g. Kings InstaLeague) — adjust if needed
    // You may need to click "Virtual" tab or select a league first
    await page.waitForTimeout(5000);

    // Look for "Results", "History", "Recent Bets" or "Past Matches" button
    const historySelectors = ['text=Results', 'text=History', 'text=Recent', 'text=Past', '[data-testid*="result"]'];
    for (const sel of historySelectors) {
      try {
        await page.click(sel);
        await page.waitForTimeout(4000);
        break;
      } catch (e) {}
    }

    let all = [], stuck = 0;
    while (stuck < 10) {
      const batch = await page.evaluate(() => 
        Array.from(document.querySelectorAll('.match-item, .event, .fixture, .history-row, [class*="match"], [class*="result"]')).map(el => {
          const scoreEl = el.querySelector('.score, .result, .goals, .ft') || el.querySelector('span[class*="score"]');
          const scoreText = scoreEl ? scoreEl.innerText.trim() : '';
          if (!scoreText || !scoreText.includes('-')) return null;

          const [h, a] = scoreText.split('-').map(x => parseInt(x.trim()));
          if (isNaN(h) || isNaN(a)) return null;

          return {
            league: el.querySelector('.league, .competition, .title')?.innerText.trim() || 'BetKing Virtual',
            round: el.querySelector('.round, .week, .fixture-info')?.innerText.trim() || '',
            home: el.querySelector('.home, .team-home, .home-team')?.innerText.trim() || '',
            away: el.querySelector('.away, .team-away, .away-team')?.innerText.trim() || '',
            h, a
          };
        }).filter(Boolean)
      );

      all = [...all, ...batch];
      console.log(`Collected: ${all.length} BetKing virtual matches`);

      const oldHeight = await page.evaluate('document.body.scrollHeight');
      await page.evaluate('window.scrollTo(0, document.body.scrollHeight)');
      await page.waitForTimeout(4000);
      if (oldHeight === await page.evaluate('document.body.scrollHeight')) stuck++;
      else stuck = 0;
    }

    const unique = [...new Map(all.map(m => [`${m.league}${m.round}${m.home}${m.away}`, m])).values()];

    const csv = 'league,round,home_team,away_team,home_goals,away_goals\n' +
      unique.map(m => `${m.league},${m.round},"${m.home}","${m.away}",${m.h},${m.a}`).join('\n');

    fs.writeFileSync(CSV_PATH, csv);

    console.log(`✅ SUCCESS! ${unique.length} BetKing virtual matches saved`);
    await browser.close();

    res.send(`<h2>✅ Scraped ${unique.length} BetKing virtual matches!</h2><p><a href="/download">Download CSV</a></p>`);
  } catch (err) {
    console.error('Scrape error:', err);
    res.status(500).send('Error during scrape: ' + err.message);
  }
});

app.get('/download', (req, res) => {
  if (fs.existsSync(CSV_PATH)) {
    res.download(CSV_PATH, 'betking_virtual_history.csv');
  } else {
    res.send('No CSV yet — visit /scrape first');
  }
});

app.listen(PORT, () => console.log(`🚀 BetKing Virtual Scraper running on port ${PORT}`));
