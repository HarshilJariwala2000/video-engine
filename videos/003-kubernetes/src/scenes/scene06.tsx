import {Line, makeScene2D} from '@motion-canvas/2d';
import {all, chain} from '@motion-canvas/core';
import {setup} from '../lib/sync';
import {fadeIn, fadeTo, mono} from '../lib/ui';
import {checklist} from '../lib/checklist';
import {chip, flash, loopArrow} from '../lib/figures';
import {crashState} from '../lib/extra-a';
import {C, DIM, FS, T, W} from '../lib/theme';

export default makeScene2D(function* (view) {
  const s = setup(view, 'scene06', 'ATTEMPT 1: A SCRIPT', {fadeLabel: false});
  const sv = crashState();
  const {s1, s2, s3} = sv;
  const policy = chip('restart: always', {x: s1.x, y: 40, color: C.accent});
  const tie = (<Line points={[[s1.x, 64], [s1.x, s1.y - 52]]} stroke={C.dim} lineWidth={W.line} end={0} />) as Line;
  const loop1 = loopArrow({x: s1.x, y: s1.y + 55, r: 20, color: C.good});
  const policy2 = chip('restart: always', {x: s2.x, y: 40, color: C.dim});
  const loop2 = loopArrow({x: s2.x, y: s2.y + 55, r: 20, color: C.dim});

  // timeline: one tick at the start, then nothing
  const TL = {x0: -700, x1: 700, y: -170};
  const track = (<Line points={[[TL.x0, TL.y], [TL.x1, TL.y]]} stroke={C.stroke} lineWidth={W.line} end={0} />) as Line;
  const tick = (<Line points={[[TL.x0, TL.y - 26], [TL.x0, TL.y + 26]]} stroke={C.accent} lineWidth={W.main} opacity={0} />) as Line;
  const started = mono('started', {x: TL.x0, y: TL.y + 56, size: FS.label, fill: C.accent});
  const rest = (<Line points={[[TL.x0, TL.y], [TL.x1, TL.y]]} stroke={C.dim} lineWidth={W.line} lineDash={[12, 10]} opacity={0} />) as Line;
  const nobody = mono('nobody watching', {x: 120, y: TL.y - 50, size: FS.label, fill: C.dim});

  s.stage.add([sv.group, tie, policy.node, loop1, policy2.node, loop2, track, tick, started, rest, nobody]);
  view.add(checklist({state: ['fail', 'fail', 'fail', 'fail']}).node);

  // "You might be thinking: just add a restart policy."
  yield* s.at('think');
  yield* all(fadeIn(policy.node), tie.end(1, T.base), fadeTo(DIM, s2.frame, s3.frame, s3.web));

  // "Sure. Docker will restart a crashed container,"
  yield* s.at('restart');
  yield* all(s1.web.stroke(C.bad, T.fast), s1.webTitle.fill(C.bad, T.fast));
  yield* all(s1.web.stroke(C.good, T.base), s1.webTitle.fill(C.text, T.base), loop1.end(1, T.base));

  // "on the same machine."
  yield* s.at('same');
  yield* all(flash(s1.frame), loop1.rotation(360, T.slow));

  // "But at 3 a.m., the machine is the thing that died, and its restart policy died with it."
  yield* s.at('machine');
  yield* all(fadeTo(DIM, s1.frame, s1.web, policy.node, tie, loop1), s2.frame.opacity(1, T.base),
    fadeIn(policy2.node), loop2.end(1, T.base));
  yield* chain(s2.frame.stroke(C.text, 0.15), s2.frame.stroke(C.bad, 0.4));
  yield* all(fadeTo(0, policy2.node, loop2), s2.frame.opacity(DIM, T.slow));

  // "Both fixes act once,"
  yield* s.at('once');
  yield* all(track.end(1, T.base), fadeIn(tick, started));

  // "and then nothing is watching."
  yield* s.at('after');
  yield* all(track.opacity(0, T.base), fadeIn(rest, nobody));

  // keep the dimmed servers for scene 07's reset
  yield* s.end([track, tick, started, rest, nobody]);
});
