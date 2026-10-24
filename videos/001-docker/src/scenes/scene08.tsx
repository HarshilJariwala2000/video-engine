import {makeScene2D} from '@motion-canvas/2d';
import {all, sequence} from '@motion-canvas/core';
import {setup} from '../lib/sync';
import {draw, fadeIn, termCard} from '../lib/ui';
import {checklist} from '../lib/checklist';
import {processWorld} from '../lib/figures';
import {C, T} from '../lib/theme';

export default makeScene2D(function* (view) {
  const s = setup(view, 'scene08', 'ATTEMPT 2: THE TRICK', {fadeLabel: false});
  const w = processWorld(false);
  const card = termCard('PID = process ID');
  s.stage.add([w.group, card]);
  view.add(checklist().node);

  // "Here's what a normal process sees today."
  yield* s.at('normal');
  yield* fadeIn(w.p.node);

  // "Every other program on the machine,"
  yield* s.at('others');
  yield* all(draw(w.aL), sequence(0.08, ...w.rows.map(r => fadeIn(r.node))));

  // "each one with an ID number the kernel gave it."
  yield* s.at('ids');
  yield* sequence(0.08, ...w.rows.map(r => r.pidTxt.fill(C.accent, T.fast)));

  // "That number is called a PID, short for process ID."
  yield* s.at('pid');
  yield* fadeIn(card);

  // "It also sees every file on the disk,"
  yield* s.at('files');
  yield* all(draw(w.aF), fadeIn(w.files));

  // "and every network connection."
  yield* s.at('net');
  yield* all(draw(w.aN), fadeIn(w.net));

  yield* s.end([card]);
});
