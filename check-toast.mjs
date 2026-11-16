import puppeteer from 'puppeteer-core';
const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new' });
const page = await browser.newPage();
await page.setViewport({ width: 1280, height: 900 });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
await page.goto('http://localhost:5000/#/login', { waitUntil: 'networkidle0' });

const toastInfo = () => page.evaluate(() => {
  const t = document.querySelector('.toast');
  if (!t) return null;
  const cs = getComputedStyle(t);
  return {
    type: [...t.classList].find((c) => c !== 'toast' && c !== 'is-leaving'),
    title: t.querySelector('.toast-title')?.textContent,
    message: t.querySelector('.toast-message')?.textContent,
    bg: cs.backgroundColor,
    color: cs.color,
    topLayer: Boolean(t.closest('[popover]')?.matches(':popover-open')),
    stackBox: t.closest('.toast-stack').getBoundingClientRect().toJSON(),
  };
});

// 1. Demo card should fill, not log in.
const demoBefore = await page.$eval('.demo-account', (el) => el.textContent);
await page.click('.demo-account');
await new Promise((r) => setTimeout(r, 300));
const demo = await page.evaluate(() => ({
  hash: location.hash,
  phone: document.querySelector('#login-phone').value,
  password: document.querySelector('#login-password').value,
  stillOnLogin: Boolean(document.querySelector('.auth-form')),
}));
const infoToast = await toastInfo();

// 2. Wrong password -> error toast.
await page.$eval('#login-password', (el) => { el.value = 'salah'; });
await page.click('.auth-submit');
await new Promise((r) => setTimeout(r, 300));
const errToasts = await page.$$eval('.toast.error', (els) => els.map((el) => ({
  title: el.querySelector('.toast-title')?.textContent,
  message: el.querySelector('.toast-message')?.textContent,
  role: el.getAttribute('role'),
})));

// 3. Real login, then dialog error should surface above modal.
await page.$eval('#login-password', (el) => { el.value = 'admin123'; });
await page.click('.auth-submit');
await page.waitForFunction(() => location.hash.includes('/admin'));
await page.goto('http://localhost:5000/#/pengguna', { waitUntil: 'networkidle0' });
await page.waitForSelector('.btn.primary');
await page.evaluate(() => {
  [...document.querySelectorAll('button')].find((b) => /tambah pengguna/i.test(b.textContent))?.click();
});
await page.waitForSelector('dialog[open] #user-form');
await page.evaluate(() => document.querySelector('dialog[open] button[type=submit]')?.click());
await new Promise((r) => setTimeout(r, 350));
const dialogToast = await page.evaluate(() => {
  const t = document.querySelector('.toast');
  if (!t) return null;
  const box = t.getBoundingClientRect();
  const hit = document.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2);
  return {
    message: t.querySelector('.toast-message')?.textContent,
    aboveDialog: Boolean(hit && t.contains(hit)),
    dialogOpen: Boolean(document.querySelector('dialog[open]')),
    stackPopover: t.closest('[popover]')?.matches(':popover-open') ?? false,
  };
});

// 4. Dark mode toast.
await page.evaluate(() => { document.documentElement.dataset.theme = 'dark'; });
await new Promise((r) => setTimeout(r, 200));
const darkToast = await page.evaluate(() => {
  const t = document.querySelector('.toast');
  const cs = getComputedStyle(t);
  return { bg: cs.backgroundColor, title: getComputedStyle(t.querySelector('.toast-title')).color, message: getComputedStyle(t.querySelector('.toast-message')).color, accent: cs.borderLeftColor };
});

console.log(JSON.stringify({ demoBefore, demo, infoToast, errToasts, dialogToast, darkToast, errors }, null, 2));
await browser.close();
