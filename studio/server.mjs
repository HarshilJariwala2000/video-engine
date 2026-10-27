#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// Under the Abstraction: Studio
//
//   npm run studio   → http://localhost:7860
//
// A local web UI for the workflow: ideas → script → review → voice → code →
// thumbnails → publish. Creative steps run Claude Code headless with the
// project skills (.claude/skills/*), so the Studio and the terminal share the
// exact same instructions. Mechanical steps run the tools/ scripts. Every job
// streams its log to the browser over Server-Sent Events.
//
// No dependencies: node:http + static files in studio/public.
// ─────────────────────────────────────────────────────────────────────────────
import {spawn} from 'node:child_process';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import {ROOT, VIDEOS, createVideo, importScript, listVideos, loadEnv, logEvent, readJsonFile, readVideo, writeVideo} from '../tools/lib/video.mjs';

loadEnv();
const PORT = Number(process.env.STUDIO_PORT ?? 7860);
const PUBLIC = path.join(ROOT, 'studio/public');
const IDEAS = path.join(ROOT, 'ideas/backlog.json');
const VOICE = path.join(ROOT, 'voice');
const TTS_URL = (process.env.TTS_URL || 'http://127.0.0.1:7861').replace(/\/$/, '');
const EDITOR_PORT = 9000;
const LOGS = path.join(ROOT, 'studio/.logs');
fs.mkdirSync(LOGS, {recursive: true});

const STAGES = ['script', 'review', 'voice', 'code', 'thumbnails', 'publish', 'done'];

// ── jobs ─────────────────────────────────────────────────────────────────────
/** @type {Map<string, any>} */
const jobs = new Map();
let jobSeq = 0;

const CLAUDE_TOOLS = ['Read', 'Write', 'Edit', 'Glob', 'Grep', 'WebSearch', 'WebFetch', 'Skill', 'TodoWrite',
  'Bash(npm run *)', 'Bash(node tools/*)', 'Bash(node -e *)', 'PowerShell(npm run *)', 'PowerShell(node tools/*)'];

const ACTIONS = {
  // creative steps → Claude Code with a project skill
  'brainstorm':    {claude: (v, a) => `/brainstorm ${a ?? ''}`.trim(), label: 'Brainstorm ideas'},
  'write-script':  {claude: v => `/write-script ${v}`, label: 'Write script', video: true},
  'revise-script': {claude: v => `/revise-script ${v}`, label: 'Revise script', video: true},
  'build-video':   {claude: v => `/build-video ${v}`, label: 'Build animation', video: true},
  'thumbnails':    {claude: (v, a) => `/thumbnails ${v} ${a ?? ''}`.trim(), label: 'Design thumbnails', video: true},
  'pick-shorts':   {claude: (v, a) => `/shorts ${v} ${a ?? ''}`.trim(), label: 'Pick shorts', video: true},
  // mechanical steps → tools/
  'voice':          {node: (v, a) => ['tools/voiceover.mjs', v, '--provider', 'local', ...(a ? ['--only', a] : [])],
                     label: 'Voiceover (local AI)', video: true, gpu: true, needsTts: true},
  'voice-elevenlabs': {node: (v, a) => ['tools/voiceover.mjs', v, '--provider', 'elevenlabs', ...(a ? ['--only', a] : [])],
                     label: 'Voiceover (ElevenLabs)', video: true},
  'voice-estimate': {node: v => ['tools/voiceover.mjs', v, '--estimate'], label: 'Estimate timings', video: true},
  'script-md':      {node: v => ['tools/script-md.mjs', v], label: 'Regenerate SCRIPT.md', video: true},
  'check':          {node: v => ['tools/check-video.mjs', v], label: 'Check animation', video: true},
  'thumbs':         {node: v => ['tools/thumbnails.mjs', v], label: 'Render thumbnails', video: true},
  'shorts':         {node: (v, a) => ['tools/shorts.mjs', v, ...(a ? ['--only', String(a)] : [])], label: 'Render shorts', video: true},
  'voicelab':       {py: a => ['voicelab.py', ...(Array.isArray(a) ? a.map(String) : a ? a.split(' ') : ['bakeoff'])],
                     label: 'Voice lab', gpu: true, exclusiveGpu: true},
};

function newJob(kind, video, label, meta = {}) {
  const id = `${Date.now().toString(36)}-${++jobSeq}`;
  const job = {id, kind, video, label, status: 'running', started: Date.now(), ended: null,
    log: [], listeners: new Set(), proc: null, sessionId: null, result: null, ...meta};
  jobs.set(id, job);
  // keep the last 40 jobs
  if (jobs.size > 40) jobs.delete(jobs.keys().next().value);
  return job;
}

function emit(job, kind, text) {
  const entry = {t: Date.now(), kind, text};
  job.log.push(entry);
  if (job.log.length > 4000) job.log.splice(0, job.log.length - 4000);
  for (const res of job.listeners) res.write(`data: ${JSON.stringify(entry)}\n\n`);
  fs.appendFileSync(path.join(LOGS, `${job.id}.log`), `[${kind}] ${text}\n`);
}

function finish(job, status, result) {
  job.status = status;
  job.ended = Date.now();
  job.result = result ?? job.result;
  emit(job, status === 'done' ? 'done' : 'error', status === 'done' ? `✔ ${job.label} finished` : `✖ ${job.label} ${status}`);
  for (const res of job.listeners) { res.write(`event: end\ndata: ${JSON.stringify({status})}\n\n`); res.end(); }
  job.listeners.clear();
}

function gpuBusy() {
  return [...jobs.values()].find(j => j.status === 'running' && ACTIONS[j.kind]?.gpu);
}

async function runAction(kind, video, arg, extra = {}) {
  const def = ACTIONS[kind];
  if (!def) throw httpError(400, `unknown action ${kind}`);
  if (def.video && !listVideos().includes(video)) throw httpError(400, `unknown video ${video}`);
  if (def.gpu && gpuBusy()) throw httpError(409, `GPU busy with "${gpuBusy().label}". Wait for it to finish.`);
  const label = `${def.label}${video ? ` · ${video}` : ''}`;
  const job = newJob(kind, video ?? null, label);

  if (def.claude) {
    const prompt = extra.followup ?? def.claude(video, arg);
    runClaude(job, prompt, extra.resume);
  } else if (def.node) {
    if (def.needsTts && !(await ttsHealth())) {
      // local voice: bring the voice server up first (in the background), then run
      (async () => {
        emit(job, 'info', 'Starting the local voice server (model load takes ~15-30 s) …');
        startTts();
        for (let i = 0; i < 180 && !(await ttsHealth()); i++) await new Promise(r => setTimeout(r, 1000));
        if (await ttsHealth()) runProc(job, process.execPath, def.node(video, arg), ROOT);
        else { emit(job, 'error', 'Voice server did not come up; see the "TTS server" job log.'); finish(job, 'failed'); }
      })();
      return job;
    }
    runProc(job, process.execPath, def.node(video, arg), ROOT);
  } else if (def.py) {
    if (def.exclusiveGpu && (await ttsHealth())) {
      emit(job, 'info', 'Stopping the TTS server to free VRAM for the voice lab …');
      await stopTts();
    }
    const py = path.join(ROOT, 'tts/.venv', process.platform === 'win32' ? 'Scripts/python.exe' : 'bin/python');
    if (!fs.existsSync(py)) { emit(job, 'error', 'tts/.venv missing: run `cd tts && uv sync`'); finish(job, 'failed'); return job; }
    runProc(job, py, def.py(arg), path.join(ROOT, 'tts'), {PYTHONWARNINGS: 'ignore', PYTHONUNBUFFERED: '1', PYTHONIOENCODING: 'utf-8'});
  }
  return job;
}

function runProc(job, cmd, args, cwd, env = {}) {
  emit(job, 'cmd', `$ ${path.basename(cmd)} ${args.join(' ')}`);
  const p = spawn(cmd, args, {cwd, env: {...process.env, FORCE_COLOR: '0', ...env}, stdio: ['ignore', 'pipe', 'pipe']});
  job.proc = p;
  const onData = kind => buf => {
    for (const line of buf.toString().split(/\r?\n|\r/)) {
      const l = line.replace(/\x1b\[[0-9;]*m/g, '');
      if (!l.trim() || /\d+%\|.*\|/.test(l)) continue; // drop progress bars
      emit(job, kind, l);
    }
  };
  p.stdout.on('data', onData('out'));
  p.stderr.on('data', onData('err'));
  p.on('error', e => { emit(job, 'error', e.message); finish(job, 'failed'); });
  p.on('close', code => { if (job.status === 'running') finish(job, code === 0 ? 'done' : 'failed'); });
}

function runClaude(job, prompt, resume) {
  const args = ['-p', prompt, '--output-format', 'stream-json', '--verbose',
    '--permission-mode', 'acceptEdits', '--allowedTools', ...CLAUDE_TOOLS];
  if (resume) args.push('--resume', resume);
  emit(job, 'cmd', `$ claude -p "${prompt}"${resume ? ' (follow-up)' : ''}`);
  const p = spawn(process.env.CLAUDE_BIN || 'claude', args, {cwd: ROOT, env: {...process.env}, stdio: ['ignore', 'pipe', 'pipe']});
  job.proc = p;
  let buf = '';
  p.stdout.on('data', d => {
    buf += d.toString();
    let i;
    while ((i = buf.indexOf('\n')) >= 0) {
      const line = buf.slice(0, i).trim();
      buf = buf.slice(i + 1);
      if (line) handleClaudeEvent(job, line);
    }
  });
  p.stderr.on('data', d => { for (const l of d.toString().split(/\r?\n/)) if (l.trim()) emit(job, 'err', l); });
  p.on('error', e => { emit(job, 'error', `Could not start claude: ${e.message}`); finish(job, 'failed'); });
  p.on('close', code => { if (job.status === 'running') finish(job, code === 0 ? 'done' : 'failed'); });
}

function handleClaudeEvent(job, line) {
  let ev;
  try { ev = JSON.parse(line); } catch { emit(job, 'out', line); return; }
  if (ev.session_id) job.sessionId = ev.session_id;
  if (ev.type === 'system' && ev.subtype === 'init') {
    emit(job, 'info', `Claude session ${ev.session_id?.slice(0, 8)} · ${ev.model ?? ''}`);
  } else if (ev.type === 'assistant') {
    for (const c of ev.message?.content ?? []) {
      if (c.type === 'text' && c.text.trim()) emit(job, 'claude', c.text.trim());
      if (c.type === 'tool_use') emit(job, 'tool', describeTool(c.name, c.input));
    }
  } else if (ev.type === 'user') {
    for (const c of ev.message?.content ?? []) {
      if (c.type === 'tool_result' && c.is_error) {
        const t = Array.isArray(c.content) ? c.content.map(x => x.text ?? '').join(' ') : String(c.content ?? '');
        emit(job, 'err', t.slice(0, 600));
      }
    }
  } else if (ev.type === 'result') {
    job.result = ev.result;
    const cost = ev.total_cost_usd ? ` · $${ev.total_cost_usd.toFixed(2)}` : '';
    emit(job, 'info', `Claude finished in ${Math.round((ev.duration_ms ?? 0) / 1000)}s${cost}`);
    if (ev.is_error || ev.subtype !== 'success') finish(job, 'failed', ev.result);
  }
}

function describeTool(name, input = {}) {
  const rel = p => (p ? path.relative(ROOT, p) || p : '');
  switch (name) {
    case 'Read': return `Read ${rel(input.file_path)}`;
    case 'Write': return `Write ${rel(input.file_path)}`;
    case 'Edit': return `Edit ${rel(input.file_path)}`;
    case 'Bash': case 'PowerShell': return `${name}: ${String(input.command).slice(0, 200)}`;
    case 'Glob': return `Glob ${input.pattern}`;
    case 'Grep': return `Grep ${input.pattern}`;
    case 'WebSearch': return `Search: ${input.query}`;
    case 'WebFetch': return `Fetch ${input.url}`;
    case 'Skill': return `Skill ${input.skill ?? input.command ?? ''}`;
    case 'TodoWrite': return `Plan: ${(input.todos ?? []).map(t => t.content).join(' · ').slice(0, 200)}`;
    default: return name;
  }
}

// ── services: TTS server + Motion Canvas editor ──────────────────────────────
const services = {tts: null, editor: null, editorVideo: null};

async function ttsHealth() {
  try {
    const r = await fetch(`${TTS_URL}/health`, {signal: AbortSignal.timeout(1500)});
    return r.ok ? await r.json() : null;
  } catch { return null; }
}

function startTts() {
  if (services.tts) return services.tts;
  const job = newJob('tts', null, 'TTS server', {service: true});
  const py = path.join(ROOT, 'tts/.venv', process.platform === 'win32' ? 'Scripts/python.exe' : 'bin/python');
  const port = new URL(TTS_URL).port || '7861';
  runProc(job, py, ['server.py', '--port', port], path.join(ROOT, 'tts'), {PYTHONWARNINGS: 'ignore', PYTHONUNBUFFERED: '1', PYTHONIOENCODING: 'utf-8'});
  job.proc.on('close', () => { services.tts = null; });
  services.tts = job;
  // load the models in the background so the first scene isn't slow
  (async () => {
    for (let i = 0; i < 120 && services.tts === job; i++) {
      if (await ttsHealth()) { fetch(`${TTS_URL}/warmup`, {method: 'POST'}).catch(() => {}); return; }
      await new Promise(r => setTimeout(r, 1000));
    }
  })();
  return job;
}

async function stopTts() {
  if (services.tts?.proc) {
    services.tts.proc.kill();
    services.tts = null;
  }
  for (let i = 0; i < 20 && (await ttsHealth()); i++) await new Promise(r => setTimeout(r, 300));
}

function startEditor(video) {
  if (services.editor && services.editorVideo === video) return services.editor;
  stopEditor();
  const job = newJob('editor', video, `Motion Canvas editor · ${video}`, {service: true});
  runProc(job, process.execPath, [path.join(ROOT, 'node_modules/vite/bin/vite.js'), '--strictPort'], ROOT,
    {VIDEO: video, EDITOR_PORT: String(EDITOR_PORT)});
  job.proc.on('close', () => { if (services.editor === job) { services.editor = null; services.editorVideo = null; } });
  services.editor = job;
  services.editorVideo = video;
  return job;
}
function stopEditor() {
  services.editor?.proc?.kill();
  services.editor = null;
  services.editorVideo = null;
}

// ── data ─────────────────────────────────────────────────────────────────────
function readIdeas() {
  try { return readJsonFile(IDEAS).ideas ?? []; } catch { return []; }
}
function writeIdeas(ideas) {
  fs.mkdirSync(path.dirname(IDEAS), {recursive: true});
  fs.writeFileSync(IDEAS, JSON.stringify({ideas}, null, 2) + '\n');
}

const vdir = slug => path.join(VIDEOS, slug);
const exists = (slug, rel) => fs.existsSync(path.join(vdir(slug), rel));
const mtime = f => { try { return Math.round(fs.statSync(f).mtimeMs); } catch { return 0; } };

function cleanText(t) { return t.replace(/\{\w+\}/g, '').replace(/\s+/g, ' ').trim(); }
function wordCount(t) { return cleanText(t).split(' ').filter(Boolean).length; }

function summary(slug) {
  const v = readVideo(vdir(slug));
  const timings = readJson(path.join(vdir(slug), 'src/timings.json'));
  const total = timings ? Object.values(timings.scenes ?? {}).reduce((a, s) => a + s.duration, 0) : 0;
  return {
    ...v,
    hasScript: exists(slug, 'narration/script.mjs'),
    hasAudio: exists(slug, 'audio/voiceover.wav'),
    sceneFiles: fs.existsSync(path.join(vdir(slug), 'src/scenes'))
      ? fs.readdirSync(path.join(vdir(slug), 'src/scenes')).filter(f => /^scene\d+\.tsx$/.test(f)).length : 0,
    thumbs: listThumbs(slug).length,
    length: total,
    timingsKind: !timings || !Object.keys(timings.scenes ?? {}).length ? 'none' : timings.estimated ? 'estimated' : (timings.provider ?? 'elevenlabs'),
  };
}

function listThumbs(slug) {
  const d = path.join(vdir(slug), 'thumbnails');
  if (!fs.existsSync(d)) return [];
  return fs.readdirSync(d).filter(f => /^thumb-\d+\.png$/.test(f)).sort()
    .map(f => ({file: f, url: `/media/videos/${slug}/thumbnails/${f}?t=${mtime(path.join(d, f))}`,
      title: titleFromHtml(path.join(d, f.replace('.png', '.html')))}));
}
/** shorts.json (as text, for editing) and the rendered shorts/short-N.mp4 files. */
function listShorts(slug) {
  const dir = vdir(slug);
  const spec = path.join(dir, 'shorts.json');
  const text = fs.existsSync(spec) ? fs.readFileSync(spec, 'utf8') : null;
  let clips = [];
  try { clips = JSON.parse(text ?? '{}').clips ?? []; } catch { /* shown as invalid in the editor */ }
  const media = f => (exists(slug, `shorts/${f}`) ? `/media/videos/${slug}/shorts/${f}?t=${mtime(path.join(dir, 'shorts', f))}` : null);
  return {spec: text, clips: clips.map((c, i) => ({n: i + 1, title: c.title ?? '', from: c.from, to: c.to,
    shots: 1 + (c.shots?.length ?? 0), video: media(`short-${i + 1}.mp4`), still: media(`short-${i + 1}.png`),
    sheet: media(`short-${i + 1}-sheet.png`)})),
    hasRender: exists(slug, 'output/project.mp4')};
}
function titleFromHtml(f) {
  try { return fs.readFileSync(f, 'utf8').match(/<title>(.*?)<\/title>/)?.[1] ?? ''; } catch { return ''; }
}
function readJson(f) { try { return readJsonFile(f); } catch { return null; } }

async function detail(slug) {
  const dir = vdir(slug);
  const s = summary(slug);
  const mod = await importScript(dir).catch(e => ({error: e.message}));
  const timings = readJson(path.join(dir, 'src/timings.json'));
  const histDir = path.join(dir, 'narration/history');
  const versions = fs.existsSync(histDir)
    ? fs.readdirSync(histDir).map(f => Number(f.match(/^script\.v(\d+)\.mjs$/)?.[1])).filter(Boolean).sort((a, b) => a - b) : [];
  const brand = readJson(path.join(ROOT, 'shared/brand/brand.json'));
  const scenes = (mod?.scenes ?? []).map(sc => sc.intro ? {
    ...sc,
    introTitle: brand?.intros?.[sc.intro === 'default' ? brand.defaultIntro : sc.intro]?.title ?? sc.intro,
    text: '', clean: '', words: 0,
    audio: exists(slug, `audio/scenes/${sc.id}.wav`) ? `/media/videos/${slug}/audio/scenes/${sc.id}.wav?t=${mtime(path.join(dir, `audio/scenes/${sc.id}.wav`))}` : null,
    seconds: timings?.scenes?.[sc.id]?.duration ?? brand?.intros?.[sc.intro === 'default' ? brand.defaultIntro : sc.intro]?.duration ?? 7,
  } : ({
    ...sc,
    clean: cleanText(sc.text),
    words: wordCount(sc.text),
    seconds: timings?.scenes?.[sc.id]?.duration ?? (wordCount(sc.text) / 140) * 60,
    audio: exists(slug, `audio/scenes/${sc.id}.wav`) ? `/media/videos/${slug}/audio/scenes/${sc.id}.wav?t=${mtime(path.join(dir, `audio/scenes/${sc.id}.wav`))}` : null,
  }));
  const read = rel => { try { return fs.readFileSync(path.join(dir, rel), 'utf8'); } catch { return null; } };
  return {
    ...s,
    meta: mod?.meta ?? null,
    scriptError: mod?.error ?? null,
    scenes,
    narrationChars: scenes.reduce((a, sc) => a + (sc.clean?.length ?? 0), 0), // what ElevenLabs bills
    versions, // earlier script versions in narration/history/
    brief: read('brief.md'),
    chapters: read('audio/chapters.txt'),
    captions: exists(slug, 'audio/captions.srt') ? `/media/videos/${slug}/audio/captions.srt` : null,
    voiceover: s.hasAudio ? `/media/videos/${slug}/audio/voiceover.wav?t=${mtime(path.join(dir, 'audio/voiceover.wav'))}` : null,
    thumbnails: listThumbs(slug),
    thumbPreview: exists(slug, 'thumbnails/preview.png') ? `/media/videos/${slug}/thumbnails/preview.png?t=${mtime(path.join(dir, 'thumbnails/preview.png'))}` : null,
    renders: fs.existsSync(path.join(dir, 'output')) ? fs.readdirSync(path.join(dir, 'output')).filter(f => f.endsWith('.mp4')) : [],
    shorts: listShorts(slug),
  };
}

async function oldScript(slug, version) {
  const f = path.join(vdir(slug), `narration/history/script.v${Number(version)}.mjs`);
  if (!fs.existsSync(f)) throw httpError(404, 'no such version');
  const mod = await import(`file:///${f.replace(/\\/g, '/')}?t=${Date.now()}`);
  return {meta: mod.meta, scenes: mod.scenes.map(sc => ({...sc, clean: cleanText(sc.text)}))};
}

function voiceInfo() {
  const cfg = readJson(path.join(VOICE, 'voice.json')) ?? {};
  const tests = path.join(VOICE, 'tests');
  const runs = fs.existsSync(tests)
    ? fs.readdirSync(tests).filter(d => d.startsWith('bakeoff-') && fs.existsSync(path.join(tests, d, 'report.json'))).sort().reverse()
    : [];
  const cands = fs.existsSync(path.join(VOICE, 'candidates')) ? fs.readdirSync(path.join(VOICE, 'candidates')).filter(f => f.endsWith('.wav')) : [];
  const says = fs.existsSync(tests) ? fs.readdirSync(tests).filter(f => /^say-.*\.wav$/.test(f)).sort().reverse().slice(0, 8) : [];
  return {
    config: cfg,
    reference: fs.existsSync(path.join(VOICE, 'reference.wav')) ? `/media/voice/reference.wav?t=${mtime(path.join(VOICE, 'reference.wav'))}` : null,
    candidates: cands.map(f => ({file: f, url: `/media/voice/candidates/${f}`})),
    runs: runs.map(r => ({...readJson(path.join(tests, r, 'report.json')), base: `/media/voice/tests/${r}/audio/`})),
    says: says.map(f => {
      const side = readJson(path.join(tests, f.replace(/\.wav$/, '.json')));
      const cur = ['engine', 'exaggeration', 'cfg_weight', 'temperature', 'seed', 'sentence_pause'];
      return {file: f, url: `/media/voice/tests/${f}`, settings: side?.settings ?? null,
        current: !!side && cur.every(k => String(side.settings[k]) === String(cfg[k]))};
    }),
    pilotAB: fs.existsSync(path.join(tests, 'pilot-local.wav')) && fs.existsSync(path.join(tests, 'pilot-elevenlabs.wav'))
      ? {local: `/media/voice/tests/pilot-local.wav?t=${mtime(path.join(tests, 'pilot-local.wav'))}`, elevenlabs: '/media/voice/tests/pilot-elevenlabs.wav'}
      : null,
  };
}

// ── HTTP ─────────────────────────────────────────────────────────────────────
function httpError(status, message) { return Object.assign(new Error(message), {status}); }
function send(res, status, body, type = 'application/json') {
  res.writeHead(status, {'Content-Type': type, 'Cache-Control': 'no-store'});
  res.end(type === 'application/json' ? JSON.stringify(body) : body);
}
async function body(req) {
  let data = '';
  for await (const chunk of req) data += chunk;
  return data ? JSON.parse(data) : {};
}

const MIME = {'.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.png': 'image/png', '.svg': 'image/svg+xml', '.wav': 'audio/wav', '.mp4': 'video/mp4', '.srt': 'text/plain; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8', '.json': 'application/json', '.woff2': 'font/woff2', '.md': 'text/plain; charset=utf-8'};

function serveFile(req, res, file, root) {
  const resolved = path.resolve(file);
  if (!resolved.startsWith(path.resolve(root) + path.sep) || !fs.existsSync(resolved) || fs.statSync(resolved).isDirectory()) {
    return send(res, 404, {error: 'not found'});
  }
  const type = MIME[path.extname(resolved).toLowerCase()];
  if (!type) return send(res, 403, {error: 'type not served'});
  const stat = fs.statSync(resolved);
  const range = req.headers.range?.match(/bytes=(\d*)-(\d*)/);
  if (range && /audio|video/.test(type)) { // seeking in <audio>/<video>
    const start = range[1] ? Number(range[1]) : 0;
    const end = range[2] ? Number(range[2]) : stat.size - 1;
    res.writeHead(206, {'Content-Type': type, 'Content-Range': `bytes ${start}-${end}/${stat.size}`,
      'Accept-Ranges': 'bytes', 'Content-Length': end - start + 1});
    fs.createReadStream(resolved, {start, end}).pipe(res);
    return;
  }
  res.writeHead(200, {'Content-Type': type, 'Content-Length': stat.size, 'Accept-Ranges': 'bytes', 'Cache-Control': 'no-cache'});
  fs.createReadStream(resolved).pipe(res);
}

const jobView = j => ({id: j.id, kind: j.kind, video: j.video, label: j.label, status: j.status, started: j.started,
  ended: j.ended, service: !!j.service, sessionId: j.sessionId, result: j.result,
  claude: !!ACTIONS[j.kind]?.claude, last: j.log.at(-1)?.text ?? ''});

const routes = [
  ['GET', /^\/api\/state$/, async () => ({
    videos: listVideos().map(slug => {
      try { return summary(slug); } catch (e) { return {slug, title: `⚠ ${slug}: ${e.message}`, stage: 'script', reviews: []}; }
    }),
    ideas: readIdeas(),
    jobs: [...jobs.values()].reverse().map(jobView),
    services: {tts: await ttsHealth(), ttsRunning: !!services.tts, editor: services.editorVideo, editorPort: EDITOR_PORT,
      elevenlabs: !!(process.env.ELEVENLABS_API_KEY && process.env.ELEVENLABS_VOICE_ID)},
  })],
  ['GET', /^\/api\/videos\/([\w-]+)$/, (_, m) => detail(m[1])],
  ['GET', /^\/api\/videos\/([\w-]+)\/script\/(\d+)$/, (_, m) => oldScript(m[1], m[2])],
  ['POST', /^\/api\/videos$/, async req => {
    const b = await body(req);
    let idea = null;
    if (b.ideaId) {
      const ideas = readIdeas();
      idea = ideas.find(i => i.id === b.ideaId);
      if (!idea) throw httpError(404, 'idea not found');
      idea.status = 'picked';
      writeIdeas(ideas);
    }
    const src = idea ?? b;
    const {slug} = createVideo({
      name: b.name || src.topic || src.title, title: src.title, topic: src.topic, aha: src.aha, pain: src.pain,
      format: src.format, idea,
      notes: [b.notes, idea?.example ? `Running example: ${idea.example}` : '',
        idea?.chain?.length ? `Chain draft: ${idea.chain.join(' | ')}` : '',
        idea?.didntKnow?.length ? `Didn't-know candidates: ${idea.didntKnow.join(' | ')}` : '',
        idea?.visual ? `Core visual: ${idea.visual}` : '', idea?.device ? `Device: ${idea.device}` : ''].filter(Boolean).join('  \n'),
    });
    if (idea) { idea.video = slug; writeIdeas(readIdeas().map(i => (i.id === idea.id ? {...i, status: 'picked', video: slug} : i))); }
    if (b.autoScript) await runAction('write-script', slug);
    return {slug};
  }],
  ['POST', /^\/api\/videos\/([\w-]+)\/review$/, async (req, m) => {
    const b = await body(req);
    const dir = vdir(m[1]);
    const v = readVideo(dir);
    if (!['approved', 'changes'].includes(b.decision)) throw httpError(400, 'decision must be approved|changes');
    const comments = (b.comments ?? []).filter(c => c.text?.trim());
    if (b.decision === 'changes' && !comments.length && !b.general?.trim()) throw httpError(400, 'add at least one comment');
    v.reviews = [...(v.reviews ?? []), {version: v.scriptVersion ?? 1, at: new Date().toISOString(),
      decision: b.decision, general: b.general ?? '', comments}];
    writeVideo(dir, v);
    if (b.decision === 'approved') {
      logEvent(dir, `Script v${v.scriptVersion ?? 1} approved`, {stage: 'voice'});
      return {ok: true};
    }
    logEvent(dir, `Changes requested on v${v.scriptVersion ?? 1} (${comments.length} comments)`);
    const job = b.autoRevise === false ? null : await runAction('revise-script', m[1]);
    return {ok: true, job: job?.id};
  }],
  ['POST', /^\/api\/videos\/([\w-]+)\/stage$/, async (req, m) => {
    const b = await body(req);
    if (!STAGES.includes(b.stage)) throw httpError(400, 'bad stage');
    logEvent(vdir(m[1]), b.message || `Moved to ${b.stage} in Studio`, {stage: b.stage});
    return {ok: true};
  }],
  ['POST', /^\/api\/videos\/([\w-]+)\/thumbnail$/, async (req, m) => {
    const b = await body(req);
    const dir = vdir(m[1]);
    const v = readVideo(dir);
    logEvent(dir, `Thumbnail ${b.file} selected`, {selectedThumbnail: b.file,
      stage: STAGES.indexOf(v.stage) < STAGES.indexOf('publish') ? 'publish' : v.stage});
    return {ok: true};
  }],
  ['POST', /^\/api\/videos\/([\w-]+)\/shorts$/, async (req, m) => {
    const b = await body(req);
    let spec;
    try { spec = JSON.parse(String(b.content ?? '')); } catch (e) { throw httpError(400, `shorts.json is not valid JSON: ${e.message}`); }
    if (!Array.isArray(spec.clips)) throw httpError(400, 'shorts.json needs a "clips" array');
    fs.writeFileSync(path.join(vdir(m[1]), 'shorts.json'), `${JSON.stringify(spec, null, 2)}\n`);
    return {ok: true};
  }],
  ['POST', /^\/api\/videos\/([\w-]+)\/brief$/, async (req, m) => {
    const b = await body(req);
    fs.writeFileSync(path.join(vdir(m[1]), 'brief.md'), String(b.content ?? ''));
    return {ok: true};
  }],
  ['POST', /^\/api\/ideas\/([\w-]+)$/, async (req, m) => {
    const b = await body(req);
    const ideas = readIdeas();
    const idea = ideas.find(i => i.id === m[1]);
    if (!idea) throw httpError(404, 'idea not found');
    if (b.status) idea.status = b.status;
    writeIdeas(ideas);
    return {ok: true};
  }],
  ['POST', /^\/api\/run$/, async req => {
    const b = await body(req);
    const job = await runAction(b.action, b.video, b.arg);
    return {job: job.id};
  }],
  ['GET', /^\/api\/jobs\/([\w-]+)$/, (_, m) => {
    const j = jobs.get(m[1]);
    if (!j) throw httpError(404, 'no such job');
    return {...jobView(j), log: j.log};
  }],
  ['POST', /^\/api\/jobs\/([\w-]+)\/cancel$/, (_, m) => {
    const j = jobs.get(m[1]);
    if (j?.proc && j.status === 'running') { j.proc.kill(); finish(j, 'cancelled'); }
    return {ok: true};
  }],
  ['POST', /^\/api\/jobs\/([\w-]+)\/followup$/, async (req, m) => {
    const j = jobs.get(m[1]);
    const b = await body(req);
    if (!j?.sessionId) throw httpError(400, 'that job has no Claude session to continue');
    const job = await runAction(j.kind, j.video, null, {followup: b.message, resume: j.sessionId});
    return {job: job.id};
  }],
  ['POST', /^\/api\/services\/tts\/(start|stop)$/, async (_, m) => {
    if (m[1] === 'start') {
      if (gpuBusy()?.kind === 'voicelab') throw httpError(409, 'The voice lab is using the GPU');
      if (!(await ttsHealth())) startTts();
    } else await stopTts();
    return {ok: true};
  }],
  ['POST', /^\/api\/services\/editor\/(start|stop)$/, async (req, m) => {
    if (m[1] === 'stop') { stopEditor(); return {ok: true}; }
    const b = await body(req);
    if (!fs.existsSync(path.join(vdir(b.video), 'src/project.ts'))) throw httpError(400, 'video has no project.ts');
    startEditor(b.video);
    return {ok: true, url: `http://localhost:${EDITOR_PORT}`};
  }],
  ['GET', /^\/api\/voice$/, () => voiceInfo()],
  ['POST', /^\/api\/voice\/apply$/, async req => {
    const b = await body(req);
    const job = await runAction('voicelab', null, `apply ${b.run} ${Number(b.rank)}`);
    return {job: job.id};
  }],
  ['POST', /^\/api\/voice\/config$/, async req => {
    const b = await body(req);
    const f = path.join(VOICE, 'voice.json');
    const cfg = {...(readJson(f) ?? {})};
    for (const k of ['engine', 'exaggeration', 'cfg_weight', 'temperature', 'seed', 'sentence_pause']) {
      if (b[k] !== undefined && b[k] !== '') cfg[k] = k === 'engine' ? String(b[k]) : Number(b[k]);
    }
    fs.writeFileSync(f, JSON.stringify(cfg, null, 2) + '\n');
    return {ok: true};
  }],
];

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://x');
  const p = decodeURIComponent(url.pathname);
  try {
    // live job log
    const sse = p.match(/^\/api\/jobs\/([\w-]+)\/stream$/);
    if (sse) {
      const j = jobs.get(sse[1]);
      if (!j) return send(res, 404, {error: 'no such job'});
      res.writeHead(200, {'Content-Type': 'text/event-stream', 'Cache-Control': 'no-store', Connection: 'keep-alive'});
      for (const e of j.log) res.write(`data: ${JSON.stringify(e)}\n\n`);
      if (j.status !== 'running') { res.write(`event: end\ndata: ${JSON.stringify({status: j.status})}\n\n`); return res.end(); }
      j.listeners.add(res);
      req.on('close', () => j.listeners.delete(res));
      return;
    }
    for (const [method, re, fn] of routes) {
      const m = p.match(re);
      if (m && req.method === method) return send(res, 200, await fn(req, m));
    }
    if (p.startsWith('/media/videos/')) return serveFile(req, res, path.join(VIDEOS, p.slice('/media/videos/'.length)), VIDEOS);
    if (p.startsWith('/media/voice/')) return serveFile(req, res, path.join(VOICE, p.slice('/media/voice/'.length)), VOICE);
    if (p.startsWith('/fonts/')) return serveFile(req, res, path.join(ROOT, 'node_modules/@fontsource', p.slice(7)), path.join(ROOT, 'node_modules/@fontsource'));
    if (p.startsWith('/api/')) return send(res, 404, {error: 'unknown endpoint'});
    return serveFile(req, res, path.join(PUBLIC, p === '/' ? 'index.html' : p), PUBLIC);
  } catch (e) {
    send(res, e.status ?? 500, {error: e.message});
  }
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`\n  Under the Abstraction · Studio  →  http://localhost:${PORT}\n`);
});
for (const sig of ['SIGINT', 'SIGTERM']) {
  process.on(sig, () => {
    for (const j of jobs.values()) j.proc?.kill();
    process.exit(0);
  });
}
