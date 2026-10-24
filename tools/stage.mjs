#!/usr/bin/env node
// Moves a video to a workflow stage and logs why (used by the Claude skills and the Studio).
//
//   node tools/stage.mjs 002-redis review "Script v1 written"
//   node tools/stage.mjs 002-redis --show
import {logEvent, readVideo, resolveVideo} from './lib/video.mjs';

const STAGES = ['script', 'review', 'voice', 'code', 'thumbnails', 'publish', 'done'];

const args = process.argv.slice(2);
const {slug, dir} = resolveVideo(args);
if (args.includes('--show')) {
  const v = readVideo(dir);
  console.log(`${slug}: stage=${v.stage}  scriptVersion=${v.scriptVersion ?? 0}`);
  process.exit(0);
}
// drop the argument that named the video (full slug or a prefix like "002")
const positional = args.filter(a => !a.startsWith('--'));
const rest = positional[0] && slug.startsWith(positional[0]) ? positional.slice(1) : positional;
const [stage, ...msg] = rest;
if (!STAGES.includes(stage)) {
  console.error(`✖ stage must be one of: ${STAGES.join(', ')}`);
  process.exit(1);
}
logEvent(dir, msg.join(' ') || `→ ${stage}`, {stage});
console.log(`✔ ${slug} → ${stage}`);
