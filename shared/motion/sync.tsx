// Audio-driven scene timing, shared by every video. Each video binds it to its
// own generated timings in `src/lib/sync.tsx`:
//
//   import timings from '../timings.json';
//   export const setup = createSetup(timings);
import {Node, Txt, View2D} from '@motion-canvas/2d';
import {all, spawn, useLogger, useThread, waitFor, ThreadGenerator} from '@motion-canvas/core';
import {C, MONO, SANS, T} from './theme';

export interface Caption {start: number; end: number; text: string}
export interface SceneTiming {duration: number; offset: number; cues: Record<string, number>; captions: Caption[]}
export interface Timings {fps: number; estimated: boolean; scenes: Record<string, SceneTiming>}

/** Wait until an absolute time (seconds since the start of this scene). */
export function* waitUntilTime(t: number): ThreadGenerator {
  const now = useThread().time();
  if (t > now + 1e-6) yield* waitFor(t - now);
}

export function createSetup(timingsJson: unknown) {
  const timings = timingsJson as Timings;

  /**
   * Standard scene setup: background, section label, burned-in captions, and a
   * `stage` node that holds the scene's content. Returns cue helpers:
   *
   *   yield* s.at('cueName')   → waits until that word is spoken (from timings.json)
   *   yield* s.end()           → fades the stage out in the tail silence and pads
   *                              the scene to EXACTLY its audio length
   */
  return function setup(view: View2D, id: string, label: string, opts: {fadeLabel?: boolean} = {}) {
    view.fill(C.bg);
    const timing = timings.scenes[id];
    if (!timing) throw new Error(`No timings for ${id}. Run "npm run voice" (or "npm run voice:estimate") for this video.`);

    const stage = (<Node />) as Node;
    const labelTxt = (
      <Txt text={label} fontFamily={MONO} fontSize={28} fill={C.label} letterSpacing={2}
           x={-880} y={-460} offsetX={-1} opacity={opts.fadeLabel === false ? 1 : 0} />
    ) as Txt;
    const caption = (
      <Txt text="" fontFamily={SANS} fontSize={34} fill={C.text} y={462} opacity={0} />
    ) as Txt;
    view.add(stage);
    view.add(labelTxt);
    view.add(caption);

    if (opts.fadeLabel !== false) spawn(labelTxt.opacity(1, T.base));
    spawn(runCaptions(caption, timing.captions));

    const cue = (name: string) => {
      const t = timing.cues[name];
      if (t === undefined) throw new Error(`${id}: unknown cue "{${name}}". Check narration/script.mjs`);
      return t;
    };

    function* at(name: string, offset = 0): ThreadGenerator {
      yield* waitUntilTime(cue(name) + offset);
    }

    /** Wait until `sec` seconds before the end of the scene (for exit moves). */
    function* before(sec: number): ThreadGenerator {
      yield* waitUntilTime(timing.duration - sec);
    }

    /** @param fade nodes to fade out at the end ('all' = whole stage, [] = cut). */
    function* end(fade: Node[] | 'all' = 'all'): ThreadGenerator {
      const d = timing.duration;
      const now = useThread().time();
      if (now > d + 1 / 60) {
        const msg = `${id}: animations run ${(now - d).toFixed(2)}s past the audio. Shorten them.`;
        useLogger().warn(msg);
        console.warn(msg); // also to the browser console, where `npm run check` sees it
      }
      yield* waitUntilTime(d - 0.4);
      const nodes = fade === 'all' ? [stage] : fade;
      const len = Math.min(0.35, d - useThread().time());
      if (nodes.length && len > 1 / 60) yield* all(...nodes.map(n => n.opacity(0, len)));
      yield* waitUntilTime(d);
    }

    return {view, stage, at, before, end, cue, duration: timing.duration};
  };
}

function* runCaptions(txt: Txt, caps: Caption[]): ThreadGenerator {
  for (let i = 0; i < caps.length; i++) {
    const c = caps[i];
    yield* waitUntilTime(c.start);
    txt.text(c.text);
    txt.opacity(1);
    const next = caps[i + 1];
    const hideAt = next ? Math.min(next.start, c.end + 0.5) : c.end + 0.4;
    yield* waitUntilTime(hideAt);
    if (!next || next.start > hideAt + 0.02) txt.opacity(0);
  }
}
