import {Circle, makeScene2D} from '@motion-canvas/2d';
import {all, sequence} from '@motion-canvas/core';
import {setup} from '../lib/sync';
import {box, fadeIn, fadeTo, mono, termCard} from '../lib/ui';
import {checklist} from '../lib/checklist';
import {controller, spin, stamp} from '../lib/figures';
import {dial} from '../lib/extra-a';
import {C, DIM, FS, T, W} from '../lib/theme';

export default makeScene2D(function* (view) {
  const s = setup(view, 'scene08', 'THE LOOP');
  // scene 07's last frame: the thermostat dial
  const d = dial({y: 120, opacity: 1});
  d.needle.rotation(10);

  const XS = [-640, -320, 0, 320, 640];
  const ctrls = XS.map(x => controller('controller', {x, y: 120, w: 280, size: FS.small}));
  const card = termCard('controller = a thermostat', {x: 0});

  // the loop around the centre controller: READ (top) → COMPARE (right) → FIX (left)
  const CY = 60, R = 220;
  const ring = (<Circle y={CY} size={R * 2} stroke={C.stroke} lineWidth={W.line} end={0} />) as Circle;
  const at = (deg: number): [number, number] => [R * Math.cos(deg * Math.PI / 180), CY + R * Math.sin(deg * Math.PI / 180)];
  // filled with the background so the ring stops at each box instead of running through its label
  const steps = ([['READ', -90], ['COMPARE', 30], ['FIX', 150]] as [string, number][]).map(([t, a]) => {
    const b = box({x: at(a)[0], y: at(a)[1], w: 190, h: 60, title: t, size: 26, color: C.dim});
    b.node.fill(C.bg);
    return b;
  });
  // an accent arc that runs around the ring and stops at each step (arc end = -40° + rotation)
  const runner = (<Circle y={CY} size={R * 2} startAngle={-100} endAngle={-40} stroke={C.accent}
                          lineWidth={W.main} endArrow arrowSize={14} opacity={0} />) as Circle;
  const toStep = (a: number) => a + 40; // rotation that puts the arc's head on angle a

  const st = stamp({x: 620, y: 60});
  const never = mono('never done', {y: CY + R + 50, size: FS.label, fill: C.dim});
  s.stage.add([d.node, ring, runner, ...steps.map(x => x.node), ...ctrls.map(c => c.node), card, st.node, never]);
  view.add(checklist().node);
  const centre = ctrls[2];

  function* light(i: number) {
    yield* all(
      runner.rotation(i === 0 ? toStep(-90) : toStep([-90, 30, 150][i]), T.base),
      ...steps.map((x, j) => all(x.node.stroke(j === i ? C.accent : C.stroke, T.fast), x.title.fill(j === i ? C.accent : C.dim, T.fast))),
    );
  }

  // "Kubernetes is built out of thermostats."
  yield* s.at('built');
  yield* all(d.node.scale(0.4, T.base), d.node.opacity(0, T.base),
    sequence(0.1, ...ctrls.map(c => c.node.opacity(1, T.fast))));

  // "Each one is a small program called a controller, running three steps in a loop."
  yield* s.at('name');
  yield* all(fadeIn(card), fadeTo(0, ...ctrls.filter(c => c !== centre).map(c => c.node)),
    centre.node.position([0, CY], T.slow), centre.box.stroke(C.accent, T.slow));
  yield* all(ring.end(1, T.slow), sequence(0.1, ...steps.map(x => x.node.opacity(1, T.fast))));

  // "Read what you want."
  yield* s.at('read');
  runner.rotation(toStep(-90) - 120);
  yield* runner.opacity(1, 0.1);
  yield* light(0);

  // "Compare it with what you have."
  yield* s.at('compare');
  yield* light(1);

  // "Fix the difference."
  yield* s.at('fix');
  yield* light(2);

  // "Then again. And again."
  yield* s.at('again');
  yield* all(spin(centre.glyph, 2, 2), runner.rotation(toStep(-90) + 720, 2),
    ...steps.map(x => all(x.node.stroke(C.stroke, T.fast), x.title.fill(C.dim, T.fast))));

  // "Want three, have two? Act: plus one."
  yield* s.at('stamp');
  yield* fadeIn(st.node);
  yield* sequence(0.5, st.set('want', '3'), st.set('have', '2'), st.set('act', '+1'));

  // "A controller never finishes, and it never trusts that things stayed fixed."
  yield* s.at('stubborn');
  yield* all(fadeIn(never), fadeTo(DIM, card), runner.rotation(runner.rotation() + 360, 3.5), spin(centre.glyph, 1, 3.5));

  yield* s.end();
});
