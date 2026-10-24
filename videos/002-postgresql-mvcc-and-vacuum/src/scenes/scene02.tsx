import {Line, Node, Polygon, Rect, makeScene2D} from '@motion-canvas/2d';
import {all, chain, sequence} from '@motion-canvas/core';
import {setup} from '../lib/sync';
import {fadeIn, fadeTo, mono, sans, swap} from '../lib/ui';
import {accounts, DEAD, termOut} from '../lib/figures';
import {C, DIM, FS, T, W} from '../lib/theme';

export default makeScene2D(function* (view) {
  const s = setup(view, 'scene02', 'THE PROBLEM', {fadeLabel: false});
  // exactly where scene 01 left it
  const a = accounts({visible: true, rows: 10_000_000, state: i => (DEAD.includes(i) ? 'ghost' : 'live')});
  a.disk.node.opacity(1);
  a.disk.value.fill(C.bad);
  const term = termOut({visible: true});
  term.cmd.text('DELETE FROM accounts WHERE closed;');
  term.out.text('DELETE 10000000');

  const never = sans('Postgres has never updated a row', {y: -190, size: 56, fill: C.accent});
  const hoarder = sans('a hoarder.', {y: -80, size: 64});
  const boxes = (
    <Node x={-260} y={-80} opacity={0}>
      {[0, 1, 2].map(i => (
        <Rect y={24 - i * 26} width={i === 2 ? 52 : 64} height={22} radius={2} stroke={C.label} lineWidth={W.line}>
          <Line points={[[-10, 0], [10, 0]]} stroke={C.dim} lineWidth={W.fine} />
        </Rect>
      ))}
    </Node>
  ) as Node;
  const right = mono('the right call?', {y: 70, size: 28, fill: C.label});
  const beam = (
    <Node y={170} rotation={-5} opacity={0}>
      <Line points={[[-300, 0], [300, 0]]} stroke={C.text} lineWidth={3} />
      {mono('readers never wait', {x: -300, y: 30, size: 22, fill: C.good, opacity: 1})}
      {mono('disk space', {x: 300, y: 30, size: FS.small, fill: C.dim, opacity: 1})}
    </Node>
  ) as Node;
  const fulcrum = (<Polygon sides={3} size={56} y={196} stroke={C.text} lineWidth={3} opacity={0} />) as Polygon;
  s.stage.add([a.group, a.disk.node, term.node, term.out, never, hoarder, boxes, right, beam, fulcrum]);

  // "The rows are gone from every query."
  yield* s.at('gone');
  yield* all(swap(term.cmd, 'SELECT count(*) FROM accounts;'), swap(term.out, '10000000'));
  yield* sequence(0.03, ...DEAD.map(i => chain(a.cells[i].rect.stroke(C.label, 0.2), a.cells[i].rect.stroke(C.stroke, 0.4))));

  // "But their space is still taken."
  yield* s.at('space');
  yield* all(a.disk.showHatch('taken'), a.disk.value.fill(C.text, T.base));

  // "Now try something even more innocent."
  yield* s.at('stranger');
  yield* fadeTo(DIM, ...a.table);

  // "Change one column in every row,"
  yield* s.at('update');
  yield* all(swap(term.cmd, "UPDATE accounts SET plan = 'pro';"), swap(term.out, 'UPDATE 10000000'));

  // "and the table can almost double in size."
  yield* s.at('double');
  yield* all(a.disk.gb(19, T.slow), a.disk.fill.fill(C.bad, T.slow), a.disk.value.fill(C.bad, T.slow));

  // "My favourite fact about Postgres: it has never updated a row in its life."
  yield* s.at('never');
  yield* fadeTo(0, ...a.table, a.disk.node, term.node, term.out);
  yield* fadeIn(never);

  // "Postgres is a hoarder. A very organised hoarder."
  yield* s.at('promise');
  yield* all(fadeIn(hoarder), boxes.opacity(1, T.base));

  // "...and why I think hoarding was the right call."
  yield* s.at('why');
  yield* all(fadeIn(right, beam, fulcrum));

  yield* s.end();
});
