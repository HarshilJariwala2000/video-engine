#!/usr/bin/env node
// Renders videos/<video>/thumbnails/thumb-*.html → thumb-*.png (1280×720) and a
// phone-size preview sheet (preview.png) so you can check readability.
// Uses the Edge/Chrome already installed on this machine (playwright-core).
//
//   npm run thumbs 002-redis
//   npm run thumbs 002-redis -- --only thumb-2
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {chromium} from 'playwright-core';
import {resolveVideo} from './lib/video.mjs';

const args = process.argv.slice(2);
const only = args.includes('--only') ? args[args.indexOf('--only') + 1] : null;
const {slug, dir} = resolveVideo(args);
const tdir = path.join(dir, 'thumbnails');
const files = fs.existsSync(tdir)
  ? fs.readdirSync(tdir).filter(f => /^thumb-\d+\.html$/.test(f) && (!only || f.startsWith(only))).sort()
  : [];
if (!files.length) {
  console.error(`✖ No thumbnails/thumb-N.html in videos/${slug}. Ask Claude to design them first.`);
  process.exit(1);
}

const browser = await launch();
const page = await browser.newPage({viewport: {width: 1280, height: 720}, deviceScaleFactor: 1});
const pngs = [];
for (const f of files) {
  await page.goto(pathToFileURL(path.join(tdir, f)).href, {waitUntil: 'networkidle'});
  await page.evaluate(() => document.fonts.ready);
  const out = path.join(tdir, f.replace('.html', '.png'));
  await page.screenshot({path: out, clip: {x: 0, y: 0, width: 1280, height: 720}});
  pngs.push(path.basename(out));
  console.log(`✔ ${path.relative(dir, out)}`);
}

// Phone-size check: how each thumbnail looks in a mobile feed (~360 px wide).
const all = fs.readdirSync(tdir).filter(f => /^thumb-\d+\.png$/.test(f)).sort();
const html = `<body style="margin:0;background:#0f0f0f;font:14px Inter,system-ui;color:#aaa;padding:20px">
  <div style="display:flex;flex-wrap:wrap;gap:24px">${all.map(p => `
    <figure style="margin:0;width:360px">
      <img src="${pathToFileURL(path.join(tdir, p)).href}" style="width:360px;height:203px;border-radius:12px;display:block">
      <figcaption style="margin-top:8px">${p.replace('.png', '')} at phone size</figcaption>
    </figure>`).join('')}</div></body>`;
await page.setViewportSize({width: 40 + all.length * 384, height: 290});
await page.setContent(html, {waitUntil: 'load'});
await page.screenshot({path: path.join(tdir, 'preview.png'), fullPage: true});
console.log(`✔ thumbnails/preview.png (phone-size sheet)`);
await browser.close();

async function launch() {
  for (const channel of ['msedge', 'chrome']) {
    try { return await chromium.launch({channel, headless: true}); } catch { /* try next */ }
  }
  console.error('✖ Need Microsoft Edge or Google Chrome installed for thumbnail rendering.');
  process.exit(1);
}
