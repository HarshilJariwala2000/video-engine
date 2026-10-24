#!/usr/bin/env node
// Automated sanity check of a video's animation code:
//   1. type-checks it
//   2. boots its Motion Canvas editor headless and loads the project
//   3. reports runtime errors and compares the project length with the audio timings
//
//   npm run check 002-redis
import {spawn, spawnSync} from 'node:child_process';
import fs from 'node:fs';
import net from 'node:net';
import path from 'node:path';
import {chromium} from 'playwright-core';
import {ROOT, resolveVideo} from './lib/video.mjs';

const {slug, dir} = resolveVideo();
let failed = false;

// 1) types
const tc = spawnSync(process.execPath, [path.join(ROOT, 'tools/typecheck.mjs'), slug], {stdio: 'inherit'});
if (tc.status) failed = true;

// 2) headless editor
const port = await freePort();
const vite = spawn(process.execPath, [path.join(ROOT, 'node_modules/vite/bin/vite.js'), '--strictPort'], {
  cwd: ROOT, env: {...process.env, VIDEO: slug, EDITOR_PORT: String(port)}, stdio: 'pipe',
});
let viteLog = '';
vite.stdout.on('data', d => (viteLog += d));
vite.stderr.on('data', d => (viteLog += d));
try {
  await waitFor(`http://localhost:${port}`, 30000);
  const browser = await launch();
  const page = await browser.newPage({viewport: {width: 1600, height: 900}});
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  const overruns = [];
  page.on('console', m => {
    const t = m.text();
    if (/past the audio/.test(t)) overruns.push(t.replace(/\s*\{\}\s*$/, ''));
    // the headless editor can't write .meta files back over Vite's socket; harmless here
    else if (m.type() === 'error' && !/updating metadata/.test(t)) errors.push(t);
  });
  await page.goto(`http://localhost:${port}`, {waitUntil: 'load', timeout: 90000});
  // the timeline shows "[frames] hh:mm:ss:ff" once every scene has been run once
  // (it reads "[0] 00:00:00:00" while the project is still loading, so wait for a non-zero length)
  await page.waitForFunction(() => /\[[1-9]\d*\]\s*\d\d:\d\d:\d\d:\d\d/.test(document.body.innerText), null, {timeout: 120000})
    .catch(() => errors.push('editor never finished loading the project (timeline length not shown)'));
  await page.waitForTimeout(1500);
  const text = await page.evaluate(() => document.body.innerText);
  await page.screenshot({path: path.join(dir, 'output', 'check.png')}).catch(() => {});
  await browser.close();

  const durMatch = text.match(/\[([1-9]\d*)\]\s*(\d\d):(\d\d):(\d\d):(\d\d)/);
  const sceneNames = [...new Set(text.match(/scene\d\d/g) ?? [])];
  const timings = JSON.parse(fs.readFileSync(path.join(dir, 'src/timings.json'), 'utf8'));
  const audioTotal = Object.values(timings.scenes).reduce((a, s) => a + s.duration, 0);

  console.log(`\nScenes loaded: ${sceneNames.length} (${Object.keys(timings.scenes).length} in timings.json)`);
  if (durMatch) {
    // the timeline counts frames at the PREVIEW frame rate (project.meta → preview.fps)
    const meta = JSON.parse(fs.readFileSync(path.join(dir, 'src/project.meta'), 'utf8'));
    const fps = meta.preview?.fps ?? 30;
    const secs = Number(durMatch[1]) / fps;
    const diff = secs - audioTotal;
    console.log(`Project length: ${secs.toFixed(2)} s   audio: ${audioTotal.toFixed(2)} s   ` +
      `(${timings.estimated ? 'estimated' : timings.provider ?? 'elevenlabs'})`);
    // each scene is snapped to preview frames, so allow one preview frame per scene
    const tol = (Object.keys(timings.scenes).length + 1) / fps;
    if (Math.abs(diff) > tol) {
      failed = true;
      console.log(`✖ Animation is ${diff > 0 ? 'LONGER' : 'shorter'} than the audio by ${Math.abs(diff).toFixed(2)} s. ` +
        'Check that every scene ends with `yield* s.end()` and no animation runs past its audio.');
    }
  }
  if (overruns.length) {
    failed = true;
    console.log(`✖ Scenes whose animations outlast their narration:\n  ${[...new Set(overruns)].join('\n  ')}`);
  }
  if (errors.length) {
    failed = true;
    console.log(`✖ Runtime errors:\n  ${errors.slice(0, 15).join('\n  ')}`);
  }
} catch (e) {
  failed = true;
  console.log(`✖ ${e.message}\n${viteLog.slice(-2000)}`);
} finally {
  vite.kill();
}
console.log(failed ? '\n✖ check failed' : '\n✔ check passed');
process.exit(failed ? 1 : 0);

async function launch() {
  for (const channel of ['msedge', 'chrome']) {
    try { return await chromium.launch({channel, headless: true}); } catch { /* next */ }
  }
  throw new Error('Need Microsoft Edge or Google Chrome installed');
}
function freePort() {
  return new Promise(res => { const s = net.createServer(); s.listen(0, () => { const p = s.address().port; s.close(() => res(p)); }); });
}
async function waitFor(url, ms) {
  const end = Date.now() + ms;
  while (Date.now() < end) {
    try { if ((await fetch(url)).ok) return; } catch { /* not yet */ }
    await new Promise(r => setTimeout(r, 300));
  }
  throw new Error(`editor did not start at ${url}`);
}
