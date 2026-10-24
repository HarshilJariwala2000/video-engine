import {makeScene2D} from '@motion-canvas/2d';
import {all} from '@motion-canvas/core';
import {setup} from '../lib/sync';
import {arrow, box, draw, fadeIn, frame, swap, termCard} from '../lib/ui';
import {checklist} from '../lib/checklist';
import {vmFigure} from '../lib/figures';
import {C, T} from '../lib/theme';

export default makeScene2D(function* (view) {
  const s = setup(view, 'scene05', 'ATTEMPT 1: VIRTUAL MACHINES', {fadeLabel: false});
  const vm = vmFigure({visible: true});
  vm.vms.forEach(m => m.outline.stroke(C.accent));
  const os = frame({y: 40, w: 1000, h: 440, tag: 'operating system (VM 1)'});
  const kernel = box({y: 40, w: 260, h: 90, title: 'KERNEL', size: 28, stroke: C.accent});
  const card = termCard("kernel = the computer's manager");
  const prog = box({x: -300, y: -100, w: 260, h: 90, title: 'my-app', sub: '', size: 24});
  prog.sub.fill(C.accent);
  const mem = box({x: 300, y: -100, w: 220, h: 70, title: 'MEMORY', size: 22});
  const files = box({y: 205, w: 220, h: 60, title: 'FILES', size: 22});
  const aP = arrow([[-110, -5], [-200, -55]]);
  const aM = arrow([[110, -5], [190, -55]]);
  const aF = arrow([[0, 85], [0, 172]]);
  s.stage.add([vm.group, os.node, kernel.node, card, prog.node, mem.node, files.node, aP, aM, aF]);
  view.add(checklist().node);

  // "...so let's zoom in."  (VM 1's OS box sits at (-420, 40); scale 3 about it)
  yield* s.at('zoom');
  yield* all(
    vm.group.scale(3, T.slow), vm.group.position([1260, -80], T.slow), vm.group.opacity(0, T.slow),
    os.node.opacity(1, T.slow),
  );

  // "At the center of every operating system is a program called the kernel."
  yield* s.at('kernel');
  yield* fadeIn(kernel.node);

  // "Think of it as the computer's manager."
  yield* s.at('manager');
  yield* fadeIn(card);

  // "It starts every program," / "hands out memory," / "and decides who can touch which files."
  yield* s.at('starts');
  yield* all(draw(aP), fadeIn(prog.node));
  yield* s.at('memory');
  yield* all(draw(aM), fadeIn(mem.node));
  yield* s.at('files');
  yield* all(draw(aF), fadeIn(files.node));

  // "And a program that's running has a name too: a process."
  yield* s.at('process');
  yield* all(swap(prog.sub, 'running = process', C.accent), prog.node.stroke(C.accent, T.base));

  yield* s.end();
});
