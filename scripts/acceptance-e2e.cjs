#!/usr/bin/env node
/*
 * OBEOS Pocket browser acceptance test (optional; needs `playwright` + Chromium, not part of CI).
 *
 *   node scripts/acceptance-e2e.cjs
 *
 * Serves a temporary copy of the runtime files over HTTPS (the app only registers its service
 * worker on https:) with a throwaway self-signed certificate, then drives headless Chromium.
 * It checks: tile safety, service-worker install, offline launch, editing + persistence,
 * rejection of unsafe URLs, restore-defaults, and update behaviour after a simulated redeploy.
 * Exit code 0 only if every check passes. This is a desktop-Chromium check; it is NOT an iOS
 * Safari / Home Screen check.
 */
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const https = require('https');
const { spawnSync } = require('child_process');
const { chromium } = require('playwright');

const root = path.resolve(__dirname, '..');
const RUNTIME = ['index.html', 'styles.css', 'app.js', 'manifest.webmanifest', 'service-worker.js', 'icons/icon-192.png', 'icons/icon-512.png'];
const MIME = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.webmanifest': 'application/manifest+json', '.png': 'image/png' };

let failures = 0;
const check = (name, ok, detail = '') => { console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? '  -- ' + detail : ''}`); if (!ok) failures++; };

(async () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'pocket-e2e-'));
  const site = path.join(tmp, 'site');
  for (const rel of RUNTIME) { fs.mkdirSync(path.dirname(path.join(site, rel)), { recursive: true }); fs.copyFileSync(path.join(root, rel), path.join(site, rel)); }
  const key = path.join(tmp, 'key.pem'), cert = path.join(tmp, 'cert.pem');
  const ssl = spawnSync('openssl', ['req', '-x509', '-newkey', 'rsa:2048', '-nodes', '-keyout', key, '-out', cert, '-days', '1', '-subj', '/CN=localhost', '-addext', 'subjectAltName=DNS:localhost'], { encoding: 'utf8' });
  if (ssl.status !== 0) { console.error(ssl.stderr); process.exit(2); }

  const server = https.createServer({ key: fs.readFileSync(key), cert: fs.readFileSync(cert) }, (req, res) => {
    const rel = decodeURIComponent(new URL(req.url, 'https://x').pathname).replace(/^\//, '') || 'index.html';
    const file = path.join(site, rel);
    if (!file.startsWith(site) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); return res.end('not found'); }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
    fs.createReadStream(file).pipe(res);
  });
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  const base = `https://localhost:${server.address().port}/`;

  const browser = await chromium.launch({ args: ['--ignore-certificate-errors', '--host-resolver-rules=MAP localhost 127.0.0.1'] });
  const context = await browser.newContext({ ignoreHTTPSErrors: true, serviceWorkers: 'allow' });
  const page = await context.newPage();
  page.on('dialog', d => d.accept());
  const pageErrors = []; page.on('pageerror', e => pageErrors.push(String(e)));

  try {
    // 1. First load + tile safety
    await page.goto(base); await page.waitForSelector('#tool-grid a, #tool-grid [href]');
    const tiles = await page.$$eval('#tool-grid a', as => as.map(a => ({ href: a.href, rel: a.rel, target: a.target })));
    check('renders default tiles', tiles.length >= 6, `${tiles.length} tiles`);
    check('every tile link is https without credentials', tiles.every(t => { const u = new URL(t.href); return u.protocol === 'https:' && !u.username && !u.password; }));
    check('every tile opens safely (noopener noreferrer)', tiles.every(t => /noopener/.test(t.rel) && /noreferrer/.test(t.rel)));
    check('no credential-bearing text in shipped files', RUNTIME.filter(f => /\.(html|js|css|webmanifest)$/.test(f)).every(f => !/(?:token|secret|password|apikey|api_key)\s*[:=]\s*['"][^'"]{6,}/i.test(fs.readFileSync(path.join(root, f), 'utf8'))));

    // 1b. iPhone home-screen app: installed-app tiles say so; desktop tiles do not
    const desk = await page.$$eval('#tool-grid .tile-sub', els => els.map(e => e.textContent));
    check('desktop shows no home-screen hint', !desk.includes('Open from your home screen'));
    const ios = await browser.newContext({ ignoreHTTPSErrors: true, serviceWorkers: 'block', userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148' });
    await ios.addInitScript(() => Object.defineProperty(navigator, 'standalone', { value: true }));
    const ip = await ios.newPage(); await ip.goto(base); await ip.waitForSelector('#tool-grid a');
    const iosSubs = await ip.$$eval('#tool-grid .tile', els => els.map(e => ({ name: e.querySelector('.tile-name').textContent, sub: e.querySelector('.tile-sub').textContent, tag: e.tagName, href: e.href || '' })));
    const linkTile = iosTile => iosTile.find(t => t.name === 'THE LINK');
    check('iPhone home-screen app: THE LINK says "Open from your home screen"', linkTile(iosSubs).sub === 'Open from your home screen');
    check('iPhone THE LINK tile is still a working link', linkTile(iosSubs).tag === 'A' && linkTile(iosSubs).href.startsWith('https://linkinobeos'));
    check('iPhone: other tiles unchanged', iosSubs.find(t => t.name === 'Netlify').sub === 'Manage web deployments');
    await ios.close();

    // 2. Service worker installs and caches the shell
    await page.evaluate(() => navigator.serviceWorker.ready);
    await page.reload(); await page.waitForSelector('#tool-grid a');
    const cached = await page.evaluate(async () => { const names = await caches.keys(); const c = await caches.open(names[0]); return { names, count: (await c.keys()).length }; });
    check('service worker active and controlling', await page.evaluate(() => !!navigator.serviceWorker.controller));
    check('shell cache created', cached.names.length === 1 && /^obeos-pocket-shell-/.test(cached.names[0]) && cached.count >= 6, JSON.stringify(cached));

    // 3. Offline launch of the app shell
    await context.setOffline(true);
    await page.reload(); await page.waitForSelector('#tool-grid a');
    check('launches offline from cached shell', (await page.$$('#tool-grid a')).length >= 6);
    check('offline state shown to the user', /OFFLINE/.test(await page.textContent('#network-label')));
    await context.setOffline(false);

    // 4. Edit destination, persistence, rejection, restore
    await page.click('#edit-links');
    const firstName = await page.$eval('#editor-fields input', i => i.name);
    await page.fill(`input[name="${firstName}"]`, 'https://example.org/custom-path');
    await page.click('#editor-form button[type="submit"]');
    check('saves an edited https destination', (await page.$$eval('#tool-grid a', as => as.map(a => a.href))).includes('https://example.org/custom-path'));
    await page.reload(); await page.waitForSelector('#tool-grid a');
    check('edited destination persists after reload', (await page.$$eval('#tool-grid a', as => as.map(a => a.href))).includes('https://example.org/custom-path'));
    for (const bad of ['http://insecure.example/', 'https://user:pass@example.org/', 'javascript:alert(1)']) {
      await page.click('#edit-links');
      await page.$eval(`input[name="${firstName}"]`, (i, v) => { i.type = 'text'; i.value = v; }, bad);
      await page.click('#editor-form button[type="submit"]');
      const shown = await page.isVisible('#form-error');
      const stored = await page.evaluate(() => JSON.stringify(Object.assign({}, localStorage)));
      check(`rejects unsafe URL ${bad.split(':')[0]}://…`, shown && !stored.includes(bad.replace(/^(\w+:)\/*/, '')) && !(await page.$$eval('#tool-grid a', as => as.some(a => a.href.startsWith('http://') || a.href.startsWith('javascript:')))));
      await page.click('#close-editor');
    }
    await page.click('#edit-links'); await page.click('#reset-links');
    check('restore defaults clears customisation', !(await page.$$eval('#tool-grid a', as => as.map(a => a.href))).includes('https://example.org/custom-path') && (await page.evaluate(() => localStorage.length)) === 0);

    // 5. Redeploy: new shell version must replace the old cache and content
    const bumped = fs.readFileSync(path.join(site, 'service-worker.js'), 'utf8').replace('obeos-pocket-shell-v4', 'obeos-pocket-shell-v5');
    fs.writeFileSync(path.join(site, 'service-worker.js'), bumped);
    fs.writeFileSync(path.join(site, 'index.html'), fs.readFileSync(path.join(site, 'index.html'), 'utf8').replace('</title>', ' REDEPLOYED</title>'));
    await page.reload(); await page.waitForTimeout(2500); await page.reload(); await page.waitForTimeout(1500);
    const after = await page.evaluate(async () => ({ names: await caches.keys(), title: document.title }));
    check('redeployed content is served when online', /REDEPLOYED/.test(after.title), after.title);
    check('old shell cache removed, new cache active', after.names.length === 1 && after.names[0] === 'obeos-pocket-shell-v5', JSON.stringify(after.names));
    await context.setOffline(true); await page.reload(); await page.waitForSelector('#tool-grid a');
    check('updated shell also launches offline', /REDEPLOYED/.test(await page.title()));
    await context.setOffline(false);

    check('no uncaught page errors', pageErrors.length === 0, pageErrors.join(' | '));
  } catch (e) {
    check('acceptance run completed without an exception', false, String(e && e.stack || e));
  } finally {
    await browser.close(); server.close();
  }
  console.log(failures === 0 ? '\nALL CHECKS PASSED' : `\n${failures} CHECK(S) FAILED`);
  process.exit(failures === 0 ? 0 : 1);
})();
