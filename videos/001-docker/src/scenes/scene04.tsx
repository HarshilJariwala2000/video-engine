import {makeScene2D} from '@motion-canvas/2d';
import {all, sequence} from '@motion-canvas/core';
import {setup} from '../lib/sync';
import {fadeIn} from '../lib/ui';
import {checklist} from '../lib/checklist';
import {vmFigure} from '../lib/figures';
import {C, T} from '../lib/theme';

export default makeScene2D(function* (view) {
  const s = setup(view, 'scene04', 'ATTEMPT 1: VIRTUAL MACHINES');
  const vm = vmFigure();
  s.stage.add(vm.group);
  view.add(checklist().node);

  // "The obvious answer is a virtual machine."
  yield* s.at('vm');
  yield* fadeIn(vm.real.node);

  // "That's a pretend computer, made out of software, running inside your real one."
  yield* s.at('pretend');
  yield* fadeIn(vm.vms[0].outline, vm.vms[0].tag);

  // "Give every app its own pretend computer,"
  yield* s.at('each');
  yield* sequence(0.3, ...vm.vms.slice(1).map(m => fadeIn(m.outline, m.tag)));

  // "with a full operating system inside,"
  yield* s.at('os');
  yield* sequence(0.2, ...vm.vms.map(m => fadeIn(m.app, m.os)));

  // "and the apps can't get in each other's way."
  yield* s.at('apart');
  yield* all(...vm.vms.map(m => m.outline.stroke(C.accent, T.base)));

  yield* s.end([]); // scene05 zooms in from this frame
});
