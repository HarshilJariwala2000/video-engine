import {Rect, makeScene2D} from '@motion-canvas/2d';
import {all, sequence} from '@motion-canvas/core';
import {setup} from '../lib/sync';
import {box, fadeIn, fadeTo, frame, mono, sans} from '../lib/ui';
import {C, T} from '../lib/theme';

export default makeScene2D(function* (view) {
  const s = setup(view, 'scene02', 'THE PROBLEM', {fadeLabel: false});
  const ctr = box({y: -40, w: 460, h: 260, dashed: true, stroke: C.accent});
  const name = mono('CONTAINER', {y: -140, size: 28, fill: C.text});
  const tree = mono('/\n├─ bin\n└─ app', {x: -170, y: -10, size: 22, align: 'left'});
  const plug = box({x: 110, y: -10, w: 150, h: 50, title: 'network', size: 18});
  const fast = sans('starts in ~1 s', {y: 150, size: 36, fill: C.accent});
  const laptop = frame({y: 0, w: 960, h: 440, tag: 'laptop'});
  const grid = Array.from({length: 24}, (_, i) => (
    <Rect x={-325 + (i % 6) * 130} y={-120 + Math.floor(i / 6) * 80} width={110} height={60}
          stroke={C.accent} lineWidth={2} radius={4} lineDash={[8, 6]} opacity={0} />
  ) as Rect);
  const q = mono('?', {y: 0, size: 160, fill: C.accent});
  s.stage.add([ctr.node, name, tree, plug.node, fast, laptop.node, ...grid, q]);

  // "Docker calls that package a container."
  yield* s.at('named');
  yield* fadeIn(ctr.node, name);

  // "A container acts like its own little computer, with its own files and its own network."
  yield* s.at('files');
  yield* fadeIn(tree);
  yield* s.at('net');
  yield* fadeIn(plug.node);

  // "Yet it starts in about a second,"
  yield* s.at('fast');
  yield* fadeIn(fast);

  // "and your laptop can run dozens of them."
  yield* s.at('dozens');
  yield* fadeTo(0, ctr.node, name, tree, plug.node, fast);
  yield* all(fadeIn(laptop.node), sequence(0.025, ...grid.map(g => g.opacity(1, 0.25))));

  // "How can something act like a whole computer and cost almost nothing?"
  yield* s.at('how');
  yield* all(fadeTo(0.25, ...grid), q.opacity(1, T.base));

  yield* s.end();
});
