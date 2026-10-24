#!/usr/bin/env node
// Creates a new video folder from templates/video.
//
//   npm run new redis -- --title "Redis will finally make sense after this video"
//        --topic "Redis" --aha "..." --pain "..." --format "will finally make sense" --notes "..."
//
// → videos/002-redis/  (number = next free)
import {createVideo} from './lib/video.mjs';

const args = process.argv.slice(2);
const opt = k => (args.includes(`--${k}`) ? args[args.indexOf(`--${k}`) + 1] : '');
const name = args.find((a, i) => !a.startsWith('--') && !args[i - 1]?.startsWith('--'));
if (!name) {
  console.error('✖ Usage: npm run new <short-name> -- --title "..." [--topic --aha --pain --format --notes]');
  process.exit(1);
}
const {slug} = createVideo({
  name, title: opt('title'), topic: opt('topic'), aha: opt('aha'),
  pain: opt('pain'), format: opt('format'), notes: opt('notes'),
});
console.log(`✔ Created videos/${slug}`);
