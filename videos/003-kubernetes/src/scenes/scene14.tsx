import {Line, makeScene2D} from '@motion-canvas/2d';
import {all, chain, sequence} from '@motion-canvas/core';
import {setup} from '../lib/sync';
import {arrow, box, draw, fadeIn, fadeTo, frame, mono, termCard, wall} from '../lib/ui';
import {checklist} from '../lib/checklist';
import {chip, hub, spin} from '../lib/figures';
import {C, DIM, FS, T, W} from '../lib/theme';

export default makeScene2D(function* (view) {
  const s = setup(view, 'scene14', 'THE CONTROL PLANE');
  // state left by scene 13: the full hub
  const h = hub({visible: true});
  const comps = [h.replica, h.scheduler, ...h.kubelets];

  const TOP = -150, NODE_Y = 255, NX = [-500, 0, 500];
  const divider = (<Line points={[[-780, 40], [780, 40]]} stroke={C.stroke} lineWidth={W.line} lineDash={[12, 8]} end={0} />) as Line;
  const office = frame({y: TOP, w: 1500, h: 200, tag: 'control plane'});
  office.node.stroke(C.accent);
  office.tag.fill(C.accent);
  office.node.end(0);
  office.node.opacity(1);
  office.tag.opacity(0);
  const card = termCard('control plane = the office');
  const paperwork = chip('paperwork only', {y: -5, color: C.dim});
  const what = chip('what', {x: -285, y: TOP, color: C.accent, stroke: C.accent});
  const where = chip('where', {x: 285, y: TOP, color: C.accent, stroke: C.accent});

  const nodeFrames = NX.map((x, i) => frame({x, y: NODE_Y, w: 380, h: 220, tag: `node-${i + 1}`}));
  const webs = NX.map(x => box({x, y: NODE_Y - 55, w: 200, h: 56, title: 'web', size: 26}));
  const floor = frame({y: NODE_Y - 5, w: 1520, h: 310, tag: 'nodes'});
  const cluster = wall({y: 60, w: 1620, h: 720, tag: 'cluster'});
  cluster.node.end(0);
  cluster.node.opacity(1);
  cluster.tag.opacity(0);
  const provider = chip('run by your provider', {x: 520, y: -5, color: C.accent, stroke: C.accent, dashed: true});
  const notices = arrow([[0, -50], [0, NODE_Y - 116]], {stroke: C.accent});
  notices.lineDash([12, 8]);
  const noticesTxt = mono('notices', {x: 24, y: 70, size: FS.small, fill: C.accent, align: 'left'});

  s.stage.add([cluster.node, divider, office.node, floor.node, ...nodeFrames.map(f => f.node), ...webs.map(w => w.node),
    h.group, card, paperwork.node, what.node, where.node, provider.node, notices, noticesTxt]);
  view.add(checklist({state: ['ok', 'ok', '', '']}).node);

  // "So where do all these thermostats actually live?"
  yield* s.at('where');
  yield* all(...comps.map(c => spin(c.glyph)));

  // "Look at the hub again, because it splits cleanly in two."
  yield* s.at('split');
  yield* all(fadeTo(0, ...h.spokes), draw(divider, T.slow));
  yield* all(
    h.api.position([0, TOP], T.slow), h.api.size([360, 130], T.slow),
    h.replica.node.position([-560, TOP], T.slow), h.scheduler.node.position([560, TOP], T.slow),
    ...h.kubelets.map((k, i) => k.node.position([NX[i], NODE_Y + 50], T.slow)),
  );

  // "The notebook, the replica controller and the scheduler never run your app. They only do paperwork."
  yield* s.at('office');
  yield* all(office.node.end(1, T.slow), office.tag.opacity(1, T.slow), fadeTo(DIM, ...h.kubelets.map(k => k.node)));
  yield* fadeIn(card);
  // "...and calls that group the control plane."
  yield* s.at('office', 4.5);
  yield* fadeIn(paperwork.node);

  // "I think of it as the office. It decides what should exist and where."
  yield* s.at('think');
  yield* chain(office.node.lineWidth(W.main + 2, 0.25), office.node.lineWidth(W.main, 0.35));
  yield* sequence(0.6, fadeIn(what.node), fadeIn(where.node));

  // "The nodes are the workshop floor: each one has its kube-let, and that's where your containers actually run."
  yield* s.at('floor');
  yield* all(fadeTo(DIM, office.node, h.api, h.replica.node, h.scheduler.node, what.node, where.node, paperwork.node),
    ...h.kubelets.map(k => k.node.opacity(1, T.base)));
  yield* sequence(0.12, ...nodeFrames.map(f => f.node.opacity(1, T.base)));
  yield* fadeIn(floor.node);
  yield* all(...h.kubelets.map(k => chain(k.box.stroke(C.accent, 0.25), k.box.stroke(C.stroke, 0.45))));
  yield* sequence(0.12, ...webs.map(w => all(w.node.opacity(1, T.base), w.node.stroke(C.accent, T.base))));

  // "Office plus floor. That's the whole cluster."
  yield* s.at('cluster');
  yield* all(card.opacity(0, T.fast), fadeTo(1, office.node, h.api, h.replica.node, h.scheduler.node),
    ...webs.map(w => w.node.stroke(C.stroke, T.base)));
  yield* all(cluster.node.end(1, T.slow), cluster.tag.opacity(1, T.slow));

  // "And on a managed cloud cluster, you often never see the office at all."
  yield* s.at('cloud');
  yield* all(fadeTo(DIM, office.node, h.api, h.replica.node, h.scheduler.node, what.node, where.node),
    paperwork.node.opacity(0, T.base));
  yield* fadeIn(provider.node);

  // "Which is why, when a node goes quiet, the floor can't fix itself. The office has to notice."
  yield* s.at('quiet');
  yield* fadeTo(0.45, nodeFrames[1].node, webs[1].node, h.kubelets[1].node);
  yield* all(draw(notices), fadeIn(noticesTxt));

  yield* s.end();
});
