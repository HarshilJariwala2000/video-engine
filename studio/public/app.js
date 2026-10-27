// Studio front-end: no framework, no build. Re-renders views from server state.
const $ = (sel, el = document) => el.querySelector(sel);
const $$ = (sel, el = document) => [...el.querySelectorAll(sel)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
const clock = s => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
const ago = t => { const s = (Date.now() - t) / 1000; return s < 60 ? 'just now' : s < 3600 ? `${Math.floor(s / 60)}m ago` : `${Math.floor(s / 3600)}h ago`; };

const STAGES = [
  {id: 'script', label: 'Script', tab: 'script'},
  {id: 'review', label: 'Review', tab: 'script'},
  {id: 'voice', label: 'Voice', tab: 'voice'},
  {id: 'code', label: 'Animation', tab: 'animation'},
  {id: 'thumbnails', label: 'Thumbnails', tab: 'thumbnails'},
  {id: 'publish', label: 'Publish', tab: 'publish'},
];
const TABS = [['script', 'Script & review'], ['voice', 'Voice'], ['animation', 'Animation'], ['thumbnails', 'Thumbnails'], ['shorts', 'Shorts'],
  ['publish', 'Publish'], ['brief', 'Brief'], ['history', 'History']];

const S = {data: null, video: null, videoSlug: null, route: [], activeJob: null, es: null, ideaFilter: 'new',
  showDiff: false, prev: null, voice: null};

async function api(path, opts = {}) {
  const res = await fetch(path, {headers: {'Content-Type': 'application/json'}, ...opts,
    body: opts.body ? JSON.stringify(opts.body) : undefined});
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || res.statusText);
  return json;
}
function toast(msg, err = false) {
  const t = $('#toast');
  t.textContent = msg;
  t.className = err ? 'err' : '';
  t.hidden = false;
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => (t.hidden = true), err ? 6000 : 3000);
}
async function run(action, video, arg) {
  try {
    const {job} = await api('/api/run', {method: 'POST', body: {action, video, arg}});
    openJob(job);
    await refresh();
  } catch (e) { toast(e.message, true); }
}

// ── state + polling ──────────────────────────────────────────────────────────
let lastJobStates = {};
async function refresh() {
  S.data = await api('/api/state');
  // when a job for the open video finishes, reload that video
  let reloadVideo = false;
  for (const j of S.data.jobs) {
    if (lastJobStates[j.id] === 'running' && j.status !== 'running') {
      if (j.video && j.video === S.videoSlug) reloadVideo = true;
      if (j.kind === 'brainstorm' || j.kind === 'voicelab') reloadVideo = true;
    }
  }
  lastJobStates = Object.fromEntries(S.data.jobs.map(j => [j.id, j.status]));
  renderSidebar();
  renderJobs();
  if (reloadVideo) await loadRoute(false);
  else if (S.route[0] === '' || S.route[0] === 'ideas') {
    // only rebuild when something changed, and never under the user's cursor:
    // replacing the page while they type wipes the text and drops focus
    const sig = JSON.stringify([S.data.ideas, S.data.videos, S.data.jobs.map(j => [j.id, j.status])]);
    if (sig !== S.mainSig && !editingInMain()) { S.mainSig = sig; renderMain(); }
  }
}
function editingInMain() {
  const a = document.activeElement;
  return !!a && $('#main').contains(a) && a.matches('input, textarea, select');
}
setInterval(() => refresh().catch(() => {}), 2500);

// ── router ───────────────────────────────────────────────────────────────────
window.addEventListener('hashchange', () => loadRoute(true));
async function loadRoute(scrollTop = true) {
  S.route = location.hash.replace(/^#\/?/, '').split('/');
  if (S.route[0] === 'v') {
    const slug = S.route[1];
    if (S.videoSlug !== slug) { S.showDiff = false; S.prev = null; }
    S.videoSlug = slug;
    try { S.video = await api(`/api/videos/${slug}`); } catch (e) { toast(e.message, true); }
    if (S.showDiff) await loadPrev();
  } else { S.videoSlug = null; S.video = null; }
  if (S.route[0] === 'voice') S.voice = await api('/api/voice');
  renderSidebar();
  renderMain();
  if (scrollTop) $('#main').scrollTop = 0;
}

// ── sidebar ──────────────────────────────────────────────────────────────────
function renderSidebar() {
  if (!S.data) return;
  $$('nav a').forEach(a => a.classList.toggle('active',
    (a.dataset.nav === 'home' && (S.route[0] ?? '') === '') || a.dataset.nav === S.route[0]));
  $('#video-list').innerHTML = S.data.videos.map(v => `
    <a class="vid-link ${v.slug === S.videoSlug ? 'active' : ''}" href="#/v/${v.slug}">
      <span class="name" title="${esc(v.title)}"><span class="mono dim">${v.slug.slice(0, 3)}</span> ${esc(v.slug.slice(4))}</span>
      <span class="pill st-${v.stage}">${esc(v.stage)}</span>
    </a>`).join('') || '<div class="dim" style="padding:4px 10px">No videos yet</div>';
  const sv = S.data.services;
  const tts = sv.tts;
  const ttsState = tts ? (tts.loaded ? 'on' : 'busy') : sv.ttsRunning ? 'busy' : '';
  $('#services').innerHTML = `
    <div class="side-head">Services</div>
    <div class="svc"><span class="dot ${ttsState}"></span><span>Voice (TTS)</span><span class="spacer"></span>
      ${tts || sv.ttsRunning ? `<button class="small ghost" data-svc="tts-stop">stop</button>` : `<button class="small" data-svc="tts-start">start</button>`}</div>
    ${tts ? `<div class="svc dim mono" style="font-size:10.5px">${esc(tts.engine)} · ${tts.loaded ? `${tts.vram_free_gb ?? '?'} GB free` : 'loading model…'}</div>` : ''}
    <div class="svc"><span class="dot ${sv.editor ? 'on' : ''}"></span><span>Editor</span><span class="spacer"></span>
      ${sv.editor ? `<a class="small mono accent" href="http://localhost:${sv.editorPort}" target="_blank">${esc(sv.editor.slice(0, 3))} ↗</a>
        <button class="small ghost" data-svc="editor-stop">stop</button>` : '<span class="dim">off</span>'}</div>`;
}
$('#services').addEventListener('click', async e => {
  const b = e.target.closest('[data-svc]');
  if (!b) return;
  const [svc, op] = b.dataset.svc.split('-');
  try { await api(`/api/services/${svc}/${op}`, {method: 'POST', body: {}}); await refresh(); } catch (err) { toast(err.message, true); }
});
$('#new-video-btn').addEventListener('click', () => newVideoModal());

// ── main views ───────────────────────────────────────────────────────────────
function renderMain() {
  const m = $('#main');
  if (!S.data) { m.innerHTML = '<div class="empty">Loading…</div>'; return; }
  const r = S.route[0] ?? '';
  if (r === 'ideas') return renderIdeas(m);
  if (r === 'voice') return renderVoice(m);
  if (r === 'v' && S.video) return renderVideo(m);
  return renderHome(m);
}

function nextAction(v) {
  switch (v.stage) {
    case 'script': return v.hasScript ? ['Script in progress', null] : ['Claude writes the script', ['write-script', 'Write script with Claude']];
    case 'review': return ['Your turn: review the script', ['#script', 'Open review']];
    case 'voice': return ['Generate the voiceover (local AI or ElevenLabs)', ['#voice', 'Choose voice engine']];
    case 'code': return ['Claude builds the animation', ['build-video', 'Build animation with Claude']];
    case 'thumbnails': return v.thumbs ? ['Pick a thumbnail', ['#thumbnails', 'Choose thumbnail']] : ['Claude designs 4 thumbnails', ['thumbnails', 'Design thumbnails']];
    case 'publish': return ['Render and upload', ['#publish', 'Open publish checklist']];
    default: return ['Published', null];
  }
}

function renderHome(m) {
  const vids = S.data.videos;
  const running = S.data.jobs.filter(j => j.status === 'running' && !j.service);
  const newIdeas = S.data.ideas.filter(i => i.status === 'new').length;
  m.innerHTML = `
    <div class="page-head"><div><h1>Studio</h1><div class="sub">ideas → script → review → voice → animation → thumbnails → publish</div></div>
      <span class="spacer"></span>
      <button onclick="location.hash='#/ideas'">${newIdeas} new ideas</button>
      <button class="primary" id="home-new">New video</button></div>
    ${running.length ? `<div class="card" style="margin-bottom:18px"><h3>Running now</h3>${running.map(j =>
      `<div class="row" style="margin-top:6px"><span class="dot busy"></span><a href="#" data-job="${j.id}">${esc(j.label)}</a><span class="dim mono" style="font-size:11px">${esc(j.last.slice(0, 90))}</span></div>`).join('')}</div>` : ''}
    <div class="grid cols-2">${vids.map(v => {
      const [what, act] = nextAction(v);
      return `<a class="card ${['review', 'thumbnails', 'publish'].includes(v.stage) ? 'accent-edge' : ''}" href="#/v/${v.slug}">
        <div class="row"><span class="mono dim">${v.slug}</span><span class="spacer"></span><span class="pill st-${v.stage}">${v.stage}</span></div>
        <h2 style="margin:8px 0 10px">${esc(v.title)}</h2>
        <div class="row muted" style="font-size:12.5px;gap:14px">
          <span>script v${v.scriptVersion ?? (v.hasScript ? 1 : 0)}</span><span>${v.sceneFiles} scenes coded</span>
          <span>${v.length ? clock(v.length) + ' ' + (v.timingsKind === 'estimated' ? '(est.)' : '') : 'no audio'}</span><span>${v.thumbs} thumbs</span></div>
        <div style="margin-top:12px" class="${act ? 'accent' : 'dim'}">→ ${esc(what)}</div></a>`;
    }).join('') || '<div class="empty">No videos yet. Brainstorm ideas or create one.</div>'}</div>`;
  $('#home-new').onclick = () => newVideoModal();
  $$('[data-job]', m).forEach(a => a.onclick = e => { e.preventDefault(); openJob(a.dataset.job); });
}

// ── ideas ────────────────────────────────────────────────────────────────────
function renderIdeas(m) {
  const ideas = S.data.ideas;
  const shown = ideas.filter(i => S.ideaFilter === 'all' || (i.status ?? 'new') === S.ideaFilter)
    .sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
  const count = s => ideas.filter(i => (i.status ?? 'new') === s).length;
  const busy = S.data.jobs.some(j => j.kind === 'brainstorm' && j.status === 'running');
  m.innerHTML = `
    <div class="page-head"><div><h1>Ideas</h1><div class="sub">VIDEO_BRIEF §2 formats · topic test · scored by click potential</div></div></div>
    <div class="card" style="margin-bottom:18px">
      <form class="row" id="brainstorm-form">
        <input name="focus" value="${esc(S.ideaFocus ?? '')}" placeholder="Optional focus: databases, networking, “things every web dev uses”…" style="flex:1">
        <button class="primary" ${busy ? 'disabled' : ''}>${busy ? 'Brainstorming…' : 'Brainstorm 15–20 ideas'}</button>
      </form>
    </div>
    <div class="row" style="margin-bottom:14px">
      <div class="filters">${['new', 'picked', 'rejected', 'all'].map(f =>
        `<button class="small ${S.ideaFilter === f ? 'active' : ''}" data-filter="${f}">${f} ${f === 'all' ? ideas.length : count(f)}</button>`).join('')}</div>
    </div>
    <div class="grid cols-3">${shown.map(i => `
      <div class="card idea ${i.status === 'rejected' ? 'rejected' : ''}">
        <div class="top"><span class="pill">${esc(i.format ?? '')}</span>${i.video ? `<a class="pill st-publish" href="#/v/${i.video}">${i.video}</a>` : ''}
          <span class="score">${i.score ?? '–'}/10</span></div>
        <div class="title">${esc(i.title)}</div>
        <dl class="kv" style="grid-template-columns:62px 1fr">
          <dt>aha</dt><dd>${esc(i.aha)}</dd>
          <dt>pain</dt><dd class="muted">${esc(i.pain)}</dd>
          ${i.visual ? `<dt>visual</dt><dd class="muted">${esc(i.visual)}</dd>` : ''}
        </dl>
        ${i.chain?.length ? `<details><summary class="dim mono" style="font-size:11px;cursor:pointer">${i.chain.length}-link problem chain</summary>
          <ol class="list-tight muted" style="font-size:12.5px">${i.chain.map(d => `<li>${esc(d)}</li>`).join('')}</ol></details>` : ''}
        ${i.didntKnow?.length ? `<details><summary class="dim mono" style="font-size:11px;cursor:pointer">${i.didntKnow.length} didn't-know moments</summary>
          <ul class="list-tight muted" style="font-size:12.5px">${i.didntKnow.map(d => `<li>${esc(d)}</li>`).join('')}</ul></details>` : ''}
        ${i.why ? `<div class="dim" style="font-size:12px">${esc(i.why)}</div>` : ''}
        <div class="actions">${(i.status ?? 'new') === 'new' ? `
          <button class="primary small" data-start="${i.id}">Start video + write script</button>
          <button class="small ghost" data-reject="${i.id}">Reject</button>` : i.status === 'rejected'
          ? `<button class="small ghost" data-restore="${i.id}">Restore</button>` : ''}</div>
      </div>`).join('') || '<div class="empty">No ideas here yet.</div>'}</div>`;
  $('#brainstorm-form').focus.oninput = e => { S.ideaFocus = e.target.value; };
  $('#brainstorm-form').onsubmit = e => { e.preventDefault(); e.target.focus.blur(); run('brainstorm', null, e.target.focus.value.trim()); };
  $$('[data-filter]', m).forEach(b => b.onclick = () => { S.ideaFilter = b.dataset.filter; renderMain(); });
  $$('[data-reject]', m).forEach(b => b.onclick = () => setIdea(b.dataset.reject, 'rejected'));
  $$('[data-restore]', m).forEach(b => b.onclick = () => setIdea(b.dataset.restore, 'new'));
  $$('[data-start]', m).forEach(b => b.onclick = async () => {
    b.disabled = true;
    try {
      const {slug} = await api('/api/videos', {method: 'POST', body: {ideaId: b.dataset.start, autoScript: true}});
      await refresh();
      location.hash = `#/v/${slug}/script`;
      const j = S.data.jobs.find(x => x.video === slug && x.kind === 'write-script');
      if (j) openJob(j.id);
    } catch (e) { toast(e.message, true); b.disabled = false; }
  });
}
async function setIdea(id, status) {
  await api(`/api/ideas/${id}`, {method: 'POST', body: {status}});
  await refresh();
}

function newVideoModal() {
  const md = $('#modal');
  md.hidden = false;
  md.innerHTML = `<form class="modal-box" id="nv">
    <h2>New video</h2>
    <label class="field">Short name (folder) <input name="name" required placeholder="redis"></label>
    <label class="field">Working title <input name="title" placeholder="Redis will finally make sense after this video"></label>
    <label class="field">The one aha insight <input name="aha"></label>
    <label class="field">Opening pain <input name="pain"></label>
    <label class="field">Notes for Claude <textarea name="notes"></textarea></label>
    <label class="row" style="gap:8px"><input type="checkbox" name="auto" checked style="width:auto"> Ask Claude to write the script right away</label>
    <div class="row"><span class="spacer"></span><button type="button" class="ghost" id="nv-cancel">Cancel</button><button class="primary">Create</button></div>
  </form>`;
  $('#nv-cancel').onclick = () => (md.hidden = true);
  $('#nv').onsubmit = async e => {
    e.preventDefault();
    const f = e.target;
    try {
      const {slug} = await api('/api/videos', {method: 'POST', body: {name: f.name.value, title: f.title.value, topic: f.name.value,
        aha: f.aha.value, pain: f.pain.value, notes: f.notes.value, autoScript: f.auto.checked}});
      md.hidden = true;
      await refresh();
      location.hash = `#/v/${slug}/${f.auto.checked ? 'script' : 'brief'}`;
    } catch (err) { toast(err.message, true); }
  };
}

// ── video ────────────────────────────────────────────────────────────────────
function renderVideo(m) {
  const v = S.video;
  const stageIdx = STAGES.findIndex(s => s.id === v.stage);
  const tab = S.route[2] || STAGES[Math.max(0, stageIdx)]?.tab || 'publish';
  const [what, act] = nextAction(v);
  const jobRunning = S.data.jobs.find(j => j.video === v.slug && j.status === 'running' && !j.service);
  m.innerHTML = `
    <div class="page-head"><div><h1>${esc(v.meta?.title ?? v.title)}</h1>
      <div class="sub">${v.slug} · created ${esc(v.created)} · voice: ${esc(v.timingsKind)}${v.length ? ' · ' + clock(v.length) : ''}</div></div></div>
    <div class="stepper">${STAGES.map((s, i) => `
      <div class="step ${i < stageIdx || v.stage === 'done' ? 'done' : i === stageIdx ? 'current' : ''} ${s.tab === tab ? 'viewing' : ''}" data-tab="${s.tab}">
        <span class="n">${i < stageIdx || v.stage === 'done' ? '✓' : i + 1}</span>${s.label}</div>`).join('')}</div>
    ${jobRunning ? `<div class="next"><span class="dot busy"></span><div><div class="label">Working</div>
        <div class="what">${esc(jobRunning.label)}</div><div class="dim mono" style="font-size:11px">${esc(jobRunning.last.slice(0, 140))}</div></div>
        <span class="spacer"></span><button data-open-job="${jobRunning.id}">Show log</button></div>`
      : act ? `<div class="next"><div><div class="label">Next step</div><div class="what">${esc(what)}</div></div><span class="spacer"></span>
        <button class="primary" data-next="${act[0]}">${esc(act[1])}</button></div>` : ''}
    <div class="tabs">${TABS.map(([id, label]) => `<div class="tab ${id === tab ? 'active' : ''}" data-tab="${id}">${label}</div>`).join('')}</div>
    <div id="tab-body"></div>`;
  $$('[data-tab]', m).forEach(t => t.onclick = () => (location.hash = `#/v/${v.slug}/${t.dataset.tab}`));
  $$('[data-open-job]', m).forEach(b => b.onclick = () => openJob(b.dataset.openJob));
  $$('[data-next]', m).forEach(b => b.onclick = () => {
    const a = b.dataset.next;
    if (a.startsWith('#')) location.hash = `#/v/${v.slug}/${a.slice(1)}`;
    else run(a, v.slug);
  });
  const body = $('#tab-body');
  ({script: tabScript, voice: tabVoice, animation: tabAnimation, thumbnails: tabThumbs, shorts: tabShorts, publish: tabPublish,
    brief: tabBrief, history: tabHistory}[tab] ?? tabScript)(body, v);
}

// ── script + review ──────────────────────────────────────────────────────────
const draftKey = v => `review:${v.slug}:v${v.scriptVersion ?? 1}`;
function loadDraft(v) { try { return JSON.parse(localStorage.getItem(draftKey(v))) ?? {general: '', scenes: {}}; } catch { return {general: '', scenes: {}}; } }
function saveDraft(v, d) { try { localStorage.setItem(draftKey(v), JSON.stringify(d)); } catch { /* private mode */ } }

async function loadPrev() {
  const v = S.video;
  const prevV = v.versions.filter(n => n < (v.scriptVersion ?? 1)).at(-1);
  S.prev = prevV ? {version: prevV, ...(await api(`/api/videos/${v.slug}/script/${prevV}`))} : null;
}

function wordDiff(a, b) {
  const A = a.split(/(\s+)/), B = b.split(/(\s+)/);
  const n = A.length, m = B.length;
  const dp = Array.from({length: n + 1}, () => new Uint16Array(m + 1));
  for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--)
    dp[i][j] = A[i] === B[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
  let i = 0, j = 0, out = '';
  while (i < n && j < m) {
    if (A[i] === B[j]) { out += esc(B[j]); i++; j++; }
    else if (dp[i + 1][j] >= dp[i][j + 1]) { if (A[i].trim()) out += `<span class="diff-del">${esc(A[i])}</span> `; i++; }
    else { out += B[j].trim() ? `<span class="diff-add">${esc(B[j])}</span>` : esc(B[j]); j++; }
  }
  while (i < n) { if (A[i].trim()) out += ` <span class="diff-del">${esc(A[i])}</span>`; i++; }
  while (j < m) { out += B[j].trim() ? `<span class="diff-add">${esc(B[j])}</span>` : esc(B[j]); j++; }
  return out;
}

function narrationHtml(sc, prevScene) {
  if (S.showDiff && S.prev) {
    if (!prevScene) return `<span class="diff-add">${esc(sc.clean)}</span>`;
    return wordDiff(prevScene.clean, sc.clean);
  }
  return esc(sc.text).replace(/\{(\w+)\}/g, '<span class="cue" title="cue: $1">$1</span>');
}

function tabScript(el, v) {
  if (v.scriptError) { el.innerHTML = `<div class="card bad">script.mjs has an error: ${esc(v.scriptError)}</div>`; return; }
  if (!v.scenes.length) {
    el.innerHTML = `<div class="empty">No script yet.<br><br><button class="primary" id="ws">Write script with Claude</button></div>`;
    $('#ws').onclick = () => run('write-script', v.slug);
    return;
  }
  const meta = v.meta ?? {};
  const draft = loadDraft(v);
  const reviewing = v.stage === 'review';
  const lastReview = v.reviews?.at(-1);
  const pendingRevision = lastReview?.decision === 'changes' && !lastReview.addressed;
  const words = v.scenes.reduce((a, s) => a + s.words, 0);
  const secs = v.scenes.reduce((a, s) => a + s.seconds, 0);
  const prevById = Object.fromEntries((S.prev?.scenes ?? []).map(s => [s.id, s]));
  const commentCount = Object.values(draft.scenes).filter(c => c.text?.trim()).length;

  el.innerHTML = `
    <div class="meta-strip">
      ${meta.stance ? `<div class="card"><div class="k">Stance</div>${esc(meta.stance)}</div>` : ''}
      <div class="card"><div class="k">Aha</div>${esc(meta.aha)}</div>
      <div class="card"><div class="k">Hook pain</div>${esc(meta.hook ?? v.scenes[0]?.clean.slice(0, 140))}</div>
      ${meta.example ? `<div class="card"><div class="k">Running example</div>${esc(meta.example)}</div>`
        : `<div class="card"><div class="k">Device</div>${esc(meta.device ?? '')}${meta.checklist ? `<ul class="list-tight">${meta.checklist.map(c => `<li>${esc(c)}</li>`).join('')}</ul>` : ''}</div>`}
      <div class="card"><div class="k">Length</div><span class="mono">${words} words · ${clock(secs)}</span>
        <div class="dim" style="font-size:12px">${v.scenes.length} scenes · v${v.scriptVersion ?? 1} · ${v.timingsKind === 'none' ? 'estimated from word count' : v.timingsKind + ' timings'}</div></div>
    </div>
    <div class="row" style="margin-bottom:14px">
      <label class="row" style="gap:6px;font-size:12.5px"><input type="checkbox" id="cues-toggle" style="width:auto" ${document.body.classList.contains('hide-cues') ? '' : 'checked'}> show cue markers</label>
      ${v.versions.length ? `<label class="row" style="gap:6px;font-size:12.5px"><input type="checkbox" id="diff-toggle" style="width:auto" ${S.showDiff ? 'checked' : ''}> show changes since v${v.versions.filter(n => n < (v.scriptVersion ?? 1)).at(-1) ?? '?'}</label>` : ''}
      <span class="spacer"></span>
      ${pendingRevision ? '<span class="pill st-review">changes requested · waiting for Claude</span>' : ''}
      ${lastReview?.decision === 'approved' && lastReview.version === (v.scriptVersion ?? 1) ? '<span class="pill st-publish">approved</span>' : ''}
    </div>
    ${v.scenes.map((sc, i) => {
      if (sc.intro) return `<div class="scene"><div class="scene-main" style="padding:10px 20px">
        <div class="scene-head" style="margin:0"><span class="scene-num">▍</span><span class="scene-label">CHANNEL INTRO</span>
          <span class="scene-title">${esc(sc.introTitle)}</span><span class="scene-meta">music · ${sc.seconds.toFixed(1)} s · shared/motion/intros</span></div></div>
        <div class="scene-side" style="justify-content:center">${sc.audio ? `<audio controls preload="none" src="${sc.audio}"></audio>` : '<span class="dim" style="font-size:11.5px">plays in the full voiceover</span>'}</div></div>`;
      const cues = [...sc.text.matchAll(/\{(\w+)\}/g)].map(x => x[1]);
      const c = draft.scenes[sc.id] ?? {};
      return `<div class="scene ${c.text?.trim() ? 'has-comment' : ''}" data-scene="${sc.id}">
        <div class="scene-main">
          <div class="scene-head"><span class="scene-num">${sc.id.replace('scene', '')}</span><span class="scene-label">${esc(sc.label)}</span>
            <span class="scene-title">${esc(sc.title)}</span><span class="scene-meta">${sc.words} w · ${sc.seconds.toFixed(1)} s</span></div>
          ${sc.term ? `<div class="term">NEW TERM · ${esc(sc.term)}</div>` : ''}
          <div class="narration">${narrationHtml(sc, prevById[sc.id])}</div>
          <ul class="visuals">${(sc.visual ?? []).map((b, k) => `<li>${cues[k] ? `<span class="cue-name">${esc(cues[k])}</span>` : ''}${esc(b)}</li>`).join('')}</ul>
          ${sc.checklist ? `<div class="handoff"><b>Checklist:</b> ${esc(sc.checklist)}</div>` : ''}
          ${sc.handsOff ? `<div class="handoff"><b>Hands off →</b> ${esc(sc.handsOff)}</div>` : ''}
          ${sc.leaves ? `<div class="handoff"><b>Leaves open →</b> ${esc(sc.leaves)}</div>` : ''}
        </div>
        <div class="scene-side">
          ${sc.audio ? `<audio controls preload="none" src="${sc.audio}"></audio>` : ''}
          ${c.quote ? `<div class="quote">“${esc(c.quote)}” <a href="#" data-unquote="${sc.id}" class="dim">×</a></div>` : '<div class="dim" style="font-size:11.5px">Select words in the narration to quote them.</div>'}
          <textarea data-comment="${sc.id}" placeholder="Comment on scene ${sc.id.replace('scene', '')}…" ${reviewing ? '' : 'disabled'}>${esc(c.text ?? '')}</textarea>
        </div>
      </div>`;
    }).join('')}
    <div class="grid cols-2" style="margin-top:20px">
      ${meta.chain?.length ? `<div class="card"><h3>Problem chain</h3><ol class="list-tight">${meta.chain.map(d => `<li>${esc(d)}</li>`).join('')}</ol></div>` : ''}
      ${meta.didntKnow?.length ? `<div class="card"><h3>“Didn't know that” moments</h3><ul class="list-tight">${meta.didntKnow.map(d => `<li><span class="mono dim">${esc(d.scene)}</span> ${esc(d.text)}</li>`).join('')}</ul></div>` : ''}
      ${meta.verify?.length ? `<div class="card"><h3>[VERIFY]</h3><ul class="list-tight">${meta.verify.map(d => `<li>${esc(d)}</li>`).join('')}</ul></div>` : ''}
      ${meta.terms?.length ? `<div class="card"><h3>Terms</h3><dl class="kv">${meta.terms.map(t => `<dt>${esc(t.term)} <span class="dim">· ${esc(t.scene)}</span></dt><dd>${esc(t.meaning)}</dd>`).join('')}</dl></div>` : ''}
      ${v.reviews?.length ? `<div class="card review-history"><h3>Review history</h3>${v.reviews.slice().reverse().map(r => `
        <div class="rv"><span class="pill ${r.decision === 'approved' ? 'st-publish' : 'st-review'}">${r.decision}</span>
          <span class="mono dim"> v${r.version} · ${new Date(r.at).toLocaleString()}</span>${r.addressed ? ` <span class="good mono" style="font-size:11px">✓ addressed in v${r.addressedIn ?? '?'}</span>` : ''}
          ${r.general ? `<div class="muted" style="margin-top:4px">${esc(r.general)}</div>` : ''}
          ${r.comments?.length ? `<ul class="list-tight muted">${r.comments.map(c => `<li><span class="mono">${esc(c.scene)}</span> ${c.quote ? `<i>“${esc(c.quote)}”</i> ` : ''}${esc(c.text)}</li>`).join('')}</ul>` : ''}
        </div>`).join('')}</div>` : ''}
    </div>
    ${reviewing && !pendingRevision ? `
      <div class="review-bar">
        <label class="field">General notes for Claude <textarea id="general" rows="2" placeholder="Tone, pacing, things to cut or add…">${esc(draft.general)}</textarea></label>
        <div class="row" style="flex-wrap:nowrap">
          <button class="danger" id="request-changes">Request changes${commentCount ? ` (${commentCount})` : ''}</button>
          <button class="good" id="approve">Approve script ✓</button>
        </div>
      </div>` : reviewing && pendingRevision ? `<div class="card" style="margin-top:18px">Claude is revising (or should revise) this script from your last review.
        <button class="small" id="revise-now">Run revision now</button></div>` : ''}`;

  $('#cues-toggle').onchange = e => document.body.classList.toggle('hide-cues', !e.target.checked);
  const dt = $('#diff-toggle');
  if (dt) dt.onchange = async e => { S.showDiff = e.target.checked; if (S.showDiff) await loadPrev(); renderMain(); };
  $$('[data-comment]', el).forEach(t => t.oninput = () => {
    const d = loadDraft(v);
    d.scenes[t.dataset.comment] = {...(d.scenes[t.dataset.comment] ?? {}), text: t.value};
    saveDraft(v, d);
    t.closest('.scene').classList.toggle('has-comment', !!t.value.trim());
    const n = Object.values(d.scenes).filter(c => c.text?.trim()).length;
    const rc = $('#request-changes');
    if (rc) rc.textContent = `Request changes${n ? ` (${n})` : ''}`;
  });
  $$('[data-unquote]', el).forEach(a => a.onclick = e => {
    e.preventDefault();
    const d = loadDraft(v);
    delete d.scenes[a.dataset.unquote]?.quote;
    saveDraft(v, d);
    renderMain();
  });
  // quote selected narration into the scene's comment
  $$('.narration', el).forEach(n => n.onmouseup = () => {
    if (!reviewing) return;
    const sel = window.getSelection().toString().trim();
    if (sel.length < 3) return;
    const id = n.closest('.scene').dataset.scene;
    const d = loadDraft(v);
    d.scenes[id] = {...(d.scenes[id] ?? {}), quote: sel.replace(/\s+/g, ' ')};
    saveDraft(v, d);
    renderMain();
    setTimeout(() => $(`[data-comment="${id}"]`)?.focus(), 0);
  });
  const g = $('#general');
  if (g) g.oninput = () => { const d = loadDraft(v); d.general = g.value; saveDraft(v, d); };
  const submit = async decision => {
    const d = loadDraft(v);
    const comments = Object.entries(d.scenes).filter(([, c]) => c.text?.trim()).map(([scene, c]) => ({scene, quote: c.quote, text: c.text.trim()}));
    try {
      const r = await api(`/api/videos/${v.slug}/review`, {method: 'POST', body: {decision, general: d.general, comments}});
      localStorage.removeItem(draftKey(v));
      toast(decision === 'approved' ? 'Script approved. Next: generate the voiceover.' : 'Sent to Claude for revision.');
      if (r.job) openJob(r.job);
      await refresh();
      await loadRoute(false);
    } catch (e) { toast(e.message, true); }
  };
  const rc = $('#request-changes');
  if (rc) rc.onclick = () => submit('changes');
  const ap = $('#approve');
  if (ap) ap.onclick = () => {
    const d = loadDraft(v);
    const pending = Object.values(d.scenes).filter(c => c.text?.trim()).length;
    if (pending && !window.confirm(`You have ${pending} unsent comment(s). Approve anyway?`)) return;
    submit('approved');
  };
  const rn = $('#revise-now');
  if (rn) rn.onclick = () => run('revise-script', v.slug);
}

// ── voice tab ────────────────────────────────────────────────────────────────
function tabVoice(el, v) {
  const tts = S.data.services.tts;
  const elReady = S.data.services.elevenlabs;
  // the engine that voiced this video last: re-rolls use it so the voice stays consistent
  const last = ['local', 'elevenlabs'].includes(v.timingsKind) ? v.timingsKind : null;
  const name = p => (p === 'local' ? 'Local AI' : 'ElevenLabs');
  el.innerHTML = `
    <div class="grid cols-2" style="margin-bottom:18px">
      <div class="card"><h3>Generate the voiceover with…</h3>
        <div class="grid" style="grid-template-columns:1fr 1fr;gap:12px;margin-top:10px">
          <div class="card ${last === 'local' ? 'accent-edge' : ''}" style="padding:12px 14px;background:#161616">
            <div class="row"><b>Local AI</b><span class="spacer"></span><span class="pill">free</span></div>
            <p class="muted" style="font-size:12.5px;margin:6px 0 10px">Chatterbox on your GPU with the channel voice (Studio → Voice). Whisper re-rolls garbled lines. ~1 min per minute of audio.</p>
            <button class="primary" id="gen-local" ${v.hasScript ? '' : 'disabled'}>Generate with local AI</button>
            <div class="dim" style="font-size:11.5px;margin-top:8px">${tts ? `server ready · ${esc(tts.gpu ?? tts.device)}${tts.loaded ? '' : ' (loading…)'}` : 'server starts automatically'}</div>
          </div>
          <div class="card ${last === 'elevenlabs' ? 'accent-edge' : ''}" style="padding:12px 14px;background:#161616">
            <div class="row"><b>ElevenLabs</b><span class="spacer"></span><span class="pill">credits</span></div>
            <p class="muted" style="font-size:12.5px;margin:6px 0 10px">The pilot's cloud voice (voice ID in .env). Fast, exact timestamps. ≈ ${(v.narrationChars ?? 0).toLocaleString()} characters if no scene is cached.</p>
            <button class="primary" id="gen-eleven" ${v.hasScript && elReady ? '' : 'disabled'}>Generate with ElevenLabs</button>
            <div class="dim" style="font-size:11.5px;margin-top:8px">${elReady ? 'API key + voice ID found in .env' : '<span class="bad">set ELEVENLABS_API_KEY and ELEVENLABS_VOICE_ID in .env, then restart the Studio</span>'}</div>
          </div>
        </div>
        <div class="row" style="margin-top:12px"><button class="small" id="est">Estimate timings only (no audio)</button>
          <span class="dim" style="font-size:12px">${last ? `Last voiced with <b>${name(last)}</b>; re-roll uses it. Each engine keeps its own cache, so switching back is free.` : 'Not voiced yet.'}</span></div>
      </div>
      <div class="card"><h3>Full voiceover</h3>
        ${v.voiceover ? `<audio controls preload="none" src="${v.voiceover}"></audio>
          <div class="dim mono" style="font-size:11.5px;margin-top:8px">${clock(v.length)} · ${esc(v.timingsKind)} ${v.captions ? `· <a class="accent" href="${v.captions}" target="_blank">captions.srt</a>` : ''}</div>`
          : '<div class="dim">Not generated yet.</div>'}
        ${v.stage === 'voice' && v.hasAudio && v.timingsKind !== 'estimated' ? `<div style="margin-top:12px"><button class="good" id="voice-ok">Sounds good → Animation</button></div>` : ''}
      </div>
    </div>
    <h2 style="margin-bottom:10px">Scenes</h2>
    <table class="voice-table"><thead><tr><th>#</th><th>Label</th><th>Narration</th><th style="width:300px">Audio</th><th></th></tr></thead><tbody>
    ${v.scenes.map(sc => sc.intro ? `<tr><td class="mono accent">▍</td><td class="mono dim" style="font-size:11px">INTRO</td>
      <td style="font-size:12.5px" class="muted">Channel intro “${esc(sc.introTitle)}”: music only, ${sc.seconds.toFixed(1)} s (same for both engines)</td>
      <td>${sc.audio ? `<audio controls preload="none" src="${sc.audio}"></audio>` : '<span class="dim">in the full voiceover</span>'}</td><td></td></tr>` : `<tr><td class="mono accent">${sc.id.replace('scene', '')}</td><td class="mono dim" style="font-size:11px">${esc(sc.label)}</td>
      <td style="font-size:12.5px">${esc(sc.clean)}</td>
      <td>${sc.audio ? `<audio controls preload="none" src="${sc.audio}"></audio>` : '<span class="dim">–</span>'}</td>
      <td><button class="small ghost" data-reroll="${sc.id}" title="Generate a new take of this scene">re-roll</button></td></tr>`).join('')}
    </tbody></table>`;
  $('#gen-local').onclick = () => run('voice', v.slug);
  $('#gen-eleven').onclick = () => {
    if (window.confirm(`Generate with ElevenLabs? Uncached scenes use credits (up to ≈ ${(v.narrationChars ?? 0).toLocaleString()} characters).`)) run('voice-elevenlabs', v.slug);
  };
  $('#est').onclick = () => run('voice-estimate', v.slug);
  const ok = $('#voice-ok');
  if (ok) ok.onclick = async () => { await api(`/api/videos/${v.slug}/stage`, {method: 'POST', body: {stage: 'code', message: 'Voiceover approved'}}); await loadRoute(false); };
  $$('[data-reroll]', el).forEach(b => b.onclick = () => run(last === 'elevenlabs' ? 'voice-elevenlabs' : 'voice', v.slug, b.dataset.reroll));
}

// ── animation tab ────────────────────────────────────────────────────────────
function tabAnimation(el, v) {
  const editorOn = S.data.services.editor === v.slug;
  const lastCheck = S.data.jobs.find(j => j.video === v.slug && j.kind === 'check');
  el.innerHTML = `
    <div class="grid cols-2">
      <div class="card"><h3>Build with Claude</h3>
        <p class="muted" style="margin:4px 0 12px">Claude writes one Motion Canvas scene per narration scene, synced to the cue times, then runs the automated check until it passes.</p>
        <div class="row"><button class="primary" id="build">Build animation</button>
        ${v.sceneFiles ? `<span class="dim">${v.sceneFiles} scene files exist</span>` : ''}</div>
        ${v.timingsKind === 'estimated' || v.timingsKind === 'none' ? '<div class="bad" style="font-size:12px;margin-top:10px">Timings are not from real audio yet. Generate the voiceover first for exact sync.</div>' : ''}
      </div>
      <div class="card"><h3>Preview & render</h3>
        <p class="muted" style="margin:4px 0 12px">The Motion Canvas editor plays the animation with the voiceover. Render from its Video Settings tab (FFmpeg, 60 fps, audio on); files land in <span class="mono">videos/${v.slug}/output</span>.</p>
        <div class="row">
          <button id="editor">${editorOn ? 'Editor running' : 'Start editor'}</button>
          ${editorOn ? `<a class="accent" href="http://localhost:${S.data.services.editorPort}" target="_blank">open localhost:${S.data.services.editorPort} ↗</a>` : ''}
          <button id="check">Run check</button>
        </div>
        ${lastCheck ? `<div class="dim mono" style="font-size:11.5px;margin-top:10px">last check: <span class="${lastCheck.status === 'done' ? 'good' : lastCheck.status === 'running' ? '' : 'bad'}">${lastCheck.status}</span> · ${ago(lastCheck.started)}</div>` : ''}
        ${v.renders.length ? `<div style="margin-top:10px">Renders: ${v.renders.map(f => `<a class="accent mono" href="/media/videos/${v.slug}/output/${f}" target="_blank">${esc(f)}</a>`).join(', ')}</div>` : ''}
      </div>
    </div>
    ${v.stage === 'code' && v.sceneFiles ? `<div style="margin-top:16px"><button class="good" id="anim-ok">Animation looks good → Thumbnails</button></div>` : ''}`;
  $('#build').onclick = () => run('build-video', v.slug);
  $('#check').onclick = () => run('check', v.slug);
  $('#editor').onclick = async () => {
    try {
      const r = await api('/api/services/editor/start', {method: 'POST', body: {video: v.slug}});
      toast('Editor starting…');
      await refresh();
      setTimeout(() => window.open(r.url, '_blank'), 3500);
    } catch (e) { toast(e.message, true); }
  };
  const ok = $('#anim-ok');
  if (ok) ok.onclick = async () => { await api(`/api/videos/${v.slug}/stage`, {method: 'POST', body: {stage: 'thumbnails', message: 'Animation approved'}}); await loadRoute(false); };
}

// ── thumbnails tab ───────────────────────────────────────────────────────────
function tabThumbs(el, v) {
  el.innerHTML = `
    <div class="card" style="margin-bottom:18px">
      <form class="row" id="thumb-form">
        <input name="notes" placeholder="${v.thumbnails.length ? 'Notes for a revision, e.g. “#2: bigger logo, try ‘NOT A VM’ on #4”' : 'Optional direction for Claude'}" style="flex:1">
        <button class="primary">${v.thumbnails.length ? 'Revise with Claude' : 'Design 4 thumbnails'}</button>
        ${v.thumbnails.length ? '<button type="button" id="rerender">Re-render HTML</button>' : ''}
      </form>
    </div>
    ${v.thumbnails.length ? `
      <div class="thumbs">${v.thumbnails.map(t => `
        <div class="thumb-card ${v.selectedThumbnail === t.file ? 'selected' : ''}" data-thumb="${t.file}">
          <img src="${t.url}" alt="${esc(t.title)}">
          <div class="thumb-foot"><img class="phone" src="${t.url}" alt=""><div><div class="mono">${esc(t.file.replace('.png', ''))}</div>
            <div class="muted" style="font-size:12.5px">${esc(t.title)}</div>
            <div class="${v.selectedThumbnail === t.file ? 'accent' : 'dim'}" style="font-size:12px;margin-top:4px">${v.selectedThumbnail === t.file ? '★ selected' : 'click to select'}</div></div></div>
        </div>`).join('')}</div>
      ${v.thumbPreview ? `<h3 style="margin:22px 0 8px">At phone size</h3><img src="${v.thumbPreview}" style="max-width:100%;border-radius:8px">` : ''}`
      : '<div class="empty">No thumbnails yet.</div>'}`;
  $('#thumb-form').onsubmit = e => { e.preventDefault(); run('thumbnails', v.slug, e.target.notes.value.trim()); };
  const rr = $('#rerender');
  if (rr) rr.onclick = () => run('thumbs', v.slug);
  $$('[data-thumb]', el).forEach(c => c.onclick = async () => {
    await api(`/api/videos/${v.slug}/thumbnail`, {method: 'POST', body: {file: c.dataset.thumb}});
    toast(`${c.dataset.thumb} selected`);
    await loadRoute(false);
  });
}

// ── shorts tab ───────────────────────────────────────────────────────────────
function tabShorts(el, v) {
  const sh = v.shorts ?? {spec: null, clips: [], hasRender: false};
  const busy = S.data.jobs.some(j => ['shorts', 'pick-shorts'].includes(j.kind) && j.video === v.slug && j.status === 'running');
  el.innerHTML = `
    <div class="card" style="margin-bottom:18px">
      <div style="margin-bottom:12px"><h3>Shorts</h3><div class="dim" style="font-size:12.5px">1080×1920 clips cut from <span class="mono">output/project.mp4</span>:
        a crop of the scene, the hook title above, big captions below. Claude picks the moments and framing; clips, titles and views live in <span class="mono">shorts.json</span>.</div></div>
      <form class="row" id="shorts-form">
        <input name="notes" value="${esc(S.shortsNotes ?? '')}" placeholder="${sh.clips.length ? 'Notes for a revision, e.g. “#2: start at the crash, tighter on the nodes”' : 'Optional direction for Claude, e.g. “one short about the scheduler”'}" style="flex:1">
        <button class="primary" ${!sh.hasRender || busy ? 'disabled' : ''}>${busy ? 'Working…' : sh.clips.length ? 'Revise with Claude' : 'Pick shorts with Claude'}</button>
        <button type="button" id="shorts-all" ${!sh.hasRender || !sh.spec || busy ? 'disabled' : ''}>Render all</button>
      </form>
      ${!sh.hasRender ? `<div class="bad" style="margin-top:10px;font-size:13px">No render yet: render the video in the editor first (output/project.mp4).</div>` : ''}
    </div>
    ${sh.clips.length ? `<div class="shorts">${sh.clips.map(c => `
      <div class="short-card">
        ${c.video ? `<video src="${c.video}" poster="${c.still ?? ''}" controls preload="none"></video>` : '<div class="short-empty dim">not rendered</div>'}
        <div class="short-foot">
          <div class="mono dim" style="font-size:11.5px">short-${c.n} · ${esc(c.from)} → ${esc(c.to)} · ${c.shots} shot${c.shots > 1 ? 's' : ''}</div>
          <div style="margin:4px 0 8px">${esc(c.title)}</div>
          <div class="row">${c.video ? `<a class="small accent" href="${c.video}" download="short-${c.n}.mp4">download</a>` : ''}
            ${c.sheet ? `<a class="small accent" href="${c.sheet}" target="_blank" title="one frame per shot">shots</a>` : ''}<span class="spacer"></span>
            <button class="small" data-short="${c.n}" ${!sh.hasRender || busy ? 'disabled' : ''}>Re-render</button></div>
        </div>
      </div>`).join('')}</div>` : '<div class="empty">No shorts.json yet. Add clips below.</div>'}
    <div class="card" style="margin-top:18px">
      <div class="row" style="margin-bottom:8px"><h3>shorts.json</h3><span class="spacer"></span><button class="small" id="shorts-save">Save</button></div>
      <div class="dim" style="font-size:12px;margin-bottom:8px">times: <span class="mono">scene15</span>, <span class="mono">scene15:cue</span>, <span class="mono">scene15:cue+1.2</span> ·
        view: <span class="mono">[centre x, centre y, width]</span> in scene coordinates (narrower = closer) · <span class="mono">shots</span>: cuts to another view at a cue</div>
      <textarea id="shorts-spec" class="mono" spellcheck="false" style="width:100%;min-height:320px;font-size:12px">${esc(sh.spec ?? SHORTS_TEMPLATE)}</textarea>
    </div>`;
  const form = $('#shorts-form');
  form.notes.oninput = e => { S.shortsNotes = e.target.value; };
  form.onsubmit = e => { e.preventDefault(); form.notes.blur(); run('pick-shorts', v.slug, form.notes.value.trim()); };
  const all = $('#shorts-all');
  if (all) all.onclick = () => run('shorts', v.slug);
  $$('[data-short]', el).forEach(b => b.onclick = () => run('shorts', v.slug, b.dataset.short));
  $('#shorts-save').onclick = async () => {
    try {
      await api(`/api/videos/${v.slug}/shorts`, {method: 'POST', body: {content: $('#shorts-spec').value}});
      toast('shorts.json saved');
      await loadRoute(false);
    } catch (e) { toast(e.message, true); }
  };
}
const SHORTS_TEMPLATE = `{
  "kicker": "Topic",
  "clips": [
    {"title": "The hook, as a title", "from": "scene05", "to": "scene05", "view": [-200, 0, 1200]}
  ]
}`;

// ── publish tab ──────────────────────────────────────────────────────────────
function tabPublish(el, v) {
  const meta = v.meta ?? {};
  const thumb = v.thumbnails.find(t => t.file === v.selectedThumbnail);
  const description = `${(meta.description ?? '').replace(/\\n/g, '\n')}${v.chapters ? `\n\nChapters\n${v.chapters.trim()}` : ''}`;
  el.innerHTML = `
    <div class="grid cols-2">
      <div class="card"><h3>Title</h3><ol class="list-tight">${(meta.titles ?? [v.title]).map(t => `<li>${esc(t)}</li>`).join('')}</ol></div>
      <div class="card"><h3>Thumbnail</h3>${thumb ? `<img src="${thumb.url}" style="width:100%;border-radius:8px">` : '<div class="dim">None selected (Thumbnails tab).</div>'}</div>
      <div class="card"><div class="row"><h3>Description + chapters</h3><span class="spacer"></span><button class="small" data-copy="desc">Copy</button></div>
        <pre id="desc" class="mono" style="white-space:pre-wrap;font-size:12px;margin:8px 0 0">${esc(description)}</pre></div>
      <div class="card"><div class="row"><h3>Tags</h3><span class="spacer"></span><button class="small" data-copy="tags">Copy</button></div>
        <div id="tags" class="mono" style="font-size:12px;margin-top:8px">${esc((meta.tags ?? []).join(', '))}</div>
        <h3 style="margin-top:16px">Files</h3>
        <ul class="list-tight">
          <li>Captions: ${v.captions ? `<a class="accent" href="${v.captions}" target="_blank">captions.srt</a>` : '<span class="dim">not generated</span>'}</li>
          <li>Video: ${v.renders.length ? v.renders.map(f => `<a class="accent" href="/media/videos/${v.slug}/output/${f}" target="_blank">${esc(f)}</a>`).join(', ') : `<span class="dim">render from the editor → videos/${v.slug}/output</span>`}</li>
        </ul></div>
    </div>
    <div class="card" style="margin-top:14px"><h3>Before publishing (VIDEO_BRIEF §10)</h3>
      <ul class="list-tight">${(meta.verify ?? []).map(x => `<li>[VERIFY] ${esc(x)}</li>`).join('')}
        <li>Mark “Altered or synthetic content” in YouTube Studio (AI voice).</li>
        <li>Upload captions.srt as English subtitles; fix technical terms.</li>
        <li>Thumbnail readable at phone size; title uses a winning format.</li></ul>
      ${v.stage !== 'done' ? `<div style="margin-top:12px"><button class="good" id="published">Mark as published</button></div>` : '<div class="good" style="margin-top:10px">Published ✓</div>'}
    </div>`;
  $$('[data-copy]', el).forEach(b => b.onclick = async () => {
    await navigator.clipboard.writeText($('#' + b.dataset.copy).textContent);
    toast('Copied');
  });
  const p = $('#published');
  if (p) p.onclick = async () => { await api(`/api/videos/${v.slug}/stage`, {method: 'POST', body: {stage: 'done', message: 'Published'}}); await refresh(); await loadRoute(false); };
}

function tabBrief(el, v) {
  el.innerHTML = `<div class="card"><div class="row" style="margin-bottom:10px"><h3>brief.md</h3><span class="dim" style="font-size:12px">VIDEO_BRIEF §0 for this video. Claude reads it at every stage.</span>
      <span class="spacer"></span><button class="primary small" id="save-brief">Save</button></div>
    <textarea id="brief" class="mono" style="min-height:420px;font-size:13px">${esc(v.brief ?? '')}</textarea></div>`;
  $('#save-brief').onclick = async () => {
    await api(`/api/videos/${v.slug}/brief`, {method: 'POST', body: {content: $('#brief').value}});
    toast('Brief saved');
  };
}

function tabHistory(el, v) {
  el.innerHTML = `<div class="card"><h3>History</h3>
    <div class="row" style="margin:6px 0 12px">Move stage manually: <select id="stage-sel" style="width:auto">${['script', 'review', 'voice', 'code', 'thumbnails', 'publish', 'done']
      .map(s => `<option ${s === v.stage ? 'selected' : ''}>${s}</option>`).join('')}</select></div>
    <table class="voice-table"><tbody>${(v.history ?? []).slice().reverse().map(h =>
      `<tr><td class="mono dim" style="width:200px">${new Date(h.at).toLocaleString()}</td><td>${esc(h.event)}</td></tr>`).join('')}</tbody></table></div>`;
  $('#stage-sel').onchange = async e => {
    await api(`/api/videos/${v.slug}/stage`, {method: 'POST', body: {stage: e.target.value}});
    await refresh();
    await loadRoute(false);
  };
}

// ── voice page (channel voice) ───────────────────────────────────────────────
function renderVoice(m) {
  const vo = S.voice ?? {config: {}, runs: [], candidates: [], says: []};
  const c = vo.config;
  const run0 = vo.runs[0];
  const busy = S.data.jobs.some(j => j.kind === 'voicelab' && j.status === 'running');
  m.innerHTML = `
    <div class="page-head"><div><h1>Channel voice</h1><div class="sub">Chatterbox (MIT) · cloned from voice/reference.wav · same narrator for every video</div></div></div>
    <div class="grid cols-2" style="margin-bottom:18px">
      <div class="card"><h3>Current voice</h3>
        ${vo.reference ? `<div class="ab" style="margin:10px 0"><span>reference</span><audio controls preload="none" src="${vo.reference}"></audio></div>` : '<div class="bad">voice/reference.wav missing</div>'}
        <form id="cfg" class="grid" style="grid-template-columns:repeat(3,1fr);gap:10px;margin-top:8px">
          <label class="field">engine <select name="engine">${['chatterbox', 'chatterbox-turbo'].map(e => `<option ${c.engine === e ? 'selected' : ''}>${e}</option>`).join('')}</select></label>
          <label class="field">exaggeration <input name="exaggeration" type="number" step="0.05" min="0.2" max="1.2" value="${c.exaggeration ?? ''}"></label>
          <label class="field">cfg_weight <input name="cfg_weight" type="number" step="0.05" min="0" max="1" value="${c.cfg_weight ?? ''}"></label>
          <label class="field">temperature <input name="temperature" type="number" step="0.05" min="0.3" max="1.2" value="${c.temperature ?? ''}"></label>
          <label class="field">seed <input name="seed" type="number" value="${c.seed ?? ''}"></label>
          <label class="field">pause between chunks (s) <input name="sentence_pause" type="number" step="0.02" value="${c.sentence_pause ?? ''}"></label>
          <div class="row" style="grid-column:1/-1"><button class="small">Save settings</button>
            <span class="dim" style="font-size:12px">${esc(c._chosen_from ? 'from ' + c._chosen_from : '')}</span></div>
        </form>
      </div>
      <div class="card"><h3>Try a line</h3>
        <form id="say" class="row" style="margin:8px 0 12px"><input name="text" placeholder="Type a sentence to hear the current voice…" style="flex:1"><button ${busy ? 'disabled' : ''}>Speak</button></form>
        ${vo.says.map(s => `<div class="ab" style="margin-bottom:2px"><span class="dim">${esc(s.file.replace('say-', '').replace('.wav', ''))}</span><audio controls preload="none" src="${s.url}"></audio></div>
          <div class="row" style="margin:0 0 10px 122px;font:11px var(--mono)">${s.settings
            ? `<span class="dim">${esc(s.settings.engine)} · exag ${s.settings.exaggeration} · cfg ${s.settings.cfg_weight} · temp ${s.settings.temperature} · seed ${s.settings.seed}</span>
               ${s.current ? '<span class="good">✓ current channel voice</span>' : `<button class="small" data-use-take="${esc(s.file)}">Use this voice</button>`}`
            : '<span class="dim">settings not recorded (made before takes saved them)</span>'}</div>`).join('')}
        <h3 style="margin-top:16px">Bake-off</h3>
        <p class="muted" style="margin:4px 0 10px;font-size:12.5px">Speaks held-out pilot sentences with every reference clip × setting and scores each config: speaker similarity to the ElevenLabs voice, pace vs the original take, and word accuracy. Stops the voice server while running (~7 min).</p>
        <div class="row"><button class="primary" id="bake" ${busy ? 'disabled' : ''}>${busy ? 'Running…' : 'Run full bake-off'}</button><button id="bake-q" ${busy ? 'disabled' : ''}>Quick</button></div>
      </div>
    </div>
    ${vo.pilotAB ? `<div class="card" style="margin-bottom:18px"><h3>Pilot A/B: the whole Docker script</h3>
      <div class="ab" style="margin-top:10px"><span>ElevenLabs</span><audio controls preload="none" src="${vo.pilotAB.elevenlabs}"></audio>
        <span>local</span><audio controls preload="none" src="${vo.pilotAB.local}"></audio></div></div>` : ''}
    ${run0 ? `
      <div class="card"><div class="row"><h3>Latest bake-off · ${esc(run0.created)}</h3><span class="spacer"></span><span class="dim mono" style="font-size:11px">${esc(run0.run)}</span></div>
        ${run0.baseline ? `<p class="muted" style="font-size:12.5px;margin:6px 0 0">Similarity = speaker-embedding match to ElevenLabs on different sentences, as a share of ElevenLabs' own consistency (${run0.baseline.toFixed(3)} = 100%). Differences under ~1% are not audible; trust your ears.</p>` : ''}
        <div class="ab" style="margin:12px 0">${run0.tests.map(t => `<span>ElevenLabs</span><div><div class="muted" style="font:12.5px var(--sans)">${esc(t.text)}</div><audio controls preload="none" src="${run0.base}${t.elevenlabs}"></audio></div>`).join('')}</div>
        <table class="voice-table"><thead><tr><th>#</th><th>Config</th><th>Similarity</th><th>Pace</th><th>WER</th><th>Score</th><th style="width:280px">Listen (sentence 1)</th><th></th></tr></thead><tbody>
        ${run0.results.map((r, i) => `<tr class="${i === 0 ? 'best' : ''}"><td class="mono">${i + 1}</td>
          <td class="mono" style="font-size:11.5px">${esc(r.engine)}<br><span class="dim">${esc(r.reference.replace('candidates/', ''))} ${esc(Object.entries(r.settings).map(([k, x]) => `${k}=${x}`).join(' '))}</span></td>
          <td><span class="bar"><i style="width:${Math.max(0, Math.min(100, ((r.similarity / (run0.baseline ?? 1)) - 0.9) * 1000))}%"></i></span>
            <span class="mono">${run0.baseline ? (100 * r.similarity / run0.baseline).toFixed(1) + '%' : r.similarity.toFixed(3)}</span></td>
          <td class="mono ${Math.abs(1 - r.pace) > 0.12 ? 'bad' : ''}">${r.pace.toFixed(2)}×</td>
          <td class="mono ${r.wer > 0.1 ? 'bad' : ''}">${(r.wer * 100).toFixed(0)}%</td>
          <td class="mono accent">${r.score.toFixed(3)}</td>
          <td><audio controls preload="none" src="${run0.base}${r.files[0]}"></audio></td>
          <td><button class="small" data-apply="${i + 1}">Use</button></td></tr>`).join('')}
        </tbody></table></div>` : '<div class="empty">No bake-off yet. Run one to find the closest match to the pilot voice.</div>'}
    ${vo.candidates.length ? `<div class="card" style="margin-top:14px"><h3>Reference candidates</h3><div class="ab" style="margin-top:10px">${vo.candidates.map(x => `<span>${esc(x.file.replace('.wav', ''))}</span><audio controls preload="none" src="${x.url}"></audio>`).join('')}</div></div>` : ''}`;
  $('#cfg').onsubmit = async e => {
    e.preventDefault();
    const f = Object.fromEntries(new FormData(e.target));
    await api('/api/voice/config', {method: 'POST', body: f});
    toast('Saved. New settings apply to newly generated scenes.');
    S.voice = await api('/api/voice');
    renderMain();
  };
  $('#say').onsubmit = e => { e.preventDefault(); const t = e.target.text.value.trim(); if (t) run('voicelab', null, ['say', t]); };
  $$('[data-use-take]', m).forEach(b => b.onclick = async () => {
    const take = vo.says.find(s => s.file === b.dataset.useTake);
    await api('/api/voice/config', {method: 'POST', body: take.settings});
    toast(`Channel voice set from take ${take.file.replace('say-', '').replace('.wav', '')}. Every new voiceover uses it.`);
    S.voice = await api('/api/voice');
    renderMain();
  });
  $('#bake').onclick = () => run('voicelab', null, 'bakeoff');
  $('#bake-q').onclick = () => run('voicelab', null, 'bakeoff --quick');
  $$('[data-apply]', m).forEach(b => b.onclick = async () => {
    try {
      const {job} = await api('/api/voice/apply', {method: 'POST', body: {run: run0.run, rank: b.dataset.apply}});
      openJob(job);
      setTimeout(async () => { S.voice = await api('/api/voice'); renderMain(); }, 2500);
    } catch (err) { toast(err.message, true); }
  });
}

// ── jobs drawer ──────────────────────────────────────────────────────────────
function renderJobs() {
  const jobs = S.data?.jobs ?? [];
  const running = jobs.filter(j => j.status === 'running' && !j.service);
  $('#drawer-status').innerHTML = running.length
    ? `<span class="dot busy" style="display:inline-block;margin-right:6px"></span>${esc(running[0].label)} · ${esc(running[0].last.slice(0, 100))}`
    : jobs[0] ? `${esc(jobs[0].label)} · ${jobs[0].status}` : '';
  $('#job-list').innerHTML = jobs.map(j => `
    <div class="job ${j.id === S.activeJob ? 'active' : ''}" data-id="${j.id}">
      <div class="jl"><span class="dot ${j.status === 'running' ? (j.service ? 'on' : 'busy') : ''}" style="${j.status === 'failed' ? 'background:var(--bad)' : j.status === 'done' ? 'background:var(--good)' : ''}"></span>
        <span>${esc(j.label)}</span></div>
      <div class="jt">${j.status} · ${ago(j.started)}</div>
    </div>`).join('') || '<div class="dim" style="padding:14px">No jobs yet</div>';
  $$('.job').forEach(el => el.onclick = () => openJob(el.dataset.id));
}

function openJob(id) {
  S.activeJob = id;
  document.body.classList.add('drawer-open');
  $('#drawer').classList.remove('collapsed');
  $('#drawer-toggle').textContent = '▼';
  S.es?.close();
  const log = $('#job-log');
  log.innerHTML = '';
  const job = S.data?.jobs.find(j => j.id === id);
  $('#followup').hidden = true;
  S.es = new EventSource(`/api/jobs/${id}/stream`);
  S.es.onmessage = e => {
    const entry = JSON.parse(e.data);
    const atBottom = log.scrollHeight - log.scrollTop - log.clientHeight < 40;
    const div = document.createElement('div');
    div.className = `l-${entry.kind}`;
    div.textContent = entry.text;
    log.appendChild(div);
    if (atBottom) log.scrollTop = log.scrollHeight;
  };
  S.es.addEventListener('end', async () => {
    S.es.close();
    await refresh();
    const j = S.data.jobs.find(x => x.id === id);
    $('#followup').hidden = !(j?.claude && j.sessionId);
  });
  if (job?.claude && job.status !== 'running' && job.sessionId) $('#followup').hidden = false;
  renderJobs();
}
$('#followup').onsubmit = async e => {
  e.preventDefault();
  const msg = e.target.message.value.trim();
  if (!msg || !S.activeJob) return;
  try {
    const {job} = await api(`/api/jobs/${S.activeJob}/followup`, {method: 'POST', body: {message: msg}});
    e.target.message.value = '';
    openJob(job);
  } catch (err) { toast(err.message, true); }
};
$('#drawer-head').onclick = e => {
  if (e.target.closest('#followup')) return;
  const collapsed = $('#drawer').classList.toggle('collapsed');
  document.body.classList.toggle('drawer-open', !collapsed);
  $('#drawer-toggle').textContent = collapsed ? '▲' : '▼';
};

// ── boot ─────────────────────────────────────────────────────────────────────
await refresh();
await loadRoute();
