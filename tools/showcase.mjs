#!/usr/bin/env node
// Builds and renders the channel-kit showcase: one short demo video per intro
// (hook → intro → summary → end card), so you can watch how each intro sits in
// a real video before choosing brand.json "defaultIntro".
//
//   npm run showcase              all intros   → showcase/output/intro-A.mp4 …
//   npm run showcase -- B         just one
//   npm run showcase -- --no-render   voice + timings only
//   npm run showcase -- --estimate    no TTS: silent narration, word-count timings (visual check)
//
// Needs the local voice (starts tts/server.py if it isn't running) and Edge/Chrome.
import {spawn, spawnSync} from 'node:child_process';
import fs from 'node:fs';
import net from 'node:net';
import path from 'node:path';
import {chromium} from 'playwright-core';
import {ROOT, loadEnv} from './lib/video.mjs';

loadEnv();
const args = process.argv.slice(2);
const BRAND = JSON.parse(fs.readFileSync(path.join(ROOT, 'shared/brand/brand.json'), 'utf8'));
const which = args.filter(a => !a.startsWith('--')).map(a => a.toUpperCase());
const intros = which.length ? which : Object.keys(BRAND.intros);
const SHOW = path.join(ROOT, 'showcase');
const OUTPUT = path.join(SHOW, 'output');
const TTS_URL = (process.env.TTS_URL || 'http://127.0.0.1:7861').replace(/\/$/, '');
fs.mkdirSync(OUTPUT, {recursive: true});

// 1) demo folders from the template (audio cache is shared, so each line is synthesized once)
const sharedCache = path.join(SHOW, '.cache');
fs.mkdirSync(sharedCache, {recursive: true});
for (const x of intros) {
  const dir = path.join(SHOW, `demo-${x.toLowerCase()}`);
  fs.rmSync(path.join(dir, 'src'), {recursive: true, force: true});
  fs.cpSync(path.join(SHOW, '_demo'), dir, {recursive: true});
  const script = path.join(dir, 'narration/script.mjs');
  fs.writeFileSync(script, fs.readFileSync(script, 'utf8').replace('__INTRO__', x));
  fs.mkdirSync(path.join(dir, 'audio'), {recursive: true});
}

// 2) voice
const ESTIMATE = args.includes('--estimate');
let tts = null;
if (!ESTIMATE && !(await health())) {
  console.log('▶ starting the local voice server …');
  const py = path.join(ROOT, 'tts/.venv', process.platform === 'win32' ? 'Scripts/python.exe' : 'bin/python');
  tts = spawn(py, ['server.py'], {cwd: path.join(ROOT, 'tts'), stdio: 'ignore'});
  for (let i = 0; i < 180 && !(await health()); i++) await sleep(1000);
}
for (const x of intros) {
  const rel = `showcase/demo-${x.toLowerCase()}`;
  // reuse lines the previous demo already synthesized
  fs.cpSync(sharedCache, path.join(ROOT, rel, 'audio/cache'), {recursive: true});
  const r = spawnSync(process.execPath, [path.join(ROOT, 'tools/voiceover.mjs'), rel, ...(ESTIMATE ? ['--estimate'] : [])], {cwd: ROOT, stdio: 'inherit'});
  if (r.status) fail(`voiceover failed for ${rel}`);
  if (ESTIMATE) fs.rmSync(path.join(ROOT, rel, 'audio/voiceover.wav'), {force: true});
  else fs.cpSync(path.join(ROOT, rel, 'audio/cache'), sharedCache, {recursive: true});
}
if (tts) tts.kill();

// 3) render through the Motion Canvas editor, headless
if (!args.includes('--no-render')) {
  for (const x of intros) {
    const rel = `showcase/demo-${x.toLowerCase()}`;
    const file = await render(rel);
    const dest = path.join(OUTPUT, `intro-${x}.mp4`);
    fs.copyFileSync(file, dest);
    console.log(`✔ ${path.relative(ROOT, dest)}`);
  }
}

async function render(rel) {
  const outDir = path.join(ROOT, rel, 'output');
  fs.rmSync(outDir, {recursive: true, force: true});
  const port = await freePort();
  const vite = spawn(process.execPath, [path.join(ROOT, 'node_modules/vite/bin/vite.js'), '--strictPort'],
    {cwd: ROOT, env: {...process.env, VIDEO: rel, EDITOR_PORT: String(port)}, stdio: 'ignore'});
  try {
    for (let i = 0; i < 60; i++) { try { if ((await fetch(`http://localhost:${port}`)).ok) break; } catch {} await sleep(500); }
    const browser = await launch();
    const page = await browser.newPage({viewport: {width: 1600, height: 900}});
    page.on('pageerror', e => console.log(`  ! ${e.message}`));
    await page.goto(`http://localhost:${port}`, {waitUntil: 'load', timeout: 90000});
    await page.waitForFunction(() => /\[\d+\]\s*\d\d:\d\d:\d\d:\d\d/.test(document.body.innerText), null, {timeout: 120000});
    console.log(`▶ rendering ${rel} …`);
    await page.getByRole('button', {name: /^render$/i}).first().click();
    // the button reads ABORT while rendering and RENDER again when the file is finalised
    await page.getByRole('button', {name: /^abort$/i}).first().waitFor({timeout: 60000});
    const t0 = Date.now();
    await page.getByRole('button', {name: /^render$/i}).first().waitFor({timeout: 45 * 60000});
    console.log(`  rendered in ${Math.round((Date.now() - t0) / 1000)}s`);
    await sleep(1500);
    await browser.close();
    const mp4 = fs.readdirSync(outDir).find(f => f.endsWith('.mp4'));
    if (!mp4) fail(`no mp4 rendered for ${rel}`);
    return path.join(outDir, mp4);
  } finally {
    vite.kill();
  }
}

async function health() {
  try { return (await fetch(`${TTS_URL}/health`, {signal: AbortSignal.timeout(1500)})).ok; } catch { return false; }
}
async function launch() {
  for (const channel of ['msedge', 'chrome']) {
    try { return await chromium.launch({channel, headless: true, args: ['--enable-gpu', '--ignore-gpu-blocklist', '--use-angle=d3d11']}); } catch { /* next */ }
  }
  fail('Need Microsoft Edge or Google Chrome installed');
}
function freePort() {
  return new Promise(res => { const s = net.createServer(); s.listen(0, () => { const p = s.address().port; s.close(() => res(p)); }); });
}
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
function fail(msg) { console.error(`\n✖ ${msg}\n`); process.exit(1); }
