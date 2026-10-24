#!/usr/bin/env node
// Cuts YouTube Shorts (1080×1920) out of a video's final render.
//
//   npm run shorts 003-kubernetes            all clips in videos/<video>/shorts.json
//   npm run shorts 003 -- --only 2           just short 2
//   npm run shorts 003 -- --input path.mp4   another render (default output/project.mp4)
//
// Each clip in shorts.json is a "region crop + layout": a time range of the
// finished video (scene / cue names from timings.json), a crop rectangle in
// 1920×1080 frame pixels (top-left origin), and a hook title. The tool:
//   1. renders the layout (title, kicker, footer) and one PNG per caption with
//      the channel fonts in Edge (playwright-core), like the thumbnails
//   2. cuts + crops + scales the clip with ffmpeg and composites it all
//   3. writes shorts/short-N.mp4, a still (short-N.png) and short-N-sheet.png:
//      the last frame of every shot side by side, to check each view at a glance
//
// shorts.json:
//   {"kicker": "Kubernetes", "clips": [{
//     "title": "kubectl apply doesn't start anything",
//     "from": "scene09", "to": "scene09",          // scene = its start / its end
//     "view": [-450, -80, 700],                     // what to show: centre x, centre y, width
//     "shots": [{"at": "scene09:sends", "view": [80, 40, 1680]}],  // optional cuts to another view
//     "keep": ["checklist"]                         // optional: don't mask these (label, checklist)
//   }]}
// Views use the scene's own coordinates (origin at the centre, 1920×1080, the
// numbers in the scene code). The height follows from the video box (1080×BOX_H),
// so a narrow view is a close-up; a view wider than the box's shape is letterboxed.
// Times: "scene15" | "scene15:cue" | "scene15:cue+1.2" | "scene15:end-0.5".
// The section label, corner checklist and the small burned-in captions are
// masked by default: on a phone they're noise, and the short has its own captions.
import {spawnSync} from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {chromium} from 'playwright-core';
import {ROOT, resolveVideo} from './lib/video.mjs';

const args = process.argv.slice(2);
const flag = n => (args.includes(n) ? args[args.indexOf(n) + 1] : null);
const {slug, dir} = resolveVideo(args);
const FFMPEG = path.join(ROOT, 'node_modules/@ffmpeg-installer/win32-x64/ffmpeg.exe');
const FFPROBE = path.join(ROOT, 'node_modules/@ffprobe-installer/win32-x64/ffprobe.exe');
const input = path.resolve(flag('--input') ?? path.join(dir, 'output/project.mp4'));
const specFile = path.join(dir, 'shorts.json');
if (!fs.existsSync(specFile)) fail(`No shorts.json in videos/${slug}. Add one (see the header of tools/shorts.mjs).`);
if (!fs.existsSync(input)) fail(`No render at ${path.relative(ROOT, input)}. Render the video in the editor first.`);
const spec = JSON.parse(fs.readFileSync(specFile, 'utf8'));
const timings = JSON.parse(fs.readFileSync(path.join(dir, 'src/timings.json'), 'utf8'));
const outDir = path.join(dir, 'shorts');
const work = path.join(outDir, '.work');
fs.mkdirSync(work, {recursive: true});

// source size → factor from the 1920×1080 design frame
const probe = spawnSync(FFPROBE, ['-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height',
  '-of', 'csv=p=0', input], {encoding: 'utf8'});
const [SRC_W, SRC_H] = probe.stdout.trim().split(',').map(Number);
if (!SRC_W) fail(`Can't read ${input}: ${probe.stderr}`);
const K = SRC_W / 1920;

const OUT_W = 1080, OUT_H = 1920, FPS = 60;
const BOX_H = 840; // the video box between the title and the captions
const BG = '#141414';
// design-frame areas masked by default (x, y, w, h)
const MASKS = {
  label: [40, 50, 760, 70],         // section label, top-left
  checklist: [1520, 50, 360, 185],  // the corner checklist
  captions: [0, 965, 1920, 80],     // the small burned-in captions
};

const only = flag('--only');
const clips = spec.clips.map((c, i) => ({...c, n: i + 1})).filter(c => !only || String(c.n) === only);
const browser = await launch();
const page = await browser.newPage({viewport: {width: OUT_W, height: OUT_H}});
for (const clip of clips) await makeShort(clip);
await browser.close();
fs.rmSync(work, {recursive: true, force: true});

async function makeShort(clip) {
  const t0 = time(clip.from, 'start'), t1 = time(clip.to, 'end');
  const dur = +(t1 - t0).toFixed(3);
  if (dur <= 0) fail(`short ${clip.n}: "${clip.to}" is not after "${clip.from}"`);
  if (dur > 60) console.log(`! short ${clip.n} is ${dur.toFixed(1)} s (over 60 s)`);
  const boxH = spec.boxH ?? BOX_H;
  const shots = [{start: 0, view: clip.view}, ...(clip.shots ?? []).map(s => ({start: time(s.at, 'start') - t0, view: s.view}))]
    .map(s => ({...s, crop: viewToCrop(s.view, boxH)}));

  // 1) layout + captions, rendered with the channel fonts
  const tag = `short-${clip.n}`;
  const layout = await renderLayout(clip, boxH, path.join(work, `${tag}-bg.png`));
  const caps = captionsIn(t0, t1);
  const capPngs = [];
  for (const [i, c] of caps.entries()) {
    const file = path.join(work, `${tag}-cap${i}.png`);
    await renderCaption(c.text, file);
    capPngs.push({...c, file});
  }

  // 2) ffmpeg: mask → crop → fit into the box, per shot; then layout + captions on top
  const keep = new Set(clip.keep ?? []);
  const masks = Object.entries(MASKS).filter(([k]) => !keep.has(k))
    .map(([, [x, y, w, h]]) => `drawbox=x=${px(x)}:y=${px(y)}:w=${px(w)}:h=${px(h)}:color=${BG.replace('#', '0x')}@1:t=fill`);
  const f = [];
  f.push(`[0:v]${[...masks, `split=${shots.length}`].join(',')}${shots.map((_, i) => `[s${i}]`).join('')}`);
  shots.forEach((s, i) => {
    const end = i + 1 < shots.length ? shots[i + 1].start : dur;
    const [x, y, w, h] = s.crop;
    f.push(`[s${i}]trim=start=${s.start.toFixed(3)}:end=${end.toFixed(3)},setpts=PTS-STARTPTS,` +
      `crop=${px(w)}:${px(h)}:${px(x)}:${px(y)},` +
      `scale=${OUT_W}:${boxH}:force_original_aspect_ratio=decrease:flags=lanczos,` +
      `pad=${OUT_W}:${boxH}:(ow-iw)/2:(oh-ih)/2:color=${BG.replace('#', '0x')},setsar=1[v${i}]`);
  });
  f.push(`${shots.map((_, i) => `[v${i}]`).join('')}concat=n=${shots.length}:v=1:a=0[clip]`);
  f.push(`[1:v][clip]overlay=0:${layout.videoY}:shortest=1[b0]`);
  capPngs.forEach((c, i) => {
    f.push(`[b${i}][${i + 2}:v]overlay=0:${layout.captionY}:enable='between(t,${c.start.toFixed(3)},${c.end.toFixed(3)})'[b${i + 1}]`);
  });
  f.push(`[b${capPngs.length}]fade=t=in:st=0:d=0.25,fade=t=out:st=${(dur - 0.4).toFixed(3)}:d=0.4,format=yuv420p[vout]`);
  f.push(`[0:a]afade=t=in:st=0:d=0.15,afade=t=out:st=${(dur - 0.4).toFixed(3)}:d=0.4[aout]`);

  const out = path.join(outDir, `${tag}.mp4`);
  const ff = [
    '-y', '-hide_banner', '-loglevel', 'error',
    '-ss', t0.toFixed(3), '-t', String(dur), '-i', input,
    '-loop', '1', '-framerate', String(FPS), '-t', String(dur), '-i', layout.file,
    ...capPngs.flatMap(c => ['-i', c.file]),
    '-filter_complex', f.join(';'),
    '-map', '[vout]', '-map', '[aout]', '-r', String(FPS),
    '-c:v', 'libx264', '-preset', 'medium', '-crf', '18', '-c:a', 'aac', '-b:a', '192k', '-movflags', '+faststart',
    out,
  ];
  console.log(`▶ ${tag}: ${clip.from} → ${clip.to} (${dur.toFixed(1)} s, ${shots.length} shot${shots.length > 1 ? 's' : ''}, ${caps.length} captions)`);
  const r = spawnSync(FFMPEG, ff, {stdio: ['ignore', 'inherit', 'inherit']});
  if (r.status) fail(`ffmpeg failed for ${tag}`);
  // a still from the middle, for a quick look (and the Studio)
  spawnSync(FFMPEG, ['-y', '-loglevel', 'error', '-ss', String(dur / 2), '-i', out, '-frames:v', '1', path.join(outDir, `${tag}.png`)]);
  // contact sheet: the last moment of every shot (when the most is on screen), side by side
  const at = shots.map((s, i) => Math.max(s.start + 0.5, (i + 1 < shots.length ? shots[i + 1].start : dur) - 0.6));
  const frames = at.map((t, i) => {
    const f = path.join(work, `${tag}-sheet${i}.png`);
    spawnSync(FFMPEG, ['-y', '-loglevel', 'error', '-ss', t.toFixed(2), '-i', out, '-frames:v', '1', '-vf', 'scale=540:960', f]);
    return f;
  });
  const sheet = path.join(outDir, `${tag}-sheet.png`);
  spawnSync(FFMPEG, ['-y', '-loglevel', 'error', ...frames.flatMap(f => ['-i', f]),
    ...(frames.length > 1 ? ['-filter_complex', `${frames.map((_, i) => `[${i}:v]`).join('')}hstack=inputs=${frames.length}`] : []),
    '-frames:v', '1', sheet]);
  console.log(`✔ shorts/${tag}.mp4  (shots at ${at.map(t => `${t.toFixed(1)}s`).join(', ')} → shorts/${tag}-sheet.png)`);
}

// ── layout ───────────────────────────────────────────────────────────────────
// Phone safe area: YouTube covers the bottom ~22% (title, channel) and a column
// on the right (buttons), so everything that matters sits above y ≈ 1450.
function css() {
  const base = pathToFileURL(path.join(ROOT, 'node_modules/@fontsource')).href;
  return `
  @font-face { font-family: Inter; font-weight: 700; src: url('${base}/inter/files/inter-latin-700-normal.woff2'); }
  @font-face { font-family: Inter; font-weight: 800; src: url('${base}/inter/files/inter-latin-800-normal.woff2'); }
  @font-face { font-family: 'JetBrains Mono'; font-weight: 400; src: url('${base}/jetbrains-mono/files/jetbrains-mono-latin-400-normal.woff2'); }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body { width: ${OUT_W}px; height: ${OUT_H}px; background: ${BG}; color: #e6e6e6; overflow: hidden; }
  .mono { font-family: 'JetBrains Mono', monospace; }`;
}

async function renderLayout(clip, boxH, file) {
  const html = `<!doctype html><html><head><style>${css()}
    main { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; }
    .head { margin-top: 130px; width: 920px; text-align: center; }
    .kicker { font-size: 26px; letter-spacing: 4px; color: #8b7cf6; text-transform: uppercase; }
    h1 { margin-top: 22px; font: 800 66px/1.12 Inter, sans-serif; letter-spacing: -1px; text-wrap: balance; }
    .box { margin-top: 50px; width: ${OUT_W}px; height: ${boxH}px; }
    .cap { margin-top: 30px; height: 150px; }
    .foot { position: absolute; top: 1470px; font-size: 24px; color: #8a8a8a; letter-spacing: 1px; }
    .foot b { color: #8b7cf6; font-weight: 400; }
  </style></head><body><main>
    <div class="head"><div class="kicker mono">${esc(clip.kicker ?? spec.kicker ?? '')}${clips.length > 1 || spec.clips.length > 1 ? ` · ${clip.n}/${spec.clips.length}` : ''}</div>
      <h1>${esc(clip.title)}</h1></div>
    <div class="box" id="box"></div>
    <div class="cap" id="cap"></div>
    <div class="foot mono">under the abstraction · <b>full video on the channel</b></div>
  </main></body></html>`;
  await openHtml(html);
  await page.evaluate(() => document.fonts.ready);
  const pos = await page.evaluate(() => ({
    videoY: document.getElementById('box').getBoundingClientRect().top,
    captionY: document.getElementById('cap').getBoundingClientRect().top,
    foot: document.querySelector('.foot').getBoundingClientRect().top,
  }));
  if (pos.captionY + 150 > pos.foot) console.log(`! short ${clip.n}: title + video are too tall, captions run into the footer; use a wider crop or a shorter title`);
  await page.screenshot({path: file});
  return {file, videoY: Math.round(pos.videoY), captionY: Math.round(pos.captionY)};
}

async function renderCaption(text, file) {
  const html = `<!doctype html><html><head><style>${css()}
    html, body { background: transparent; height: 150px; }
    p { width: 940px; margin: 0 auto; text-align: center; font: 700 54px/1.18 Inter, sans-serif; text-wrap: balance; }
  </style></head><body><p>${esc(text)}</p></body></html>`;
  await page.setViewportSize({width: OUT_W, height: 150});
  await openHtml(html);
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({path: file, omitBackground: true});
  await page.setViewportSize({width: OUT_W, height: OUT_H});
}

// ── times + captions ─────────────────────────────────────────────────────────
/** "scene15" | "scene15:cue" | "scene15:cue+1.2" | "scene15:end-0.5" → seconds in the full video. */
function time(specStr, bare) {
  const m = String(specStr).match(/^(\w+?)(?::(\w+))?([+-]\d+(?:\.\d+)?)?$/);
  if (!m) fail(`bad time "${specStr}"`);
  const [, id, cue, delta] = m;
  const sc = timings.scenes[id];
  if (!sc) fail(`unknown scene "${id}" in "${specStr}"`);
  let t;
  if (!cue) t = bare === 'end' ? sc.offset + sc.duration : sc.offset;
  else if (cue === 'start') t = sc.offset;
  else if (cue === 'end') t = sc.offset + sc.duration;
  else if (sc.cues[cue] !== undefined) t = sc.offset + sc.cues[cue];
  else fail(`scene "${id}" has no cue "${cue}" (cues: ${Object.keys(sc.cues).join(', ')})`);
  return t + Number(delta ?? 0);
}

/** Narration captions overlapping [t0, t1], in clip time. */
function captionsIn(t0, t1) {
  const out = [];
  for (const sc of Object.values(timings.scenes)) {
    for (const c of sc.captions ?? []) {
      const a = sc.offset + c.start - t0, b = sc.offset + c.end - t0;
      if (b > 0 && a < t1 - t0) out.push({start: Math.max(0, a), end: Math.min(t1 - t0, b), text: c.text});
    }
  }
  return out;
}

/** [cx, cy, w] in scene coordinates → [x, y, w, h] in 1920×1080 frame pixels, kept inside the frame. */
function viewToCrop(view, boxH) {
  if (!Array.isArray(view) || view.length !== 3) fail(`a view is [centre x, centre y, width], got ${JSON.stringify(view)}`);
  const [cx, cy] = view;
  const w = Math.min(1920, view[2]);
  const h = Math.min(1080, w * boxH / OUT_W);
  const x = Math.max(0, Math.min(1920 - w, cx + 960 - w / 2));
  const y = Math.max(0, Math.min(1080 - h, cy + 540 - h / 2));
  return [x, y, w, h];
}

// ── helpers ──────────────────────────────────────────────────────────────────
function px(v) { return even(v * K); }
function even(v) { return Math.round(v / 2) * 2; }
function esc(s) { return String(s).replace(/[&<>"]/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'}[c])); }
async function launch() {
  for (const channel of ['msedge', 'chrome']) {
    try { return await chromium.launch({channel, headless: true}); } catch { /* next */ }
  }
  fail('Need Microsoft Edge or Google Chrome installed');
}
function fail(msg) { console.error(`✖ ${msg}`); process.exit(1); }
/** Pages are opened from disk (not setContent) so they may load the local font files. */
async function openHtml(html) {
  const file = path.join(work, 'page.html');
  fs.writeFileSync(file, html);
  await page.goto(pathToFileURL(file).href, {waitUntil: 'load'});
  const ok = await page.evaluate(async () => { await document.fonts.ready; return [...document.fonts].some(f => /Inter/.test(f.family) && f.status === 'loaded'); });
  if (!ok) fail('the Inter font did not load (node_modules/@fontsource/inter missing?)');
}
