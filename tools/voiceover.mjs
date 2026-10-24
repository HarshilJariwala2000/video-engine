#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// Narration → audio + timings for one video
//
//   npm run voice 002-redis                    generate/refresh voiceover (cached per scene)
//   npm run voice 002-redis -- --only scene05  force-regenerate one scene
//   npm run voice 002-redis -- --provider elevenlabs   choose the engine for this run
//                                              (default: TTS_PROVIDER in .env)
//   npm run voice:estimate 002-redis           no TTS: estimated timings so you can
//                                              preview the animation right away
//
// Providers (TTS_PROVIDER in .env):
//   local       Chatterbox on your GPU via the tts/ server (npm run tts). The
//               channel voice is voice/reference.wav + voice/voice.json.
//   elevenlabs  ElevenLabs /with-timestamps (the pilot video's pipeline).
// Both return per-character start/end times, so everything below is shared.
//
// Writes, inside videos/<video>/:
//   audio/scenes/sceneNN.wav   one clip per scene (for listening / re-takes)
//   audio/voiceover.wav        all scenes back-to-back, frame-exact; Motion
//                              Canvas plays this automatically
//   src/timings.json           per-scene duration, cue times, caption chunks
//   audio/captions.srt         upload to YouTube as closed captions
//   audio/chapters.txt         paste into the YouTube description
//
// Channel intro/outro (shared/brand/brand.json):
//   {id: 'intro', intro: 'A' | 'B' | 'C' | 'default'}  no narration: drops the intro's
//       music (shared/brand/music/<name>-24k.wav) into the voiceover at that spot
//   bed: true       mixes the outro music bed under this scene and everything after it
//   endCard: true   also holds the scene for brand.outro.endScreenHold seconds
//                   (YouTube end-screen elements need 5–20 s)
//
// Audio is raw 16-bit PCM so durations are sample-exact, and every scene is
// padded to a whole number of video frames, so audio and video never drift.
// ─────────────────────────────────────────────────────────────────────────────
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {ROOT, importScript, loadEnv, logEvent, resolveVideo} from './lib/video.mjs';

const args = process.argv.slice(2);
const ESTIMATE = args.includes('--estimate');
const ONLY = args.includes('--only') ? args[args.indexOf('--only') + 1] : null;
const {slug, dir: VDIR} = resolveVideo(args);
const BRAND = JSON.parse(fs.readFileSync(path.join(ROOT, 'shared/brand/brand.json'), 'utf8'));
const {scenes} = await importScript(VDIR) ?? fail(`videos/${slug}/narration/script.mjs not found`);

// ── config ───────────────────────────────────────────────────────────────────
loadEnv();
const env = process.env;
// per run: --provider local|elevenlabs; otherwise TTS_PROVIDER from .env
const PROVIDER = (args.includes('--provider') ? args[args.indexOf('--provider') + 1] : null) || env.TTS_PROVIDER || 'local';
const FPS = 60;
const LEAD = 0.2; // silence before speech in every scene (s)
const TAIL = 0.55; // silence after speech; the scene fades out in here
const EST_WPM = Number(env.ESTIMATE_WPM || 155);

const EL = {
  apiKey: env.ELEVENLABS_API_KEY,
  voiceId: env.ELEVENLABS_VOICE_ID,
  model: env.ELEVENLABS_MODEL || 'eleven_multilingual_v2',
  rate: Number(env.ELEVENLABS_SAMPLE_RATE || 24000), // 44100 needs Pro tier
  baseUrl: env.ELEVENLABS_BASE_URL || 'https://api.elevenlabs.io',
  voiceSettings: {
    stability: Number(env.ELEVENLABS_STABILITY ?? 0.5),
    similarity_boost: Number(env.ELEVENLABS_SIMILARITY ?? 0.75),
    style: Number(env.ELEVENLABS_STYLE ?? 0),
    use_speaker_boost: true,
    speed: Number(env.ELEVENLABS_SPEED ?? 1.0),
  },
  seed: env.ELEVENLABS_SEED ? Number(env.ELEVENLABS_SEED) : 42,
};
const LOCAL = {
  url: (env.TTS_URL || 'http://127.0.0.1:7861').replace(/\/$/, ''),
  rate: 24000,
};

const RATE = PROVIDER === 'elevenlabs' ? EL.rate : LOCAL.rate;
if (![24000, 44100, 48000].includes(RATE)) {
  fail(`Sample rate must be 24000, 44100 or 48000 (got ${RATE}). These divide evenly into 60 fps frames.`);
}
if (!ESTIMATE && PROVIDER === 'elevenlabs' && (!EL.apiKey || !EL.voiceId)) {
  fail('Set ELEVENLABS_API_KEY and ELEVENLABS_VOICE_ID in .env, or use TTS_PROVIDER=local.');
}
if (!ESTIMATE && !['local', 'elevenlabs'].includes(PROVIDER)) fail(`Unknown TTS_PROVIDER "${PROVIDER}"`);

// Everything that changes the sound goes into the cache key. Cue markers don't,
// so moving a {cue} reuses the cached audio for free.
const voiceFingerprint = ESTIMATE ? null : PROVIDER === 'elevenlabs'
  ? [EL.voiceId, EL.model, EL.voiceSettings, EL.rate, EL.seed]
  : await localFingerprint();

// ── main ─────────────────────────────────────────────────────────────────────
const P = rel => path.join(VDIR, rel);
['audio/cache', 'audio/scenes'].forEach(d => fs.mkdirSync(P(d), {recursive: true}));

console.log(`▶ ${slug}  ·  ${ESTIMATE ? 'estimate' : PROVIDER}`);
const parsed = scenes.map(s => {
  if (!s.intro) return {...s, ...parseCues(s.text)};
  const variant = s.intro === 'default' ? BRAND.defaultIntro : s.intro;
  if (!BRAND.intros[variant]) fail(`${s.id}: unknown intro "${s.intro}" (have ${Object.keys(BRAND.intros).join(', ')})`);
  return {...s, intro: variant, label: s.label ?? 'INTRO', clean: '', cueIdx: {}};
});
// neighbouring narration for TTS context (an intro has none)
const spoken = j => (parsed[j] && !parsed[j].intro ? parsed[j].clean : undefined);
const out = {fps: FPS, estimated: ESTIMATE, provider: ESTIMATE ? 'estimate' : PROVIDER,
  generated: new Date().toISOString(), scenes: {}};
const pcmParts = [];
const srt = [];
const chapters = [];
let offset = 0;

for (let i = 0; i < parsed.length; i++) {
  const s = parsed[i];
  if (s.intro) {
    const ic = BRAND.intros[s.intro];
    const duration = frameCeil(ic.duration);
    out.scenes[s.id] = {duration, offset: round(offset), cues: {}, captions: [], intro: s.intro};
    if (!ESTIMATE) {
      if (RATE !== 24000) fail('The intro music is 24 kHz; use TTS_PROVIDER=local or ELEVENLABS_SAMPLE_RATE=24000.');
      const music = readWavPcm(path.join(ROOT, `shared/brand/music/${ic.music}-24k.wav`));
      const buf = Buffer.alloc(Math.round(duration * RATE) * 2);
      music.copy(buf, 0, 0, Math.min(music.length, buf.length));
      fs.writeFileSync(P(`audio/scenes/${s.id}.wav`), wav(buf, RATE)); // playable on its own, like every scene
      pcmParts.push(buf);
    }
    console.log(`${s.id.padEnd(8)}${duration.toFixed(2).padStart(6)}s  intro ${s.intro} · ${ic.title}`);
    offset += duration;
    continue;
  }
  const {alignment, pcm} = ESTIMATE
    ? {alignment: estimateAlignment(s.clean), pcm: null}
    : await getSpeech(s, spoken(i - 1), spoken(i + 1));

  const ch = alignment.characters;
  const starts = alignment.character_start_times_seconds;
  const ends = alignment.character_end_times_seconds;
  const speech = pcm ? pcm.length / 2 / RATE : ends[ends.length - 1];
  const hold = s.endCard ? Number(BRAND.outro.endScreenHold ?? 0) : 0;
  const duration = frameCeil(LEAD + speech + TAIL + hold);

  // cue times: the start of the first non-space character at/after the marker
  const cues = {};
  for (const [name, idx] of Object.entries(s.cueIdx)) {
    let j = idx;
    while (j < ch.length && /\s/.test(ch[j])) j++;
    cues[name] = round(LEAD + (j < starts.length ? starts[j] : ends[ends.length - 1]));
  }
  const captions = buildCaptions(ch, starts, ends).map(c => ({
    start: round(LEAD + c.start), end: round(LEAD + c.end), text: c.text,
  }));

  out.scenes[s.id] = {duration, offset: round(offset), cues, captions};
  if (pcm) {
    const total = Math.round(duration * RATE);
    const lead = Math.round(LEAD * RATE);
    const buf = Buffer.alloc(total * 2); // zero = silence
    pcm.copy(buf, lead * 2, 0, Math.min(pcm.length, (total - lead) * 2));
    fs.writeFileSync(P(`audio/scenes/${s.id}.wav`), wav(buf, RATE));
    pcmParts.push(buf);
  }
  captions.forEach(c => srt.push({start: offset + c.start, end: offset + c.end, text: c.text}));
  const prevLabel = parsed.slice(0, i).filter(p => !p.intro).at(-1)?.label;
  if (s.label !== prevLabel) chapters.push(`${clock(offset)} ${titleCase(s.label)}`);
  console.log(`${s.id}  ${duration.toFixed(2).padStart(6)}s  ${Object.keys(cues).length} cues  ${s.label}`);
  offset += duration;
}

fs.writeFileSync(P('src/timings.json'), JSON.stringify(out, null, 2));
fs.writeFileSync(P('audio/captions.srt'), toSrt(srt));
fs.writeFileSync(P('audio/chapters.txt'), chapters.join('\n') + '\n');
if (pcmParts.length === parsed.length) {
  const all = Buffer.concat(pcmParts);
  const bedFrom = parsed.findIndex(p => p.bed || p.endCard);
  if (bedFrom >= 0) mixBed(all, out.scenes[parsed[bedFrom].id].offset);
  fs.writeFileSync(P('audio/voiceover.wav'), wav(all, RATE));
}
console.log(`\nTotal ${clock(offset)} (${offset.toFixed(2)} s)` +
  (ESTIMATE ? '  [ESTIMATED: run `npm run voice` for real audio]' : `  → ${path.relative(ROOT, P('audio/voiceover.wav')).split(path.sep).join('/')}`));

// remember which engine voiced this video (shown in the Studio; re-rolls reuse it)
if (!ESTIMATE && pcmParts.length === parsed.length && fs.existsSync(P('video.json'))) {
  logEvent(VDIR, `Voiceover generated with ${PROVIDER === 'local' ? 'local AI (Chatterbox)' : 'ElevenLabs'}`, {voice: PROVIDER});
}

// ── speech (cached) ──────────────────────────────────────────────────────────
async function getSpeech(scene, prevText, nextText) {
  const key = crypto.createHash('sha1').update(JSON.stringify(
    [scene.clean, PROVIDER, voiceFingerprint])).digest('hex').slice(0, 10);
  const base = P(`audio/cache/${scene.id}-${key}`);
  if (ONLY !== scene.id && fs.existsSync(base + '.json') && fs.existsSync(base + '.pcm')) {
    return {alignment: JSON.parse(fs.readFileSync(base + '.json', 'utf8')), pcm: fs.readFileSync(base + '.pcm')};
  }
  const res = PROVIDER === 'elevenlabs'
    ? await elevenLabs(scene, prevText, nextText)
    : await local(scene, prevText, nextText);
  if (res.alignment.characters.join('') !== scene.clean) {
    console.warn(`  ! ${scene.id}: alignment text differs slightly from script; cue times are still index-based`);
  }
  fs.writeFileSync(base + '.json', JSON.stringify(res.alignment));
  fs.writeFileSync(base + '.pcm', res.pcm);
  return res;
}

async function local(scene, prevText, nextText) {
  process.stdout.write(`  ↳ local TTS: ${scene.id} … `);
  const t0 = Date.now();
  let res;
  try {
    res = await fetch(`${LOCAL.url}/synthesize`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({id: scene.id, text: scene.clean, previous_text: prevText, next_text: nextText}),
    });
  } catch {
    fail(`Local TTS server not reachable at ${LOCAL.url}. Start it with "npm run tts" (or from the Studio).`);
  }
  if (!res.ok) fail(`Local TTS ${res.status} for ${scene.id}: ${(await res.text()).slice(0, 600)}`);
  const json = await res.json();
  if (json.sample_rate !== LOCAL.rate) fail(`Local TTS returned ${json.sample_rate} Hz, expected ${LOCAL.rate}`);
  console.log(`${((Date.now() - t0) / 1000).toFixed(1)}s`);
  return {alignment: json.alignment, pcm: Buffer.from(json.audio_base64, 'base64')};
}

async function localFingerprint() {
  // Ask the server so the key reflects what it will actually use (model, settings, reference clip).
  try {
    const r = await fetch(`${LOCAL.url}/health`);
    if (r.ok) return (await r.json()).fingerprint;
  } catch { /* fall through */ }
  fail(`Local TTS server not reachable at ${LOCAL.url}. Start it with "npm run tts" (or from the Studio),\n` +
       'or run `npm run voice:estimate` to preview with estimated timings.');
}

async function elevenLabs(scene, prevText, nextText) {
  const url = `${EL.baseUrl}/v1/text-to-speech/${EL.voiceId}/with-timestamps?output_format=pcm_${EL.rate}`;
  const body = {
    text: scene.clean,
    model_id: EL.model,
    voice_settings: EL.voiceSettings,
    seed: EL.seed,
    // neighbouring scenes keep intonation continuous across separate requests
    ...(prevText ? {previous_text: prevText} : {}),
    ...(nextText ? {next_text: nextText} : {}),
  };
  for (let attempt = 1; ; attempt++) {
    process.stdout.write(`  ↳ ElevenLabs: ${scene.id} (attempt ${attempt})\n`);
    const res = await fetch(url, {
      method: 'POST',
      headers: {'xi-api-key': EL.apiKey, 'Content-Type': 'application/json'},
      body: JSON.stringify(body),
    });
    if (res.ok) {
      const json = await res.json();
      if (!json.alignment?.characters?.length) fail(`No alignment returned for ${scene.id}`);
      return {alignment: json.alignment, pcm: Buffer.from(json.audio_base64, 'base64')};
    }
    const msg = await res.text();
    if ((res.status === 429 || res.status >= 500) && attempt < 5) {
      await new Promise(r => setTimeout(r, 1500 * attempt));
      continue;
    }
    fail(`ElevenLabs ${res.status} for ${scene.id}: ${msg.slice(0, 400)}`);
  }
}

// ── music ────────────────────────────────────────────────────────────────────
/** 16-bit PCM payload of a WAV file (walks the chunks; no assumptions about header size). */
function readWavPcm(file) {
  if (!fs.existsSync(file)) fail(`Missing ${path.relative(ROOT, file)}. Run "npm run music".`);
  const b = fs.readFileSync(file);
  let p = 12;
  while (p < b.length) {
    const id = b.toString('ascii', p, p + 4), size = b.readUInt32LE(p + 4);
    if (id === 'fmt ' && (b.readUInt16LE(p + 10) !== 1 || b.readUInt32LE(p + 12) !== RATE || b.readUInt16LE(p + 22) !== 16)) {
      fail(`${path.relative(ROOT, file)} must be 16-bit mono ${RATE} Hz`);
    }
    if (id === 'data') return b.subarray(p + 8, p + 8 + size);
    p += 8 + size + (size % 2);
  }
  fail(`No audio data in ${file}`);
}

/** Mix the outro bed (looped if needed) under the voice from `fromSec` to the end, with fades. */
function mixBed(buf, fromSec) {
  const bed = readWavPcm(path.join(ROOT, `shared/brand/music/${BRAND.outro.bed}-24k.wav`));
  const gain = 10 ** (Number(BRAND.outro.bedGainDb ?? -21) / 20);
  const start = Math.round(fromSec * RATE), total = buf.length / 2, n = total - start;
  const bedN = bed.length / 2, fadeIn = Math.round(1.5 * RATE), fadeOut = Math.round(2.5 * RATE);
  for (let i = 0; i < n; i++) {
    let g = gain;
    if (i < fadeIn) g *= i / fadeIn;
    if (n - i < fadeOut) g *= (n - i) / fadeOut;
    const v = buf.readInt16LE((start + i) * 2) + bed.readInt16LE((i % bedN) * 2) * g;
    buf.writeInt16LE(Math.max(-32768, Math.min(32767, Math.round(v))), (start + i) * 2);
  }
}

// ── helpers ──────────────────────────────────────────────────────────────────
function parseCues(text) {
  const cueIdx = {};
  let clean = '';
  const re = /\{(\w+)\}/g;
  let last = 0, m;
  while ((m = re.exec(text))) {
    clean += text.slice(last, m.index);
    if (cueIdx[m[1]] !== undefined) fail(`Duplicate cue {${m[1]}} in "${text.slice(0, 40)}…"`);
    cueIdx[m[1]] = clean.length;
    last = re.lastIndex;
  }
  clean += text.slice(last);
  return {clean: clean.replace(/\s+/g, ' ').trim(), cueIdx: shiftForTrim(clean, cueIdx)};
}
function shiftForTrim(clean, cueIdx) {
  // re-map indices after whitespace normalisation
  const map = [];
  let out = 0, prevSpace = true;
  for (let i = 0; i < clean.length; i++) {
    const sp = /\s/.test(clean[i]);
    map[i] = out;
    if (!(sp && prevSpace)) out++;
    prevSpace = sp;
  }
  map[clean.length] = out;
  return Object.fromEntries(Object.entries(cueIdx).map(([k, v]) => [k, map[v]]));
}

function estimateAlignment(text) {
  const cps = (EST_WPM / 60) * 5.7; // ~5.7 chars per word incl. space
  const characters = [...text], s = [], e = [];
  let t = 0;
  for (const c of characters) {
    s.push(t);
    t += 1 / cps;
    if (/[.?!]/.test(c)) t += 0.35;
    else if (/[,:;]/.test(c)) t += 0.15;
    e.push(t);
  }
  return {characters, character_start_times_seconds: s, character_end_times_seconds: e};
}

function buildCaptions(ch, starts, ends) {
  const words = [];
  let cur = null;
  ch.forEach((c, i) => {
    if (/\s/.test(c)) { cur = null; return; }
    if (!cur) words.push(cur = {text: '', start: starts[i], end: ends[i]});
    cur.text += c;
    cur.end = ends[i];
  });
  // 1) split into clauses: always at sentence ends, at commas once long enough
  const segs = [];
  let seg = [];
  const len = ws => ws.map(w => w.text).join(' ').length;
  for (const w of words) {
    seg.push(w);
    const endS = /[.?!]$/.test(w.text);
    if (endS || (/[,:;]$/.test(w.text) && len(seg) >= 18)) { segs.push({ws: seg, endS}); seg = []; }
  }
  if (seg.length) segs.push({ws: seg, endS: true});
  // 2) merge tiny clauses into the previous one from the same sentence
  const merged = [];
  for (const g of segs) {
    const prev = merged.at(-1);
    if (prev && !prev.endS && (len(g.ws) < 14 || len(prev.ws) < 14) && len([...prev.ws, ...g.ws]) <= 44) {
      prev.ws.push(...g.ws); prev.endS = g.endS;
    } else merged.push({ws: [...g.ws], endS: g.endS});
  }
  // 3) split long clauses into balanced lines (≤ ~44 chars, no orphan words)
  const chunks = [];
  for (const g of merged) {
    const n = Math.ceil(len(g.ws) / 42);
    const target = len(g.ws) / n;
    let cur = [];
    g.ws.forEach((w, i) => {
      cur.push(w);
      const left = g.ws.length - i - 1;
      if (len(cur) >= target - 4 && left > 1) { chunks.push(cur); cur = []; }
    });
    if (cur.length) chunks.push(cur);
  }
  return chunks.map(ws => ({text: ws.map(w => w.text).join(' '), start: ws[0].start, end: ws.at(-1).end}));
}

function wav(pcm, rate) {
  const h = Buffer.alloc(44);
  h.write('RIFF', 0); h.writeUInt32LE(36 + pcm.length, 4); h.write('WAVE', 8);
  h.write('fmt ', 12); h.writeUInt32LE(16, 16); h.writeUInt16LE(1, 20); h.writeUInt16LE(1, 22);
  h.writeUInt32LE(rate, 24); h.writeUInt32LE(rate * 2, 28); h.writeUInt16LE(2, 32); h.writeUInt16LE(16, 34);
  h.write('data', 36); h.writeUInt32LE(pcm.length, 40);
  return Buffer.concat([h, pcm]);
}
function toSrt(items) {
  const ts = t => {
    const ms = Math.round(t * 1000), h = Math.floor(ms / 3.6e6), m = Math.floor(ms / 6e4) % 60;
    const s = Math.floor(ms / 1000) % 60;
    return `${pad(h)}:${pad(m)}:${pad(s)},${String(ms % 1000).padStart(3, '0')}`;
  };
  return items.map((c, i) => `${i + 1}\n${ts(c.start)} --> ${ts(c.end)}\n${c.text}\n`).join('\n');
}
function frameCeil(t) { return Math.ceil(t * FPS - 1e-6) / FPS; }
function round(t) { return Math.round(t * 1000) / 1000; }
function pad(n) { return String(n).padStart(2, '0'); }
function clock(t) { const s = Math.floor(t); return `${Math.floor(s / 60)}:${pad(s % 60)}`; }
function titleCase(s) { return s.toLowerCase().replace(/(^|\s)\S/g, c => c.toUpperCase()); }
function fail(msg) { console.error(`\n✖ ${msg}\n`); process.exit(1); }
