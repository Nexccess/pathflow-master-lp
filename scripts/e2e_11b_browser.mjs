import { chromium } from 'playwright';

const base = process.env.PATHFLOW_PREVIEW_URL || 'https://pathflow-master-lp-git-11b-integration-nax-naka.vercel.app';
const url = `${base}/p/9/reception`;

async function waitForPreview(page) {
  let lastError;
  for (let i = 0; i < 30; i++) {
    try {
      const res = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });
      if (res && res.ok()) return;
      lastError = new Error(`HTTP ${res?.status()}`);
    } catch (err) {
      lastError = err;
    }
    await page.waitForTimeout(10000);
  }
  throw lastError || new Error('Preview not ready');
}

async function runCase(browser, name, viewport) {
  const context = await browser.newContext({ viewport });
  const page = await context.newPage();
  const consoleErrors = [];
  page.on('console', msg => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });
  page.on('pageerror', err => consoleErrors.push(err.message));

  const trackEvents = [];
  page.on('request', req => {
    if (req.url().includes('/api/track') && req.method() === 'POST') {
      try { trackEvents.push(JSON.parse(req.postData() || '{}').event); } catch {}
    }
  });

  await waitForPreview(page);
  await page.waitForSelector('#questionCard .option', { timeout: 20000 });

  for (let i = 0; i < 5; i++) {
    const options = page.locator('#questionCard .option');
    if (await options.count() < 1) throw new Error(`${name}: no options at step ${i + 1}`);
    await options.first().click();
    const next = page.locator('#nextBtn');
    if (i < 4) {
      await next.click();
      await page.waitForFunction(expected => document.querySelector('#stepLabel')?.textContent?.startsWith(expected), String(i + 2));
    } else {
      await next.click();
    }
  }

  await page.waitForSelector('#result', { state: 'visible', timeout: 30000 });
  const headline = (await page.locator('#headline').textContent())?.trim();
  const summary = (await page.locator('#summary').textContent())?.trim();
  const contactHref = await page.locator('#contact').getAttribute('href');

  if (!headline) throw new Error(`${name}: result headline missing`);
  if (!summary) throw new Error(`${name}: result summary missing`);
  if (contactHref !== 'https://violet.tokyo/salon/yokohama/') throw new Error(`${name}: contact URL mismatch: ${contactHref}`);

  await page.locator('#contact').click({ modifiers: ['Control'] }).catch(async () => {
    await page.locator('#contact').dispatchEvent('click');
  });
  await page.waitForTimeout(500);

  const requiredEvents = ['reception_open','reception_answer','reception_submit','reception_result','store_contact_click'];
  for (const event of requiredEvents) {
    if (!trackEvents.includes(event)) throw new Error(`${name}: tracking event missing: ${event}`);
  }

  if (consoleErrors.length) throw new Error(`${name}: console/page errors: ${consoleErrors.join(' | ')}`);

  console.log(`${name}: PASS`);
  console.log(`- headline: ${headline}`);
  console.log(`- contact: ${contactHref}`);
  console.log(`- tracking events: ${[...new Set(trackEvents)].join(', ')}`);
  await context.close();
}

const browser = await chromium.launch({ headless: true });
try {
  await runCase(browser, 'Desktop', { width: 1440, height: 1000 });
  await runCase(browser, 'Mobile 390x844', { width: 390, height: 844 });
  console.log('11B LIVE BROWSER E2E: PASS');
} finally {
  await browser.close();
}
