import {makeScene2D, Rect} from '@motion-canvas/2d';
import {all} from '@motion-canvas/core';
import {setup} from '../lib/sync';
import {box, fadeIn, mono, sans} from '../lib/ui';
import {C, T} from '../lib/theme';

export default makeScene2D(function* (view) {
  const s = setup(view, 'scene01', 'THE PROBLEM');
  const table = box({y: -170, w: 420, h: 110, title: 'accounts', sub: '20,000,000 rows'});
  const barBg = (<Rect y={60} width={700} height={56} radius={6} stroke={C.stroke} lineWidth={2} opacity={0} />) as Rect;
  const bar = (<Rect y={60} x={-350} offsetX={-1} width={0} height={52} radius={5} fill={C.accent} />) as Rect;
  const size = mono('10 GB', {y: 140, size: 34});
  const q = sans('what is Postgres doing?', {y: 300, size: 44});
  s.stage.add(<>{table.node}{barBg}{bar}{size}{q}</>);

  // "Want to ruin your afternoon? Delete half of a ten gigabyte table."
  yield* s.at('table');
  yield* fadeIn(table.node);
  yield* table.sub.text('10,000,000 rows', T.base);
  // "Then check the disk."
  yield* s.at('disk');
  yield* all(barBg.opacity(1, T.fast), bar.width(696, T.slow), fadeIn(size));
  // "Still ten gigabytes."
  yield* s.at('still');
  yield* all(bar.fill(C.bad, T.base), size.fill(C.bad, T.base));
  // "So what is Postgres actually doing…"
  yield* s.at('why');
  yield* fadeIn(q);
  yield* s.end();
});

