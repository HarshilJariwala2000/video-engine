import {makeScene2D} from '@motion-canvas/2d';
import {all, chain} from '@motion-canvas/core';
import {setup} from '../lib/sync';
import {drawWall, fadeIn, fadeTo, mono, swap, termCard, wall} from '../lib/ui';
import {checklist} from '../lib/checklist';
import {processWorld} from '../lib/figures';
import {C, DIM} from '../lib/theme';

export default makeScene2D(function* (view) {
  const s = setup(view, 'scene09', 'NAMESPACES');
  const w = processWorld(true);
  w.rows.forEach(r => r.pidTxt.fill(C.accent));
  const card = termCard('namespace = blinders');
  const ns = wall({w: 420, h: 220, tag: 'pid'});
  const outside = mono('from outside: PID 48213', {y: 175, size: 24, fill: C.dim});
  s.stage.add([w.group, card, ns.node, outside]);
  view.add(checklist().node);

  // "Think of a namespace as blinders."
  yield* s.at('blinders');
  yield* fadeIn(card);

  // "Put blinders on our app,"
  yield* s.at('put');
  yield* all(drawWall(ns), fadeTo(DIM, w.files, w.net, w.aF, w.aN));

  // "and the other programs vanish."
  yield* s.at('vanish');
  yield* fadeTo(0.06, ...w.rows.map(r => r.node), w.aL);

  // "It even believes it's process number one..."
  yield* s.at('one');
  yield* swap(w.p.sub, 'PID 1', C.accent);

  // "That's a lie."
  yield* s.at('lie');
  yield* chain(w.p.sub.fill(C.bad, 0.2), w.p.sub.fill(C.accent, 0.5));

  // "From the outside, it's still process 48213."
  yield* s.at('outside');
  yield* fadeIn(outside);

  // keep wall + process + dimmed host tree for scene10
  yield* s.end([card, outside, w.net, w.aL, w.aF, w.aN, ...w.rows.map(r => r.node)]);
});
