import {Rect, makeScene2D} from '@motion-canvas/2d';
import {all} from '@motion-canvas/core';
import {setup} from '../lib/sync';
import {box, drawCross, crossMark, fadeIn, mono} from '../lib/ui';
import {checklist} from '../lib/checklist';
import {C, T} from '../lib/theme';

export default makeScene2D(function* (view) {
  const s = setup(view, 'scene16', 'IMAGES', {fadeLabel: false});
  const X = -300, Y = -60;
  const img = (<Rect x={X} y={Y} width={420} height={380} stroke={C.stroke} lineWidth={2} radius={4} />) as Rect;
  const imgTitle = mono('IMAGE', {x: X, y: Y - 150, size: 30, opacity: 1});
  const rows = ['linux tools', 'node 22', 'libraries', 'your code'].map((t, i) =>
    box({x: X, y: Y - 90 + i * 52, w: 340, h: 42, title: t, size: 20, opacity: 1}).node);
  const slot = box({x: X, y: Y + 140, w: 340, h: 42, title: 'kernel?', size: 20, dashed: true, stroke: C.dim, color: C.dim});
  const cross = crossMark({x: X, y: Y + 140});
  const filesLbl = mono('brings the files', {x: X, y: Y + 225, size: 22, fill: C.accent});
  const plus = mono('+', {x: 50, y: Y, size: 64, fill: C.dim});
  const server = box({x: 400, y: Y, w: 360, h: 200, title: 'SERVER', sub: 'has the kernel', size: 30});
  const kernelLbl = mono('brings the kernel', {x: 400, y: Y + 225, size: 22, fill: C.accent});

  const bar1 = (<Rect x={-560} y={250} offsetX={-1} width={0} height={18} fill={C.accent} />) as Rect;
  const lbl1 = mono('image: tens of MB', {x: -440, y: 250, size: 20, align: 'left'});
  const bar2 = (<Rect x={-560} y={310} offsetX={-1} width={0} height={18} fill={C.stroke} />) as Rect;
  const lbl2 = mono('VM disk: GBs', {x: 460, y: 310, size: 20, fill: C.dim, align: 'left'});
  s.stage.add([img, imgTitle, ...rows, slot.node, cross.node, filesLbl, plus, server.node, kernelLbl, bar1, lbl1, bar2, lbl2]);
  view.add(checklist({state: ['ok', 'ok', 'ok', 'ok']}).node);

  // "Now notice what an image does not contain:"
  yield* s.at('notice');
  yield* fadeIn(slot.node);

  // "a kernel."
  yield* s.at('kernel');
  yield* drawCross(cross);

  // "The image brings the files."
  yield* s.at('files');
  yield* fadeIn(filesLbl);

  // "The server brings the kernel."
  yield* s.at('server');
  yield* fadeIn(plus, server.node);
  yield* fadeIn(kernelLbl);

  // "That's why an image is often tens of megabytes,"
  yield* s.at('size');
  yield* all(bar1.width(90, T.slow), fadeIn(lbl1));

  // "while a virtual machine's disk is usually gigabytes."
  yield* s.at('vm');
  yield* all(bar2.width(1000, 1.2), fadeIn(lbl2));

  yield* s.end();
});
