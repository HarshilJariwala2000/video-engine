import {makeScene2D} from '@motion-canvas/2d';
import {all, chain, sequence} from '@motion-canvas/core';
import {setup} from '../lib/sync';
import {fadeIn, mono, sans} from '../lib/ui';
import {checklist} from '../lib/checklist';
import {sharedKernel, vmFigure} from '../lib/figures';
import {C, T} from '../lib/theme';

export default makeScene2D(function* (view) {
  const s = setup(view, 'scene13', 'ONE SHARED KERNEL');
  const vm = vmFigure({visible: true, kernels: true});
  vm.vms.forEach(m => { m.outline.stroke(C.accent); m.gb.opacity(1); });
  vm.group.scale(0.45).position([-560, 40]).opacity(0);
  const vmTitle = mono('virtual machines', {x: -560, y: -90, size: 22, fill: C.dim});
  const X = 420;
  const sk = sharedKernel(X);
  const ctTitle = mono('containers', {x: X, y: -110, size: 22, fill: C.dim});
  const noos = mono('0 extra operating systems', {x: X, y: -180, size: 24});
  const fast = sans('starts in ~1 s', {x: X, y: -250, size: 34, fill: C.accent});
  const cl = checklist({state: ['', 'ok', 'ok', '']});
  s.stage.add([vm.group, vmTitle, sk.group, ctTitle, noos, fast]);
  view.add(cl.node);

  // "Now look at what we've built."
  yield* s.at('look');
  yield* all(vm.group.opacity(0.35, T.base), fadeIn(vmTitle, ctTitle));

  // "One machine." / "One kernel."
  yield* s.at('machine');
  yield* fadeIn(sk.hw.node);
  yield* s.at('kernel');
  yield* fadeIn(sk.kernel.node);

  // "And a few ordinary processes, each with blinders and a budget."
  yield* s.at('procs');
  yield* sequence(0.3, ...sk.ctrs.map(c => all(fadeIn(c.p.node), c.w.end(1, T.base))));

  // "There's no second operating system to boot."
  yield* s.at('noos');
  yield* fadeIn(noos);

  // "...and that's why it takes about a second."
  yield* s.at('sec');
  yield* fadeIn(fast);

  // "Box four."
  yield* s.at('box');
  yield* cl.check(3);

  // "Three boxes done..."
  yield* s.at('done');
  yield* cl.pulse(0);

  // "...the kernel showing a process a smaller world."
  yield* s.at('trick');
  yield* all(...sk.ctrs.map(c => chain(c.w.lineWidth(5, 0.3), c.w.lineWidth(2, 0.5))));

  yield* s.end();
});
