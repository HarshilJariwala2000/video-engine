import {makeScene2D} from '@motion-canvas/2d';
import {summary} from '@shared/outro';
import {setup} from '../lib/sync';
import {sans} from '../lib/ui';
import {T} from '../lib/theme';

export default makeScene2D(function* (view) {
  const s = setup(view, 'scene02', 'TO SUMMARISE');
  const head = sans('to summarise everything', {y: -330, size: 40, opacity: 0});
  const sum = summary([
    'An update writes a new version of the row.',
    'A delete only stamps the old one.',
    'Vacuum sweeps up whatever nobody can see.',
  ]);
  s.stage.add(<>{head}{sum.node}</>);

  // "To summarise everything."
  yield* s.at('sum');
  yield* head.opacity(1, T.base);
  yield* s.at('p1');
  yield* sum.reveal(0);
  yield* s.at('p2');
  yield* sum.reveal(1);
  yield* s.at('p3');
  yield* sum.reveal(2);
  // "Postgres never changes a row."
  yield* s.at('aha');
  yield* sum.aha('Postgres never changes a row.');
  yield* s.end();
});
