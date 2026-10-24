#!/usr/bin/env node
// Runs the voice lab (tts/voicelab.py) in the TTS venv. Stop `npm run tts` first
// if VRAM is tight; the lab loads its own copy of the models.
//
//   npm run voice:test                    candidates + full bake-off, applies the best
//   npm run voice:test -- bakeoff --quick
//   npm run voice:test -- say "Hello there"
//   npm run voice:test -- apply bakeoff-20261017-120000 2
import {spawn} from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import {ROOT} from './lib/video.mjs';

const dir = path.join(ROOT, 'tts');
const py = path.join(dir, '.venv', process.platform === 'win32' ? 'Scripts/python.exe' : 'bin/python');
if (!fs.existsSync(py)) {
  console.error('\n✖ tts/.venv missing. Install once with:\n\n    cd tts && uv sync\n');
  process.exit(1);
}
const args = process.argv.slice(2);
const child = spawn(py, [path.join(dir, 'voicelab.py'), ...(args.length ? args : ['all'])], {cwd: dir, stdio: 'inherit'});
child.on('exit', code => process.exit(code ?? 0));
