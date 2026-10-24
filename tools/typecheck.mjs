#!/usr/bin/env node
// Type-checks the shared library and every video (or one: npm run typecheck 002-redis).
import {spawnSync} from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import {ROOT, listVideos} from './lib/video.mjs';

const only = process.argv.slice(2).find(a => !a.startsWith('-'));
const videos = listVideos().filter(v => !only || v.startsWith(only))
  .filter(v => fs.existsSync(path.join(ROOT, 'videos', v, 'src/project.ts')));
const tsconfig = path.join(ROOT, 'node_modules/.cache/tsconfig.typecheck.json');
fs.mkdirSync(path.dirname(tsconfig), {recursive: true});
fs.writeFileSync(tsconfig, JSON.stringify({
  extends: '../../tsconfig.json',
  include: ['../../shared/motion', ...videos.map(v => `../../videos/${v}/src`), ...(only ? [] : ['../../showcase/_demo/src'])],
}));
const r = spawnSync(process.execPath, [path.join(ROOT, 'node_modules/typescript/bin/tsc'), '--noEmit', '-p', tsconfig], {stdio: 'inherit'});
if (!r.status) console.log(`✔ types OK: shared + ${videos.join(', ') || '(no videos with code yet)'}`);
process.exit(r.status ?? 1);
