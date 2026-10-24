import {makeScene2D} from '@motion-canvas/2d';
import {all} from '@motion-canvas/core';
import {setup} from '../lib/sync';
import {fadeIn, frame, swap} from '../lib/ui';
import {checklist} from '../lib/checklist';
import {sharedKernel} from '../lib/figures';
import {C, T} from '../lib/theme';

export default makeScene2D(function* (view) {
  const s = setup(view, 'scene14', 'ONE SHARED KERNEL', {fadeLabel: false});
  const sk = sharedKernel(0, true);
  sk.group.opacity(0);
  const vmBox = frame({y: 65, w: 850, h: 270, tag: '1 small linux VM', dashed: true});
  vmBox.node.stroke(C.dim);
  const cl = checklist({state: ['', 'ok', 'ok', 'ok']});
  s.stage.add([sk.group, vmBox.node]);
  view.add(cl.node);

  // "One catch."
  yield* s.at('catch');
  yield* sk.group.opacity(1, T.base);

  // "These blinders and budgets are Linux kernel features."
  yield* s.at('linux');
  yield* swap(sk.kernel.title, 'LINUX KERNEL');

  // "So on a Mac or Windows, Docker Desktop quietly runs one small Linux virtual machine..."
  yield* s.at('mac');
  yield* all(swap(sk.hw.title, 'MAC / WINDOWS'), sk.hw.node.stroke(C.dim, T.base));
  yield* fadeIn(vmBox.node);

  // "Just one, shared by all your containers."
  yield* s.at('one');
  yield* swap(vmBox.tag, '1 small linux VM, shared by all', C.accent);

  yield* s.end();
});
