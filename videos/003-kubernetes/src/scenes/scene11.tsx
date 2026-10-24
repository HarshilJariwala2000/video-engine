import {makeScene2D} from '@motion-canvas/2d';
import {all, chain, sequence, waitFor} from '@motion-canvas/core';
import {setup} from '../lib/sync';
import {crossMark, draw, drawCross, fadeIn, fadeTo, mono, swap, termCard, wall} from '../lib/ui';
import {checklist} from '../lib/checklist';
import {CLUSTER, CTRL_X, CTRL_Y, STAMP_POS, chip, controller, entryPos, fillNode, notebook, servers, spin, stamp} from '../lib/figures';
import {LANE, ctrlLink} from '../lib/extra-b';
import {C, DIM, FS, T} from '../lib/theme';

export default makeScene2D(function* (view) {
  const s = setup(view, 'scene11', 'THE SCHEDULER');
  // state left by scene 10: notebook with deployment + three blank pods, replica controller
  const nb = notebook({visible: true});
  nb.deploy.node.opacity(1);
  const pods = nb.pods.slice(0, 3);
  pods.forEach(p => p.node.opacity(1));
  const sv = servers({frames: true});
  const rc = controller('replica controller', {x: CTRL_X.replica, y: CTRL_Y});
  rc.node.opacity(1);
  const rcLink = ctrlLink(CTRL_X.replica, LANE.replica, true);

  const card = termCard('node = a machine that runs pods');
  // the exact cluster outline from scene 04
  const cluster = wall({x: CLUSTER.x, y: CLUSTER.y, w: CLUSTER.w, h: CLUSTER.h, tag: 'cluster'});
  cluster.node.end(0);
  cluster.node.opacity(1);
  cluster.tag.opacity(0);
  const rack = chip('rack server', {x: -560, y: 20});
  const cloud = chip('cloud VM', {x: -220, y: 20, color: C.accent, stroke: C.accent});
  const sc = controller('scheduler', {x: CTRL_X.scheduler, y: CTRL_Y});
  const scLink = ctrlLink(CTRL_X.scheduler, LANE.scheduler);
  const st = stamp({x: STAMP_POS[0], y: STAMP_POS[1], w: 200});
  const asks = chip('asks: 2 GB', {x: 270, y: entryPos(1)[1], color: C.text});
  const FREE = ['5 GB', '2.5 GB', '4 GB'];
  sv.list.forEach((v, i) => v.barTxt.text(FREE[i]));
  const job = chip('entire job: 1 field', {x: -200, y: -15, color: C.accent, stroke: C.accent});
  const notStart = chip('start', {x: -300, y: 48, color: C.dim});
  const notCopy = chip('copy', {x: -100, y: 48, color: C.dim});
  const xs = [notStart, notCopy].map(c => crossMark({x: c.node.x(), y: c.node.y(), s: 1.3}));
  const ifRoom = mono('if room', {x: 790, y: entryPos(4)[1] - 10, size: FS.small, fill: C.dim});
  const cl = checklist();

  s.stage.add([cluster.node, sv.group, nb.group, rcLink, rc.node, scLink, sc.node, st.node, card, rack.node, cloud.node,
    asks.node, job.node, notStart.node, notCopy.node, ...xs.map(x => x.node), ifRoom]);
  view.add(cl.node);

  // "Each new pod has an empty field,"
  yield* s.at('empty');
  yield* all(fadeTo(DIM, rc.node, rcLink, nb.deploy.node),
    ...pods.map(p => all(p.field.fill(C.accent, T.base), p.node.stroke(C.accent, T.base))));

  // "called node. A node is Kubernetes' word for one machine in the cluster that can run pods."
  yield* s.at('field');
  yield* fadeIn(card);
  yield* all(cluster.node.end(1, T.slow), cluster.tag.opacity(1, T.slow),
    ...pods.map(p => all(p.field.fill(C.dim, T.base), p.node.stroke(C.stroke, T.base))));

  // "A physical server in a rack, or far more often a virtual one you rent from a cloud."
  yield* s.at('kinds');
  yield* fadeIn(rack.node);
  yield* waitFor(0.6);
  yield* fadeIn(cloud.node);
  // "Our three servers are three nodes."
  yield* s.at('kinds', 5.4);
  yield* all(...sv.list.map((v, i) => swap(v.tag, `node-${i + 1}`)));

  // "The next thermostat, the scheduler, watches for pods with that field blank."
  yield* s.at('sched');
  yield* all(fadeTo(0, rack.node, cloud.node, card), cluster.node.opacity(DIM, T.base), cluster.tag.opacity(0, T.base));
  yield* fadeIn(sc.node);
  yield* all(draw(scLink), spin(sc.glyph));
  yield* fadeIn(st.node);
  yield* st.set('want', 'node set');
  yield* st.set('have', 'blank');

  // "It checks how much room each server has left against how much the pod asks for,"
  yield* s.at('looks');
  yield* sequence(0.15, ...sv.list.map(v => v.bar.opacity(1, T.base)));
  yield* all(fadeIn(asks.node), pods[0].node.stroke(C.accent, T.base));

  // "picks the best fit,"
  yield* s.at('picks');
  yield* all(sv.list[1].barFill.fill(C.accent, T.fast), sv.list[1].frame.stroke(C.accent, T.fast),
    sv.list[1].barTxt.fill(C.accent, T.fast));

  // "and writes that server's name into the blank."
  yield* s.at('writes');
  yield* all(st.set('act', 'fill in'), fillNode(pods[0], 'node-2'), asks.node.opacity(0, T.base));
  yield* all(sv.list[1].frame.stroke(C.stroke, T.fast), sv.list[1].barFill.fill(C.dim, T.fast), sv.list[1].barTxt.fill(C.dim, T.fast));
  yield* fillNode(pods[1], 'node-1');
  yield* fillNode(pods[2], 'node-3');

  // "That's the scheduler's entire job."
  yield* s.at('whole');
  yield* all(st.node.opacity(0, T.fast), ...sv.list.map(v => v.bar.opacity(DIM, T.fast)));
  yield* fadeIn(job.node);

  // "It doesn't start anything."
  yield* s.at('not');
  yield* fadeIn(notStart.node, notCopy.node);
  yield* all(drawCross(xs[0]), drawCross(xs[1]));

  // "It fills in one blank."
  yield* s.at('blank');
  yield* all(fadeTo(DIM, notStart.node, notCopy.node, ...xs.map(x => x.node)), pods[0].node.stroke(C.stroke, T.fast),
    sequence(0.12, ...pods.map(p => chain(p.node.stroke(C.accent, 0.25), p.node.stroke(C.stroke, 0.4)))));

  // "As long as some server has room. Hold that thought."
  yield* s.at('room');
  yield* fadeIn(ifRoom);
  yield* all(...sv.list.map(v => all(v.bar.opacity(1, T.fast),
    chain(v.barFill.fill(C.accent, 0.25), v.barFill.fill(C.dim, 0.45)))));

  // "And nobody typed a server name by hand, least of all you."
  yield* s.at('hand');
  yield* cl.check(1);

  // hand off to scene 12: plain notebook with filled fields, dim controllers, node frames
  yield* s.before(0.9);
  yield* all(
    ...pods.map(p => p.field.fill(C.text, 0.4)), nb.deploy.node.opacity(1, 0.4),
    sc.node.opacity(DIM, 0.4), scLink.opacity(DIM, 0.4),
  );
  yield* s.end([cluster.node, card, job.node, notStart.node, notCopy.node, ...xs.map(x => x.node), ifRoom,
    ...sv.list.map(v => v.bar)]);
});
