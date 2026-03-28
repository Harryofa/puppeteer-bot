import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import express from 'express';
import fs from 'fs';
import path from 'path';

puppeteer.use(StealthPlugin());

const app = express();
const PORT = process.env.PORT || 3000;
const CSV_PATH = path.join('/tmp', `betking_virtuals_${Date.now()}.csv`);

app.get('/', (req, res) => res.send(`
  <h1>BetKing Virtual Scraper</h1>
  <p><a href="/scrape">Start Scraping BetKing Virtuals</a></p>
  <p><a href="/download">Download CSV</a></p>
`));

app.get('/scrape', async (req, res) => {
  try {
    console.log('Launching browser for BetKing...');
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu', '--single-process'],
      timeout: 60000
    });

    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 Chrome/130.0.0.0 Mobile Safari/537.36');
    
    await page.goto('https://m.betking.com/virtual', { waitUntil: 'networkidle2', timeout: 120000 });
    await page.waitForTimeout(8000);

    // Try common history/results buttons
    const historyTexts = ['Results', 'History', 'Recent', 'Past Matches', 'Last Results'];
    for (const text of historyTexts) {
      try {
        await page.click(`text=${text}`);
        await page.waitForTimeout(5000);
        break;
      } catch (e) { /* continue */ }
    }

    let all = [], stuck = 0;
    while (stuck < 10) {
      const batch = await page.evaluate(() => 
        Array.from(document.querySelectorAll('.match, .event, .fixture, .row, [class*="match"], [class*="result"]')).map(el => {
          const scoreText = el.querySelector('.score, .result, .goals, .ft')?.innerText.trim() || '';
          if (!scoreText.includes('-')) return null;
          const [h, a] = scoreText.split('-').map(x => parseInt(x.trim()));
          if (isNaN(h) || isNaN(a)) return null;
          return {
            league: el.querySelector('.league, .competition, .title, .name')?.innerText.trim() || 'BetKing Virtual',
            round: el.querySelector('.round, .week, .time')?.innerText.trim() || '',
            home: el.querySelector('.home, .team1, .home-team')?.innerText.trim() || '',
            away: el.querySelector('.away, .team2, .away-team')?.innerText.trim() || '',
            h, a
          };
        }).filter(Boolean)
      );

      all = [...all, ...batch];
      console.log(`Collected ${all.length} matches so far`);

      const old = await page.evaluate('document.body.scrollHeight');
      await page.evaluate('window.scrollTo(0, document.body.scrollHeight)');
      await page.waitForTimeout(4500);
      if (old === await page.evaluate('document.body.scrollHeight')) stuck++;
      else stuck = 0;
    }

    const unique = [...new Map(all.map(m => [`${m.league}${m.round}${m.home}${m.away}`, m])).values()];

    const csv = 'league,round,home_team,away_team,home_goals,away_goals\n' +
      unique.map(m => `${m.league},${m.round},"${m.home}","${m.away}",${m.h},${m.a}`).join('\n');

    fs.writeFileSync(CSV_PATH, csv);
    console.log(`✅ Saved ${unique.length} unique BetKing matches`);

    await browser.close();
    res.send(`<h2>Success! ${unique.length} matches scraped.</h2><a href="/download">Download CSV</a>`);
  } catch (err) {
    console.error(err);
    res.status(500).send('Scrape failed: ' + err.message);
  }
});

app.get('/download', (req, res) => {
  if (fs.existsSync(CSV_PATH)) res.download(CSV_PATH);
  else res.send('No CSV yet. Visit /scrape first.');
});

app.listen(PORT, () => console.log(`BetKing scraper running on port ${PORT}`));
