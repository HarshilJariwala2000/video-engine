import {Node, makeScene2D} from '@motion-canvas/2d';
import {all} from '@motion-canvas/core';
import {setup} from '../lib/sync';
import {fadeIn, mono, swap, wall} from '../lib/ui';
import {checklist} from '../lib/checklist';
import {processWorld} from '../lib/figures';
import {C, DIM, T} from '../lib/theme';

export default makeScene2D(function* (view) {
  const s = setup(view, 'scene10', 'NAMESPACES', {fadeLabel: false});
  const w = processWorld(true);
  [w.net, w.aL, w.aF, w.aN, ...w.rows.map(r => r.node)].forEach(n => n.opacity(0));
  w.files.opacity(DIM);
  w.p.sub.text('PID 1').fill(C.accent);
  const ns = wall({w: 420, h: 220, tag: 'pid', drawn: true});
  // a copy of "app1" sitting exactly on the host tree line, which will slide into the wall
  const mover = mono('app1', {x: 420 + 6 * 13.2, y: -240 + 5 * 34, size: 22, fill: C.accent, align: 'left'});
  const inner = (
    <Node opacity={0}>
      {['├─ bin', '├─ etc', '└─ app'].map((t, i) => mono(t, {x: -20, y: -81 + i * 34, size: 24, align: 'left', opacity: 1}))}
    </Node>
  ) as Node;
  const ls = mono('$ ls /', {x: -20, y: 50, size: 22, fill: C.dim, align: 'left'});
  const out = mono('bin  etc  app', {x: -20, y: 88, size: 22, fill: C.accent, align: 'left'});
  s.stage.add([w.group, ns.node, mover, inner, ls, out]);
  view.add(checklist().node);

  // "The same blinders work for files."
  yield* s.at('same');
  yield* all(swap(ns.tag, 'pid  mnt'), w.files.opacity(1, T.base));

  // "Point the app at one ordinary folder on the server,"
  yield* s.at('point');
  yield* all(w.treeTxts[4].fill(C.accent, T.base), w.treeTxts[5].fill(C.accent, T.base));

  // "and that folder becomes its whole world."
  yield* s.at('world');
  yield* all(ns.node.x(-150, T.slow), ns.node.size([760, 320], T.slow), w.p.node.x(-350, T.slow));
  mover.opacity(1);
  yield* all(mover.position([-20, -115], T.slow), w.treeTxts[5].opacity(DIM, T.slow));
  yield* swap(mover, '/');

  // "When the app looks at the top of its file system,"
  yield* s.at('top');
  yield* fadeIn(ls);

  // "all it finds is what's inside that folder."
  yield* s.at('inside');
  yield* fadeIn(inner, out);

  // "Everything else on the disk is invisible."
  yield* s.at('invisible');
  yield* w.files.opacity(0, T.slow);

  yield* s.end([inner, mover, ls, out]);
});
