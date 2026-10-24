import {Rect, makeScene2D} from '@motion-canvas/2d';
import {all} from '@motion-canvas/core';
import {setup} from '../lib/sync';
import {arrow, box, draw, fadeIn, sans, swap} from '../lib/ui';
import {checklist} from '../lib/checklist';
import {vmFigure} from '../lib/figures';
import {C, T} from '../lib/theme';

export default makeScene2D(function* (view) {
  const s = setup(view, 'scene07', 'ATTEMPT 2: THE TRICK');
  const vm = vmFigure({visible: true, kernels: true});
  vm.vms.forEach(m => { m.outline.stroke(C.accent); m.os.stroke(C.text); m.gb.opacity(1); });
  const cl = checklist({state: ['ok', 'ok', 'ok', 'fail']});
  const kernel = box({y: 200, w: 900, h: 70, title: 'KERNEL', size: 24, stroke: C.accent});
  const app = box({y: 80, w: 240, h: 80, title: 'my-app', size: 28});
  const up = arrow([[0, 163], [0, 125]], {stroke: C.accent});
  const q1 = sans('needs its own computer?', {y: -150, size: 40, fill: C.dim});
  const q2 = sans('believes it has one?', {y: -80, size: 40, fill: C.accent});
  const preview = (<Rect y={80} width={340} height={150} stroke={C.accent} lineWidth={2} radius={6} lineDash={[12, 8]} end={0} />) as Rect;
  s.stage.add([vm.group, kernel.node, app.node, up, q1, q2, preview]);
  view.add(cl.node);

  // "So let's ask a better question."
  yield* s.at('better');
  yield* all(cl.clear(), vm.group.opacity(0, T.slow));
  yield* fadeIn(kernel.node, app.node);

  // "Does our app really need its own computer?"
  yield* s.at('need');
  yield* fadeIn(q1);

  // "Or does it only need to believe it has one?"
  yield* s.at('believe');
  yield* fadeIn(q2);

  // "Remember: the kernel is the manager."
  yield* s.at('manager');
  yield* swap(kernel.title, 'KERNEL  (the manager)');

  // "It already decides what every process gets."
  yield* s.at('decides');
  yield* draw(up);

  // "So what if the kernel simply showed our app a smaller world?"
  yield* s.at('smaller');
  yield* preview.end(1, T.slow);

  yield* s.end();
});
