import {makeProject} from '@motion-canvas/core';
import '@fontsource/inter/400.css';
import '@fontsource/jetbrains-mono/400.css';

// Every src/scenes/sceneNN.tsx is picked up automatically, in file-name order.
const found = import.meta.glob<{default: any}>('./scenes/scene*.tsx', {eager: true, query: '?scene'});
const scenes = Object.keys(found).sort().map(k => found[k].default);

// The voiceover is optional so the project opens before you generate audio.
// `npm run voice <video>` writes audio/voiceover.wav and it's picked up automatically.
const audioFiles = import.meta.glob('../audio/voiceover.wav', {eager: true, import: 'default'});
const audio = Object.values(audioFiles)[0] as string | undefined;

export default makeProject({scenes, audio});
