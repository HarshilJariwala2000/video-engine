// Shared helpers for the CLI tools: repo paths, .env loading, and resolving
// which video a command operates on.
//
//   node tools/voiceover.mjs 002-redis      positional
//   node tools/voiceover.mjs --video 002-redis
//   VIDEO=002-redis node tools/voiceover.mjs
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
export const VIDEOS = path.join(ROOT, 'videos');

export function loadEnv(file = path.join(ROOT, '.env')) {
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^['"]|['"]$/g, '');
  }
}

export function listVideos() {
  if (!fs.existsSync(VIDEOS)) return [];
  return fs.readdirSync(VIDEOS, {withFileTypes: true})
    .filter(d => d.isDirectory() && fs.existsSync(path.join(VIDEOS, d.name, 'video.json')))
    .map(d => d.name)
    .sort();
}

// flags whose next argument is their value (never a video name)
const VALUE_FLAGS = new Set(['--video', '--only', '--provider', '--port', '--title', '--topic', '--aha', '--pain', '--format', '--notes']);

/** Resolve the target video from argv / $VIDEO. Exits with a helpful list if missing. */
export function resolveVideo(argv = process.argv.slice(2)) {
  // a folder path (e.g. showcase/demo-a) that has a narration script works too
  const asDir = argv.find(a => a.includes('/') && fs.existsSync(path.join(ROOT, a, 'narration/script.mjs')));
  if (asDir) return {slug: asDir.replace(/\/$/, ''), dir: path.join(ROOT, asDir)};
  const videos = listVideos();
  // exact folder name, or a unique prefix: "002" → "002-redis"
  const match = s => (videos.includes(s) ? s : (h => (h.length === 1 ? h[0] : null))(videos.filter(v => v.startsWith(s))));
  const flag = argv.indexOf('--video');
  let slug = flag >= 0 ? argv[flag + 1]
    : argv.filter((a, i) => !a.startsWith('-') && !VALUE_FLAGS.has(argv[i - 1])).map(match).find(Boolean);
  slug ??= process.env.VIDEO;
  if (slug) slug = match(slug) ?? slug;
  if (!slug || !listVideos().includes(slug)) {
    console.error(`\n✖ Which video? Pass one of: ${listVideos().join(', ') || '(none yet: npm run new <slug>)'}\n`);
    process.exit(1);
  }
  return {slug, dir: path.join(VIDEOS, slug)};
}

/** JSON.parse a file, tolerating the UTF-8 BOM some Windows editors add. */
export function readJsonFile(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8').replace(/^﻿/, ''));
}

export function readVideo(dir) {
  return readJsonFile(path.join(dir, 'video.json'));
}
export function writeVideo(dir, data) {
  fs.writeFileSync(path.join(dir, 'video.json'), JSON.stringify(data, null, 2) + '\n');
}

/** Scaffold videos/NNN-name/ from templates/video. Returns {slug, dir}. */
export function createVideo(o) {
  const kebab = o.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40);
  const next = Math.max(0, ...listVideos().map(v => parseInt(v, 10)).filter(Number.isFinite)) + 1;
  const slug = `${String(next).padStart(3, '0')}-${kebab}`;
  const dir = path.join(VIDEOS, slug);
  fs.cpSync(path.join(ROOT, 'templates/video'), dir, {recursive: true});
  for (const d of ['narration', 'audio', 'thumbnails', 'src/scenes']) fs.mkdirSync(path.join(dir, d), {recursive: true});

  const fill = s => s
    .replaceAll('{{TITLE}}', o.title || o.topic || o.name)
    .replaceAll('{{TOPIC}}', o.topic || o.name)
    .replaceAll('{{AHA}}', o.aha || '')
    .replaceAll('{{PAIN}}', o.pain || '')
    .replaceAll('{{FORMAT}}', o.format || '')
    .replaceAll('{{NOTES}}', o.notes || '');
  const brief = path.join(dir, 'brief.md');
  fs.writeFileSync(brief, fill(fs.readFileSync(brief, 'utf8')));

  const now = new Date().toISOString();
  writeVideo(dir, {
    slug,
    title: o.title || o.topic || o.name,
    created: now.slice(0, 10),
    stage: 'script',
    voice: 'local',
    idea: o.idea ?? null,
    reviews: [],
    selectedThumbnail: null,
    history: [{at: now, event: 'Created'}],
  });
  return {slug, dir};
}

/** Append to video.json history (and optionally change stage). */
export function logEvent(dir, event, patch = {}) {
  const v = readVideo(dir);
  Object.assign(v, patch);
  v.history = [...(v.history ?? []), {at: new Date().toISOString(), event}];
  writeVideo(dir, v);
  return v;
}

/** Import narration/script.mjs fresh (no module cache), so edits are picked up. */
export async function importScript(dir) {
  const file = path.join(dir, 'narration/script.mjs');
  if (!fs.existsSync(file)) return null;
  return import(pathToFileURL(file).href + `?t=${Date.now()}`);
}
