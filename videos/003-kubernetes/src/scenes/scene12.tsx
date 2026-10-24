import {makeScene2D} from '@motion-canvas/2d';
import {all, sequence} from '@motion-canvas/core';
import {setup} from '../lib/sync';
import {box, draw, drawWall, fadeIn, fadeTo, mono, swap, termCard, wall} from '../lib/ui';
import {checklist} from '../lib/checklist';
import {CTRL_X, CTRL_Y, STAMP_POS, controller, notebook, servers, stamp} from '../lib/figures';
import {LANE, ctrlLink, kubeletLink, running} from '../lib/extra-b';
import {C, DIM, FS, T} from '../lib/theme';

export default makeScene2D(function* (view) {
  const s = setup(view, 'scene12', 'THE KUBELET');
  // state left by scene 11: filled notebook, dim controllers, node-1..3
  const nb = notebook({visible: true});
  nb.deploy.node.opacity(1);
  const pods = nb.pods.slice(0, 3);
  const ASSIGN = ['node-2', 'node-1', 'node-3']; // pod i → node
  pods.forEach((p, i) => { p.node.opacity(1); p.field.text(`node: ${ASSIGN[i]}`); p.field.fill(C.text); });
  const sv = servers({frames: true, names: 'node'});
  const rc = controller('replica controller', {x: CTRL_X.replica, y: CTRL_Y});
  const sc = controller('scheduler', {x: CTRL_X.scheduler, y: CTRL_Y});
  rc.node.opacity(DIM);
  sc.node.opacity(DIM);
  const rcLink = ctrlLink(CTRL_X.replica, LANE.replica, true);
  const scLink = ctrlLink(CTRL_X.scheduler, LANE.scheduler, true);
  rcLink.opacity(DIM);
  scLink.opacity(DIM);

  const run = running('running: 0');
  const card = termCard('kubelet = the thermostat on each server');
  const kLink = kubeletLink(1);
  const st = stamp({x: STAMP_POS[0], y: STAMP_POS[1], w: 180});
  // the Docker-video callback sits left of the kubelet's link, between controllers and node tags
  const ns = wall({x: -230, y: 25, w: 320, h: 100, tag: 'blinders: pid mnt net'});
  const procBox = box({x: -230, y: 25, w: 240, h: 74, title: 'web', sub: 'one process', size: 26, stroke: C.accent});
  const chain = mono('file → notebook → replica → scheduler → kubelet', {x: -200, y: 408, size: FS.small, fill: C.dim});
  const cl = checklist({state: ['', 'ok', '', '']});

  s.stage.add([sv.group, nb.group, rcLink, rc.node, scLink, sc.node, run, card, kLink, st.node,
    ns.node, procBox.node, chain]);
  view.add(cl.node);

  // "So who actually runs anything?"
  yield* s.at('who');
  yield* fadeIn(run);

  // "Every server has a small agent called the kube-let."
  yield* s.at('agent');
  yield* all(fadeIn(card), sequence(0.15, ...sv.list.map(v => v.kubelet.opacity(1, T.base))));

  // "Another thermostat, but it only cares about its own server."
  yield* s.at('own');
  yield* all(
    sv.list[1].kubelet.stroke(C.accent, T.base),
    fadeTo(DIM, sv.list[0].frame, sv.list[0].kubelet, sv.list[2].frame, sv.list[2].kubelet),
  );

  // "Want: every pod with my name on it."
  yield* s.at('want');
  yield* all(draw(kLink), card.opacity(0, T.base));
  yield* all(pods[0].node.stroke(C.accent, T.fast), pods[0].field.fill(C.accent, T.fast), fadeIn(st.node));
  yield* st.set('want', '1 pod');

  // "Have: what's running on me right now."
  yield* s.at('have');
  yield* st.set('have', '0');

  // "Want one, have zero, so it tells the container engine to start one."
  yield* s.at('act');
  yield* st.set('act', '+1');
  yield* all(fadeIn(sv.list[1].web), sv.list[1].web.stroke(C.accent, T.base), swap(run, 'running: 1'));

  // "That container is the same thing from our Docker video: an ordinary process, with blinders on."
  yield* s.at('docker');
  yield* st.node.opacity(0, T.fast);
  yield* fadeIn(procBox.node);
  yield* drawWall(ns);

  // "Three servers, three copies."
  yield* s.at('three');
  yield* all(
    fadeTo(0, ns.node, procBox.node, kLink),
    pods[0].node.stroke(C.stroke, T.base), pods[0].field.fill(C.text, T.base),
    sv.list[1].kubelet.stroke(C.stroke, T.base), sv.list[1].web.stroke(C.stroke, T.base),
    ...[0, 2].map(i => all(sv.list[i].frame.opacity(1, T.base), sv.list[i].kubelet.opacity(1, T.base))),
  );
  yield* all(fadeIn(sv.list[0].web, sv.list[2].web), swap(run, 'running: 3'), cl.check(0));

  // "After a file, a notebook and three thermostats, something has finally started."
  yield* s.at('finally');
  yield* fadeIn(chain);
  yield* all(run.fill(C.good, T.base), ...sv.list.map(v => v.web.stroke(C.good, T.base)));

  yield* s.end();
});
