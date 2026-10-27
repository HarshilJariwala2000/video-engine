#!/usr/bin/env node
// Generates videos/<video>/SCRIPT.md (VIDEO_BRIEF §4 scene format + tables +
// packaging) from narration/script.mjs and, if present, src/timings.json.
//
//   npm run script 002-redis
import fs from 'node:fs';
import path from 'node:path';
import {ROOT, importScript, resolveVideo} from './lib/video.mjs';

const {slug, dir} = resolveVideo();
const mod = await importScript(dir);
if (!mod) { console.error(`✖ videos/${slug}/narration/script.mjs not found`); process.exit(1); }
const {meta, scenes} = mod;
const BRAND = JSON.parse(fs.readFileSync(path.join(ROOT, 'shared/brand/brand.json'), 'utf8'));
const introOf = s => BRAND.intros[s.intro === 'default' ? BRAND.defaultIntro : s.intro];

const tf = path.join(dir, 'src/timings.json');
const timings = fs.existsSync(tf) ? JSON.parse(fs.readFileSync(tf, 'utf8')) : null;
const kind = !timings ? 'not generated' : timings.estimated ? 'estimated' : `measured from ${timings.provider ?? 'TTS'} audio`;
const clean = t => t.replace(/\{\w+\}/g, '').replace(/\s+/g, ' ').trim();
const words = t => (t ? clean(t).split(' ').length : 0);
const pad = n => String(n).padStart(2, '0');
const clock = t => `${Math.floor(t / 60)}:${pad(Math.floor(t % 60))}`;
const num = id => id.replace('scene', '');
const secs = s => timings?.scenes[s.id]?.duration ?? (s.intro ? introOf(s)?.duration ?? 7 : s.est ?? (words(s.text) / 140) * 60);
const total = scenes.reduce((a, s) => a + secs(s), 0);
const list = v => (Array.isArray(v) ? v : v ? [v] : []);

const out = [];
out.push(`# ${meta.title}`, '');
out.push(`**Aha:** ${meta.aha}  `, `**Audience:** ${meta.audience}  `);
if (meta.hook) out.push(`**Hook:** ${meta.hook}  `);
if (meta.example) out.push(`**Running example:** ${meta.example}  `);
if (meta.stance) out.push(`**Take:** ${meta.stance}  `);
if (meta.device) out.push(`**Recurring device:** ${meta.device}  `);
out.push(`**Length:** ${scenes.reduce((a, s) => a + words(s.text), 0)} words, ${clock(total)} (${kind})`, '');
out.push('> Generated from `narration/script.mjs`. Edit that file, not this one, then run `npm run script ' + slug + '`.', '', '---', '');

for (const s of scenes) {
  if (s.intro) {
    out.push(`### CHANNEL INTRO: ${introOf(s)?.title ?? s.intro} (${s.intro === 'default' ? `default = ${BRAND.defaultIntro}` : s.intro})`,
      'Shared animated intro + music (shared/motion/intros). No narration.', `EST. DURATION: ${secs(s).toFixed(1)} s`, '');
    continue;
  }
  out.push(`### SCENE ${num(s.id)}: ${s.title}`, `LABEL: ${s.label}`);
  if (s.term) out.push(`NEW TERM: ${s.term}`);
  out.push('NARRATION:', `"${clean(s.text)}"`, 'VISUAL:', ...list(s.visual).map(v => `- ${v}`));
  if (s.checklist) out.push(`CHECKLIST: ${s.checklist}`);
  if (s.handsOff) out.push(`HANDS OFF TO: ${s.handsOff}`);
  if (s.leaves) out.push(`LEAVES: ${s.leaves}`);
  out.push(`EST. DURATION: ${secs(s).toFixed(1)} s`, '');
}

out.push(`## Scene table (${kind})`, '', '| # | Label | Seconds | Words |', '|---|---|---|---|');
for (const s of scenes) out.push(`| ${s.intro ? 'intro' : num(s.id)} | ${s.intro ? 'CHANNEL INTRO' : s.label} | ${secs(s).toFixed(1)} | ${words(s.text)} |`);

if (meta.chain?.length) out.push('', '## The chain', '', ...meta.chain.map((c, i) => `${i + 1}. ${c}`));

if (meta.terms?.length || scenes.some(s => s.term)) out.push('', '## Term table', '', '| Term | Scene | Plain meaning used in narration |', '|---|---|---|');
if (meta.terms?.length) for (const t of meta.terms) out.push(`| ${t.term} | ${t.scene} | ${t.meaning} |`);
else for (const s of scenes) if (s.term) out.push(`| ${s.term.split('=')[0].trim()} | ${num(s.id)} | ${s.term.split('=').slice(1).join('=').trim()} |`);

if (meta.didntKnow?.length) {
  out.push('', '## "Didn\'t know that" moments', '', ...meta.didntKnow.map(d => `- **Scene ${d.scene}:** ${d.text}`));
}
out.push('', '## [VERIFY] before publishing', '', ...list(meta.verify).map(v => `- [ ] ${v}`), '');
out.push('## Packaging', '', '**Titles**', '', ...list(meta.titles).map((t, i) => `${i + 1}. ${t}`), '');
out.push('**Thumbnail text** (pair #1 with title #1)', '', ...list(meta.thumbnails).map((t, i) => `${i + 1}. ${t}`), '');
if (meta.thumbnailLayout) out.push(`**Thumbnail layout:** ${meta.thumbnailLayout}`, '');
if (meta.description) out.push('**Description**', '', meta.description, '');
const chap = path.join(dir, 'audio/chapters.txt');
if (fs.existsSync(chap)) out.push(`**Chapters** (${kind})`, '', '```', fs.readFileSync(chap, 'utf8').trim(), '```', '');
if (meta.tags?.length) out.push(`**Tags:** ${meta.tags.join(', ')}`, '');

fs.writeFileSync(path.join(dir, 'SCRIPT.md'), out.join('\n'));
console.log(`Wrote ${path.relative(ROOT, path.join(dir, 'SCRIPT.md')).split(path.sep).join('/')}`);
