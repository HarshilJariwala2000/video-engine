import {makeScene2D} from '@motion-canvas/2d';
import {all} from '@motion-canvas/core';
import {setup} from '../lib/sync';
import {fadeIn, sans} from '../lib/ui';
import {checklist} from '../lib/checklist';
import {T} from '../lib/theme';

export default makeScene2D(function* (view) {
  const s = setup(view, 'scene03', 'WHAT AN APP NEEDS');
  const cl = checklist({place: 'center', visible: false});
  const build = sans("let's build Docker ourselves", {y: -340, size: 40});
  s.stage.add(build);
  view.add(cl.node);

  // "Let's pretend we're building Docker ourselves."
  yield* s.at('build');
  yield* fadeIn(build);

  // "...our app needs four things."
  yield* s.at('four');
  yield* cl.title.opacity(1, T.base);

  // One / Two / Three / Four
  yield* s.at('one');
  yield* cl.reveal(0);
  yield* s.at('two');
  yield* cl.reveal(1);
  yield* s.at('three');
  yield* cl.reveal(2);
  yield* s.at('fourth');
  yield* cl.reveal(3);

  // panel moves to its permanent home in the top-right corner
  yield* s.before(1.0);
  yield* all(cl.toCorner(0.7), build.opacity(0, 0.4));
  yield* s.end([]);
});
