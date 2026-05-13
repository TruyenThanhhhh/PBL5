import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.type(), msg.text()));
  page.on('pageerror', error => console.log('BROWSER ERROR:', error.message));
  
  // Navigate to dashboard
  await page.goto('http://localhost:5173/dashboard', { waitUntil: 'networkidle0' }).catch(e => console.log('Nav error:', e.message));
  
  await browser.close();
})();
