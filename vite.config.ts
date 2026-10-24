// One Motion Canvas editor per video. Start it with `npm run edit <video>`
// (e.g. `npm run edit 001-docker`), which sets VIDEO for this config.
import fs from 'node:fs';
import path from 'node:path';
import {defineConfig} from 'vite';
import motionCanvasModule from '@motion-canvas/vite-plugin';
import ffmpegModule from '@motion-canvas/ffmpeg';

// Both plugins are CommonJS; under "type": "module" the factory sits on .default.
const cjs = <T,>(m: T): T => ((m as {default?: T}).default ?? m);
const motionCanvas = cjs(motionCanvasModule);
const ffmpeg = cjs(ffmpegModule);

const video = process.env.VIDEO;
// a bare name lives in videos/; a path (e.g. showcase/demo-a) is used as-is
const dir = video?.includes('/') ? video : `videos/${video}`;
if (!video || !fs.existsSync(path.resolve(dir, 'src/project.ts'))) {
  throw new Error(`Set VIDEO to a folder in videos/ that has src/project.ts (got "${video ?? ''}"). Use "npm run edit <video>".`);
}

export default defineConfig({
  resolve: {alias: {'@shared': path.resolve('shared/motion')}},
  plugins: [
    motionCanvas({project: `./${dir}/src/project.ts`, output: `./${dir}/output`}),
    ffmpeg(),
  ],
  server: {port: Number(process.env.EDITOR_PORT ?? 9000)},
});
