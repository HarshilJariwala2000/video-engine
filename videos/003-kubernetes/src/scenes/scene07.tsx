import {Line, makeScene2D} from '@motion-canvas/2d';
import {all} from '@motion-canvas/core';
import {setup} from '../lib/sync';
import {draw, fadeIn, fadeTo, mono, sans, swap} from '../lib/ui';
import {checklist} from '../lib/checklist';
import {chip, loopArrow, you} from '../lib/figures';
import {crashState, dial} from '../lib/extra-a';
import {C, DIM, FS, T, W} from '../lib/theme';

export default makeScene2D(function* (view) {
  const s = setup(view, 'scene07', 'THE BETTER QUESTION');
  // scene 06's last frame: the dimmed servers with server-1's restart policy
  const sv = crashState();
  const {s1, s2, s3} = sv;
  s1.web.stroke(C.good);
  [s1.frame, s1.web, s2.frame, s3.frame, s3.web].forEach(n => n.opacity(DIM));
  const policy = chip('restart: always', {x: s1.x, y: 40, color: C.accent, opacity: DIM});
  const tie = (<Line points={[[s1.x, 64], [s1.x, s1.y - 52]]} stroke={C.dim} lineWidth={W.line} opacity={DIM} />) as Line;
  const loop1 = loopArrow({x: s1.x, y: s1.y + 55, r: 20, color: C.good});
  loop1.end(1);
  loop1.opacity(DIM);
  const old = [sv.group, policy.node, tie, loop1];

  const q1 = sans('how do I start 3 copies?', {y: -250, size: 44, fill: C.dim});
  const once = mono('once', {y: -190, size: 30, fill: C.dim});
  const q2 = sans('how do I make sure there are always 3?', {y: -100, size: 48, fill: C.accent});
  const always = mono('always', {y: -36, size: 30, fill: C.accent});
  const me = you({x: 640, y: 140});
  const meLoop = loopArrow({x: 640, y: 130, r: 90});

  const d = dial({y: 120});
  const wantH = mono('WANT', {x: -480, y: 60, size: FS.label, fill: C.dim});
  const want = mono('21°', {x: -480, y: 130, size: 72, fill: C.text});
  const haveH = mono('HAVE', {x: 480, y: 60, size: FS.label, fill: C.dim});
  const have = mono('19°', {x: 480, y: 130, size: 72, fill: C.text});
  const diff = (<Line points={[[-480, 200], [-480, 290], [480, 290], [480, 200]]} stroke={C.accent}
                      lineWidth={W.line} endArrow arrowSize={12} radius={12} end={0} opacity={0} />) as Line;
  const act = mono('ACT: heat on', {y: 330, size: 32, fill: C.accent});
  const back = (<Line points={[[480, 20], [480, -40], [-480, -40], [-480, 20]]} stroke={C.dim}
                      lineWidth={W.line} endArrow arrowSize={12} radius={12} end={0} opacity={0} />) as Line;
  const forever = mono('not once. forever.', {y: -80, size: FS.label, fill: C.dim});

  s.stage.add([...old, q1, once, q2, always, meLoop, me.node, d.node, wantH, want, haveH, have, diff, act, back, forever]);
  const cl = checklist({state: ['fail', 'fail', 'fail', 'fail']});
  view.add(cl.node);

  // "Okay. Let's look under the abstraction, and ask a better question."
  yield* s.at('reset');
  yield* all(cl.clear(), fadeTo(0, ...old));

  // "The script answers: how do I start three copies?"
  yield* s.at('old');
  yield* fadeIn(q1);

  // "The better question is: how do I make sure there are always three?"
  yield* s.at('new');
  yield* fadeIn(q2);

  // "Starting happens once."
  yield* s.at('once');
  yield* fadeIn(once);

  // "Always means someone keeps checking. At the start of this video, that someone was you."
  yield* s.at('always');
  yield* fadeIn(always);
  yield* all(fadeIn(me.node), meLoop.end(1, T.slow));
  yield* meLoop.rotation(360, 1.2);
  yield* fadeTo(DIM, me.node, meLoop);

  // "We need a thermostat."
  yield* s.at('thermo');
  yield* all(fadeTo(0, q1, once, q2, always, me.node, meLoop), fadeIn(d.node));

  // "You set what you want: 21 degrees."
  yield* s.at('want');
  yield* all(fadeIn(wantH, want), d.needle.rotation(10, T.slow));

  // "It measures what you have: 19."
  yield* s.at('have');
  yield* fadeIn(haveH, have);

  // "And it acts on the difference. Not once. Forever."
  yield* s.at('act');
  yield* all(draw(diff, T.slow), fadeIn(act));
  yield* all(swap(have, '21°', C.good), draw(back, T.slow), fadeIn(forever));

  // the dial carries into scene 08
  yield* s.end([wantH, want, haveH, have, diff, act, back, forever]);
});
