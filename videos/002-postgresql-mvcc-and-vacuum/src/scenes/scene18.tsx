import {Circle, Line, Node, Rect, Txt, makeScene2D} from '@motion-canvas/2d';
import {all, createSignal, linear} from '@motion-canvas/core';
import {setup} from '../lib/sync';
import {box, checkMark, fadeIn, fadeTo, mono, swap} from '../lib/ui';
import {checklist} from '../lib/checklist';
import {fmt, rowCard, ticket} from '../lib/figures';
import {C, MONO, T, W} from '../lib/theme';

const CX = -420, CY = 20, R = 210;
const MARK = -115; // old alice's CREATED BY 7, just behind "now" (degrees, 0 = right, -90 = up)
const rad = (d: number) => (d * Math.PI) / 180;

export default makeScene2D(function* (view) {
  const s = setup(view, 'scene18', 'WRAPAROUND');
  const t42 = ticket('#42', {y: -270, accent: true});
  t42.node.scale(1.3);
  const n = createSignal(42);
  const counter = (
    <Txt text={() => fmt(n())} fontFamily={MONO} fontSize={72} fill={C.text} y={-140} opacity={0} />
  ) as Txt;
  const bits = mono('32-bit ticket number', {y: -60, size: 24, fill: C.dim});
  const wrapped = mono('wraps back to the start', {y: -60, size: 24, fill: C.accent});

  // the ticket clock: wedges and hand rotate together as "now" moves on
  const rot = createSignal(0);
  const past = (<Circle size={R * 2 - 16} startAngle={90} endAngle={270} closed fill={C.stroke} opacity={0} />) as Circle;
  const future = (<Circle size={R * 2 - 16} startAngle={-90} endAngle={90} closed fill={C.accent} opacity={0} />) as Circle;
  const hand = (<Line points={[[0, 0], [0, -R + 10]]} stroke={C.accent} lineWidth={5} lineCap="round" opacity={0} />) as Line;
  const rel = (<Node x={CX} y={CY} rotation={() => rot()}>{past}{future}{hand}</Node>) as Node;
  const face = (<Circle x={CX} y={CY} size={R * 2} stroke={C.text} lineWidth={3} end={0} />) as Circle;
  const ticks = (
    <Node x={CX} y={CY} opacity={0}>
      {Array.from({length: 12}, (_, i) => {
        const a = rad(i * 30);
        return <Line points={[[Math.cos(a) * (R - 14), Math.sin(a) * (R - 14)], [Math.cos(a) * R, Math.sin(a) * R]]} stroke={C.dim} lineWidth={W.fine} />;
      })}
    </Node>
  ) as Node;
  const nowLbl = (
    <Txt text="now" fontFamily={MONO} fontSize={22} fill={C.accent} opacity={0}
         x={() => CX + Math.sin(rad(rot())) * (R + 34)} y={() => CY - Math.cos(rad(rot())) * (R + 34)} />
  ) as Txt;
  const pastLbl = mono('past', {x: CX - 105, y: CY, size: 24, fill: C.label});
  const futureLbl = mono('future', {x: CX + 105, y: CY, size: 24, fill: C.text});
  const crossed = () => rot() >= 155 && rot() < 300;
  const marker = (
    <Node opacity={0}>
      <Circle x={CX + Math.cos(rad(MARK)) * R} y={CY + Math.sin(rad(MARK)) * R} size={18}
              fill={() => (crossed() ? C.bad : C.label)} />
      <Txt text="7" fontFamily={MONO} fontSize={24} fill={() => (crossed() ? C.bad : C.label)}
           x={CX + Math.cos(rad(MARK)) * (R + 30)} y={CY + Math.sin(rad(MARK)) * (R + 30)} />
    </Node>
  ) as Node;

  const alice = rowCard({name: 'alice', bal: 100, y: -60, wide: true, created: '7', deleted: '—'});
  alice.node.x(430);
  const ok = checkMark({x: 190, y: 20});
  const okLbl = mono('visible to everyone', {x: 215, y: 20, size: 22, fill: C.good, align: 'left'});
  const err = (
    <Rect y={300} width={1340} height={64} radius={4} stroke={C.bad} lineWidth={W.line} opacity={0}>
      {mono('ERROR: database is not accepting commands that assign new transaction IDs…', {size: 22, fill: C.bad, opacity: 1})}
    </Rect>
  ) as Rect;
  const sentry = box({x: 430, y: 120, w: 600, h: 54, title: 'Sentry · July 2015 · down most of a day', size: 20});
  const shield = (
    <Node x={250} y={205} opacity={0}>
      <Line points={[[0, -30], [24, -20], [22, 8], [0, 30], [-22, 8], [-24, -20]]} closed stroke={C.accent} lineWidth={3} />
      {mono('stop > lie', {x: 50, size: 28, fill: C.accent, align: 'left', opacity: 1})}
    </Node>
  ) as Node;
  s.stage.add([t42.node, counter, bits, wrapped, rel, face, ticks, nowLbl, pastLbl, futureLbl, marker,
    alice.node, ok, okLbl, err, sentry.node, shield]);
  view.add(checklist({state: ['ok', 'ok', 'ok', 'ok']}).node);

  // "Vacuum has one more job, and it's the scary one."
  yield* s.at('one');
  yield* fadeIn(t42.node);

  // "Those deli tickets are a 32-bit number."
  yield* s.at('limit');
  yield* fadeIn(counter, bits);
  yield* n(4_294_967_295, 2.0);

  // "After about 4 billion, they wrap back around to the start."
  yield* s.at('four');
  yield* all(counter.opacity(0, 0.15), bits.opacity(0, 0.15));
  n(3);
  counter.fill(C.accent);
  yield* all(counter.opacity(1, T.fast), fadeIn(wrapped));

  // "So Postgres reads them like a clock."
  yield* s.at('clock');
  yield* fadeTo(0, t42.node, counter, wrapped);
  yield* all(face.end(1, T.slow), ticks.opacity(1, T.slow), hand.opacity(1, T.slow), nowLbl.opacity(1, T.slow));

  // "2 billion behind now is the past."
  yield* s.at('past');
  yield* all(past.opacity(0.9, T.base), fadeIn(pastLbl));

  // "2 billion ahead is the future."
  yield* s.at('future');
  yield* all(future.opacity(0.28, T.base), fadeIn(futureLbl));

  // "Leave a row alone long enough, and its created-by ticket drifts into the future,"
  yield* s.at('old');
  yield* all(fadeIn(alice.node, marker), fadeTo(0, pastLbl, futureLbl));
  yield* all(rot(205, 3.4, linear), alice.cf.node.stroke(C.accent, T.base));

  // "and a row from the future is invisible. Your data would just vanish."
  yield* s.at('vanish');
  yield* all(alice.node.opacity(0.25, T.slow), alice.rect.stroke(C.bad, T.slow));

  // "So vacuum freezes old rows:"
  yield* s.at('freeze');
  yield* all(rot(0, T.slow), alice.node.opacity(1, T.base), alice.rect.stroke(C.stroke, T.base), marker.opacity(0, T.base));
  yield* swap(alice.cf.value, 'FROZEN', C.accent);

  // "it stamps them as visible to everyone, forever."
  yield* s.at('forever');
  yield* all(ok.end(1, T.base), fadeIn(okLbl), rot(360, 2.6, linear));
  rot(0);

  // "And if vacuum falls too far behind, Postgres stops accepting writes, rather than let your data disappear."
  yield* s.at('stop');
  yield* fadeIn(err);

  // "This isn't hypothetical. In 2015, Sentry was down for most of a working day because of exactly this."
  yield* s.at('protect');
  yield* fadeIn(sentry.node);

  // "But I'd still rather my database stop than lie to me."
  yield* s.at('protect', 8.4);
  yield* fadeIn(shield);

  yield* s.end();
});
