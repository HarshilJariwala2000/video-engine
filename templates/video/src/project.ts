import {makeProject} from '@motion-canvas/core';
import '@fontsource/inter/400.css';
import '@fontsource/jetbrains-mono/400.css';
import {BRAND} from '@shared/brand';

// Scene order comes from narration/script.mjs, so the channel intro
// ({id: 'intro', intro: 'A' | 'B' | 'C' | 'default'}) lands exactly where the script puts it.
// Narrated scenes are src/scenes/<id>.tsx; intros are shared/motion/intros/intro<X>.tsx.
const script = Object.values(import.meta.glob<{scenes: {id: string; intro?: string}[]}>('../narration/script.mjs', {eager: true}))[0];
const local = import.meta.glob<{default: any}>('./scenes/scene*.tsx', {eager: true, query: '?scene'});
const intros = import.meta.glob<{default: any}>('/shared/motion/intros/intro*.tsx', {eager: true, query: '?scene'});

const scenes = (script?.scenes ?? [])
  .map(s => {
    if (s.intro) return intros[`/shared/motion/intros/intro${s.intro === 'default' ? BRAND.defaultIntro : s.intro}.tsx`]?.default;
    const mod = local[`./scenes/${s.id}.tsx`];
    if (!mod) console.warn(`[project] ${s.id} has no src/scenes/${s.id}.tsx yet; skipped`);
    return mod?.default;
  })
  .filter(Boolean);

// The voiceover is optional so the project opens before you generate audio.
// `npm run voice <video>` writes audio/voiceover.wav and it's picked up automatically.
const audioFiles = import.meta.glob('../audio/voiceover.wav', {eager: true, import: 'default'});
const audio = Object.values(audioFiles)[0] as string | undefined;

export default makeProject({scenes, audio});
