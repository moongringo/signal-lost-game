const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1400, height: 900 });
  await page.goto('http://localhost:8769/era-v5.html', { waitUntil: 'networkidle0' });
  await page.waitForTimeout(6500);
  await page.screenshot({ path: 'era-v5-main.png', fullPage: false });
  await browser.close();
})();
