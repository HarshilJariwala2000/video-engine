import {makeScene2D} from '@motion-canvas/2d';
import {all, sequence} from '@motion-canvas/core';
import {setup} from '../lib/sync';
import {box, fadeIn, fadeTo, mono, swap, termCard} from '../lib/ui';
import {checklist} from '../lib/checklist';
import {LAYER_NAMES, layerStack} from '../lib/figures';
import {C, T} from '../lib/theme';

export default makeScene2D(function* (view) {
  const s = setup(view, 'scene18', 'LAYERS');
  const layers = layerStack(LAYER_NAMES, {x: 0, y: 250, w: 520, visible: true});
  const ys = layers.map(l => l.node.y());
  const ro = ys.map(y => mono('read-only', {x: 285, y, size: 18, fill: C.dim, align: 'left'}));
  const rw = box({y: 10, w: 520, h: 46, title: "container's own layer", size: 20, dashed: true, stroke: C.accent});
  const file = box({x: 180, y: ys[3], w: 150, h: 32, title: 'config.json', size: 16, opacity: 1});
  const copy = box({x: 180, y: ys[3], w: 150, h: 32, title: 'config.json', size: 16, stroke: C.accent});
  const card = termCard('copy-on-write');
  const rw1 = box({x: -340, y: 10, w: 300, h: 46, title: 'container 1', size: 20, dashed: true, stroke: C.accent});
  const rw3 = box({x: 340, y: 10, w: 300, h: 46, title: 'container 3', size: 20, dashed: true, stroke: C.accent});
  const fresh = box({y: 10, w: 300, h: 46, title: 'container 2 (fresh)', size: 20, dashed: true, stroke: C.good});
  const shared = mono('one shared image', {y: 300, size: 22, fill: C.dim});
  s.stage.add([...layers.map(l => l.node), ...ro, rw.node, file.node, copy.node, card, rw1.node, rw3.node, fresh.node, shared]);
  view.add(checklist({state: ['ok', 'ok', 'ok', 'ok']}).node);

  // "Image layers are read-only. They never change."
  yield* s.at('ro');
  yield* sequence(0.1, ...ro.map(r => fadeIn(r)));

  // "When a container runs, Docker adds one thin layer on top..."
  yield* s.at('thin');
  yield* fadeIn(rw.node);

  // "Any file the app changes is copied up into that top layer first."
  yield* s.at('copy');
  yield* copy.node.opacity(1, T.fast);
  yield* copy.node.position([180, 10], T.slow);
  yield* all(copy.node.width(220, T.fast), swap(copy.title, 'config.json edited', C.accent));

  // "This trick is called copy-on-write."
  yield* s.at('cow');
  yield* fadeIn(card);

  // "It's why ten containers can share one image,"
  yield* s.at('share');
  yield* fadeTo(0, copy.node, file.node, ...ro);
  yield* all(...layers.map(l => l.node.width(980, T.slow)), rw.node.width(300, T.slow), swap(rw.title, 'container 2'));
  yield* fadeIn(rw1.node, rw3.node, shared);

  // "and why a fresh container always starts perfectly clean."
  yield* s.at('clean');
  yield* rw.node.opacity(0, T.base);
  yield* fadeIn(fresh.node);

  yield* s.end();
});
