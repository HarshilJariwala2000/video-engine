import {makeScene2D} from '@motion-canvas/2d';
import {all} from '@motion-canvas/core';
import {setup} from '../lib/sync';
import {swap} from '../lib/ui';
import {checklist} from '../lib/checklist';
import {bump, mvccPage} from '../lib/figures';
import {C, DIM, T} from '../lib/theme';

export default makeScene2D(function* (view) {
  const s = setup(view, 'scene09', 'THE STAMPS');
  // scene 08's last frame: the narrow page with three versions
  const p = mvccPage({frame: true, show: 3});
  p.oldA.node.opacity(0.6);
  const versions = [p.oldA, p.oldB, p.newA];
  s.stage.add(p.group);
  view.add(checklist().node);

  // "This is the bit I find genuinely delightful."
  yield* s.at('every');
  yield* all(p.oldA.node.opacity(1, T.base), p.oldB.node.opacity(DIM, T.base), bump(p.oldA.node, 1.05), bump(p.newA.node, 1.05));

  // "Postgres labels every row version with two hidden stamps, like a hoarder labelling every box in the garage."
  yield* s.at('two');
  yield* p.widen(T.slow);

  // "Created by: the ticket that wrote it."
  yield* s.at('created');
  yield* all(...versions.flatMap(c => [c.cf.node.stroke(C.accent, T.fast), c.cf.lbl.fill(C.accent, T.fast)]));

  // "Deleted by: the ticket that expired it."
  yield* s.at('deleted');
  yield* all(...versions.flatMap(c => [
    c.cf.node.stroke(C.stroke, T.fast), c.cf.lbl.fill(C.dim, T.fast),
    c.df.node.stroke(C.accent, T.fast), c.df.lbl.fill(C.accent, T.fast),
  ]));

  // "The old alice says: created by 7, deleted by 42."
  yield* s.at('oldalice');
  yield* all(...versions.flatMap(c => [c.df.node.stroke(C.stroke, T.fast), c.df.lbl.fill(C.dim, T.fast)]));
  yield* swap(p.oldA.cf.value, '7');
  yield* swap(p.oldA.df.value, '42', C.accent);

  // "The new alice says: created by 42, deleted by nobody, yet."
  yield* s.at('newalice');
  yield* all(swap(p.newA.cf.value, '42', C.accent), swap(p.oldB.cf.value, '7'), swap(p.oldB.df.value, '—'));
  yield* swap(p.newA.df.value, '—');

  // "Postgres calls these xmin and xmax, which might be why you've never heard of them."
  yield* s.at('names');
  p.headers.forEach(h => h.fill(C.accent));
  yield* all(...p.headers.map(h => h.opacity(1, T.base)));

  yield* s.end([]);
});
