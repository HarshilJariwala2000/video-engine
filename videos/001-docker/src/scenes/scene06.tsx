import {makeScene2D} from '@motion-canvas/2d';
import {all, sequence} from '@motion-canvas/core';
import {setup} from '../lib/sync';
import {fadeIn} from '../lib/ui';
import {checklist} from '../lib/checklist';
import {vmFigure} from '../lib/figures';
import {C, T} from '../lib/theme';

export default makeScene2D(function* (view) {
  const s = setup(view, 'scene06', 'ATTEMPT 1: VIRTUAL MACHINES', {fadeLabel: false});
  const vm = vmFigure({visible: true});
  vm.vms.forEach(m => m.outline.stroke(C.accent));
  vm.group.scale(3).position([1260, -80]).opacity(0); // exactly where scene05 zoomed in
  const cl = checklist();
  s.stage.add(vm.group);
  view.add(cl.node);

  // "So with virtual machines, every app gets its own operating system"
  yield* s.at('back');
  yield* all(vm.group.scale(1, T.slow), vm.group.position([0, 0], T.slow), vm.group.opacity(1, T.slow));

  // "and its own kernel."
  yield* s.at('kernels');
  yield* sequence(0.15, ...vm.vms.map(m => fadeIn(m.kernel)));

  // "That checks the first three boxes."
  yield* s.at('three');
  yield* sequence(0.25, cl.check(0), cl.check(1), cl.check(2));

  // "But three apps means three full operating systems,"
  yield* s.at('but');
  yield* all(...vm.vms.map(m => m.os.stroke(C.text, T.base)));

  // "each one booting from scratch,"
  yield* s.at('boot');
  yield* all(...vm.vms.map(m => m.bar.opacity(1, T.fast)));
  yield* sequence(0.2, ...vm.vms.map(m => m.fill.width(240, 1.4)));

  // "each one using gigabytes of memory."
  yield* s.at('gb');
  yield* sequence(0.15, ...vm.vms.map(m => fadeIn(m.gb)));

  // "Box four, cheap and quick, fails."
  yield* s.at('fail');
  yield* cl.fail(3);

  yield* s.end([...vm.vms.map(m => m.bar)]);
});
