// The recurring story device (VIDEO_BRIEF §3.2 / §5): 3–5 requirements that the
// whole video works through. Lives outside the scene stage so it persists
// across scene cuts; each scene re-creates it in the state the last one left.
// Each video binds its own wording in `src/lib/checklist.tsx`:
//
//   export const ITEMS = ['own files', "can't see others", ...];
//   export const checklist = createChecklist(ITEMS, 'our app needs:');
import {Line, Node, Rect, Txt} from '@motion-canvas/2d';
import {all, chain, sequence, ThreadGenerator} from '@motion-canvas/core';
import {C, FS, MONO, T, W} from './theme';

export type Mark = '' | 'ok' | 'fail';
const CORNER = {pos: [600, -430] as [number, number], scale: 1};
const CENTER = {pos: [-250, -170] as [number, number], scale: 1.8};
const GAP = 32;

export function createChecklist(items: string[], heading = 'our app needs:') {
  return function checklist(o: {state?: Mark[]; place?: 'corner' | 'center'; visible?: boolean} = {}) {
    const state = o.state ?? items.map((): Mark => '');
    const place = o.place === 'center' ? CENTER : CORNER;
    const vis = o.visible === false ? 0 : 1;

    const title = (<Txt text={heading} fontFamily={MONO} fontSize={FS.tiny} fill={C.dim} x={-10} y={-34} offsetX={-1} opacity={vis} />) as Txt;
    const rows = items.map((text, i) => {
      const y = i * GAP;
      const sq = (<Rect y={y} width={20} height={20} radius={3} lineWidth={W.line}
                        stroke={state[i] === 'ok' ? C.good : state[i] === 'fail' ? C.bad : C.dim} />) as Rect;
      const ok = (<Line y={y} points={[[-6, 0], [-1, 5], [7, -6]]} stroke={C.good} lineWidth={3}
                        lineCap="round" lineJoin="round" end={state[i] === 'ok' ? 1 : 0} />) as Line;
      const xa = (<Line y={y} points={[[-5, -5], [5, 5]]} stroke={C.bad} lineWidth={3} lineCap="round" end={state[i] === 'fail' ? 1 : 0} />) as Line;
      const xb = (<Line y={y} points={[[5, -5], [-5, 5]]} stroke={C.bad} lineWidth={3} lineCap="round" end={state[i] === 'fail' ? 1 : 0} />) as Line;
      const label = (<Txt text={text} fontFamily={MONO} fontSize={18} x={22} y={y} offsetX={-1}
                          fill={state[i] === 'ok' ? C.text : C.label} />) as Txt;
      const row = (<Node opacity={vis}>{sq}{ok}{xa}{xb}{label}</Node>) as Node;
      return {row, sq, ok, xa, xb, label};
    });
    const node = (<Node position={place.pos} scale={place.scale}>{title}{rows.map(r => r.row)}</Node>) as Node;

    function* check(i: number): ThreadGenerator {
      const r = rows[i];
      yield* all(r.xa.end(0, 0.15), r.xb.end(0, 0.15));
      yield* all(r.ok.end(1, 0.4), r.sq.stroke(C.good, T.fast), r.label.fill(C.text, T.fast));
    }
    function* fail(i: number): ThreadGenerator {
      const r = rows[i];
      yield* all(sequence(0.1, r.xa.end(1, 0.25), r.xb.end(1, 0.25)), r.sq.stroke(C.bad, T.fast));
    }
    function* clear(): ThreadGenerator {
      yield* all(...rows.flatMap(r => [r.ok.end(0, T.fast), r.xa.end(0, T.fast), r.xb.end(0, T.fast),
        r.sq.stroke(C.dim, T.fast), r.label.fill(C.label, T.fast)]));
    }
    function* pulse(i: number): ThreadGenerator {
      const r = rows[i];
      const back = r.label.fill();
      yield* all(
        chain(r.sq.scale(1.5, 0.2), r.sq.scale(1, 0.3)),
        chain(r.label.fill(C.accent, 0.2), r.label.fill(back, 0.6)),
      );
    }
    function* reveal(i: number): ThreadGenerator {
      yield* rows[i].row.opacity(1, T.base);
    }
    function* toCorner(d = T.slow): ThreadGenerator {
      yield* all(node.position(CORNER.pos, d), node.scale(CORNER.scale, d));
    }
    return {node, title, rows, check, fail, clear, pulse, reveal, toCorner};
  };
}
