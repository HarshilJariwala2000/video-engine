#!/usr/bin/env node
// Starts the local voice server (tts/server.py) in its uv-managed venv.
//
//   npm run tts            → http://127.0.0.1:7861  (first start downloads the model)
import {spawn} from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import {ROOT, loadEnv} from './lib/video.mjs';

loadEnv();
const dir = path.join(ROOT, 'tts');
const py = path.join(dir, '.venv', process.platform === 'win32' ? 'Scripts/python.exe' : 'bin/python');
if (!fs.existsSync(py)) {
  console.error('\n✖ tts/.venv missing. Install once with:\n\n    cd tts && uv sync\n');
  process.exit(1);
}
const port = new URL(process.env.TTS_URL || 'http://127.0.0.1:7861').port || '7861';
const child = spawn(py, [path.join(dir, 'server.py'), '--port', port], {cwd: dir, stdio: 'inherit'});
child.on('exit', code => process.exit(code ?? 0));
