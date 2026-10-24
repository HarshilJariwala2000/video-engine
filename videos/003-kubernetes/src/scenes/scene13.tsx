import {Line, makeScene2D} from '@motion-canvas/2d';
import {all, chain, sequence} from '@motion-canvas/core';
import {setup} from '../lib/sync';
import {crossMark, drawCross, fadeIn, fadeTo, sans} from '../lib/ui';
import {checklist} from '../lib/checklist';
import {chip, hub, spin} from '../lib/figures';
import {baton} from '../lib/extra-b';
import {C, T, W} from '../lib/theme';

export default makeScene2D(function* (view) {
  const s = setup(view, 'scene13', 'THE NOTEBOOK');
  const h = hub();
  const comps = [h.replica, h.scheduler, ...h.kubelets];

  // the direct calls that never happen
  const dashed = (pts: [number, number][]) =>
    (<Line points={pts} stroke={C.dim} lineWidth={W.line} lineDash={[12, 8]} end={0} />) as Line;
  const schedToKubelet = dashed([[560, -192], [500, 242]]);
  const replicaToSched = dashed([[-390, -230], [390, -230]]);
  const x1 = crossMark({x: 530, y: 25, s: 1.4});
  const x2 = crossMark({x: 0, y: -230, s: 1.4});

  const paper = chip('Borg, Omega, and Kubernetes · ACM Queue · 2016', {y: -370});
  const quote = sans('choreography, not orchestration', {y: -300, size: 36, fill: C.accent});
  const stick = baton({x: 330, y: 30});
  const noBaton = crossMark({x: 330, y: 30, s: 2});
  const resumed = chip('picks up where it was', {x: 640, y: -140, color: C.accent, stroke: C.accent});

  s.stage.add([schedToKubelet, replicaToSched, h.group, x1.node, x2.node, paper.node, quote, stick, noBaton.node, resumed.node]);
  view.add(checklist({state: ['ok', 'ok', '', '']}).node);

  // "Now notice who talked to whom."
  yield* s.at('notice');
  yield* fadeIn(h.api);
  yield* sequence(0.12, ...comps.map(c => c.node.opacity(1, T.base)));

  // "The scheduler never called a kube-let."
  yield* s.at('sched');
  yield* all(schedToKubelet.end(1, T.base), fadeTo(0.3, h.replica.node, h.kubelets[0].node, h.kubelets[1].node));
  yield* drawCross(x1);

  // "The replica controller never called the scheduler."
  yield* s.at('repl');
  yield* all(replicaToSched.end(1, T.base), h.replica.node.opacity(1, T.base), fadeTo(0.3, h.kubelets[2].node));
  yield* drawCross(x2);

  // "Nobody calls anybody."
  yield* s.at('nobody');
  yield* all(fadeTo(0, schedToKubelet, replicaToSched, x1.node, x2.node), ...comps.map(c => c.node.opacity(1, T.base)));

  // "They only read and write the notebook, and react to what changes."
  yield* s.at('all');
  h.spokes.forEach(l => { l.end(0); l.opacity(1); });
  yield* sequence(0.1, ...h.spokes.map(l => l.end(1, T.base)));
  yield* all(...h.spokes.map(l => chain(l.stroke(C.accent, 0.3), l.stroke(C.dim, 0.6))),
    ...comps.map(c => spin(c.glyph)));

  // "That's deliberate. In 2016, the Google engineers behind Borg ... wrote a paper about it."
  yield* s.at('story');
  yield* fadeIn(paper.node);

  // "They called the design choreography, not orchestration."
  yield* s.at('chor');
  yield* fadeIn(quote);

  // "No conductor shouting cues."
  yield* s.at('conductor');
  yield* fadeIn(stick);
  yield* drawCross(noBaton);

  // "Just dancers, all watching the same floor."
  yield* s.at('dancers');
  yield* fadeTo(0, stick, noBaton.node);
  yield* all(
    sequence(0.12, ...comps.map(c => chain(c.box.stroke(C.accent, 0.25), c.box.stroke(C.stroke, 0.45)))),
    ...h.spokes.map(l => chain(l.stroke(C.accent, 0.3), l.stroke(C.dim, 0.8))),
  );

  // "Kill any one of them, restart it,"
  yield* s.at('kill');
  yield* all(h.scheduler.node.opacity(0.08, T.fast), h.spokes[1].opacity(0, T.fast));
  yield* s.at('kill', 1.3);
  yield* h.scheduler.node.opacity(1, T.base);

  // "and it reads the notebook and carries on."
  yield* s.at('resume');
  h.spokes[1].end(0);
  h.spokes[1].opacity(1);
  h.spokes[1].stroke(C.accent);
  yield* all(h.spokes[1].end(1, T.base), spin(h.scheduler.glyph));
  yield* fadeIn(resumed.node);

  // scene 14 starts from the bare hub
  yield* s.before(0.9);
  yield* h.spokes[1].stroke(C.dim, 0.4);
  yield* s.end([paper.node, quote, resumed.node]);
});
