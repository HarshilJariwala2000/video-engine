#!/usr/bin/env node
// Opens the Motion Canvas editor for one video.
//
//   npm run edit 001-docker        → http://localhost:9000
//   npm run edit 002 -- --port 9001
import {spawn} from 'node:child_process';
import path from 'node:path';
import {ROOT, resolveVideo} from './lib/video.mjs';

const args = process.argv.slice(2);
const {slug} = resolveVideo(args);
const port = args.includes('--port') ? args[args.indexOf('--port') + 1] : process.env.EDITOR_PORT ?? '9000';

console.log(`▶ Motion Canvas editor for ${slug} → http://localhost:${port}`);
const child = spawn(process.execPath, [path.join(ROOT, 'node_modules/vite/bin/vite.js'), '--strictPort'], {
  cwd: ROOT,
  stdio: 'inherit',
  env: {...process.env, VIDEO: slug, EDITOR_PORT: port},
});
child.on('exit', code => process.exit(code ?? 0));
