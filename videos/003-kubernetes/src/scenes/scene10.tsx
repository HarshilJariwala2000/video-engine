import {makeScene2D, Node} from '@motion-canvas/2d';
import {all, chain, sequence} from '@motion-canvas/core';
import {setup} from '../lib/sync';
import {box, draw, fadeIn, fadeTo, mono, termCard} from '../lib/ui';
import {checklist} from '../lib/checklist';
import {CTRL_X, CTRL_Y, SERVER_X, STAMP_POS, controller, entryPos, flash, notebook, podList, servers, spin, stamp} from '../lib/figures';
import {LANE, ctrlLink, podShape, running} from '../lib/extra-b';
import {C, DIM, FS, T} from '../lib/theme';

export default makeScene2D(function* (view) {
  const s = setup(view, 'scene10', 'THE REPLICA LOOP');
  // state left by scene 09: notebook with the deployment entry, three empty servers
  const nb = notebook({visible: true});
  nb.deploy.node.opacity(1);
  const sv = servers({frames: true});
  const rc = controller('replica controller', {x: CTRL_X.replica, y: CTRL_Y});
  const rcLink = ctrlLink(CTRL_X.replica, LANE.replica);
  const st = stamp({x: STAMP_POS[0], y: STAMP_POS[1]});
  const card = termCard('pod = one running copy');

  // the pod explainer: a dashed pod around one web container + helper + address
  // (it takes the stamp's place, so the stamp leaves first)
  const pod = podShape({x: -200, y: 5, w: 440, h: 140, label: ''});
  const ctr = box({x: -285, y: -15, w: 170, h: 56, title: 'web', size: 26, opacity: 0});
  const helper = box({x: -95, y: -15, w: 130, h: 50, title: 'helper', size: FS.small, color: C.dim, opacity: 0});
  const addr = mono('10.1.0.4', {x: -200, y: 45, size: FS.small, fill: C.accent});
  const pods = SERVER_X.map(x => podShape({x, y: 20, w: 200, h: 80}));
  const x3 = mono('web ×3', {x: -200, y: 82, size: FS.small, fill: C.dim});
  const run0 = running('running: 0');
  // between the controller row and the node tags, clear of the replica controller
  const list = podList({x: -120, y: -5, visible: false, status: ['Running', 'Running', 'Pending']});
  list.node.scale(0.65);

  const explainer = (<Node>{pod.node}{ctr.node}{helper.node}{addr}</Node>) as Node;
  s.stage.add([sv.group, nb.group, rcLink, rc.node, st.node, card, explainer, ...pods.map(p => p.node), x3, run0, list.node]);
  view.add(checklist().node);

  // "The wish wakes up the first thermostat: the replica controller."
  yield* s.at('wakes');
  yield* fadeIn(rc.node);
  yield* all(draw(rcLink), spin(rc.glyph));

  // "It reads the notebook."
  yield* s.at('reads');
  yield* all(flash(nb.deploy.node), rcLink.stroke(C.accent, T.fast), rc.box.stroke(C.accent, T.fast));

  // "Want: three copies of web."
  yield* s.at('want');
  yield* fadeIn(st.node);
  yield* st.set('want', '3');

  // "Have: zero."
  yield* s.at('have');
  yield* st.set('have', '0');

  // "So it creates three pods."
  yield* s.at('act');
  yield* all(st.set('act', '+3'), spin(rc.glyph));

  // "Pod is Kubernetes' word for one copy of your app."
  yield* s.at('pod');
  yield* all(fadeIn(card), st.node.opacity(0, T.base), fadeTo(DIM, rc.node, rcLink, nb.group));
  yield* all(pod.node.opacity(1, T.base), fadeIn(ctr.node));
  // "...sometimes with a small helper that has to live and die with it,"
  yield* s.at('pod', 7.2);
  yield* fadeIn(helper.node);
  // "...and the pod gets its own address."
  yield* s.at('pod', 12.6);
  yield* fadeIn(addr);

  // "So for us, one pod is one copy of web, and we want three."
  yield* s.at('ours');
  yield* all(fadeTo(0, explainer, card), st.node.opacity(0, T.base));
  yield* sequence(0.15, ...pods.map(p => p.node.opacity(1, T.base)));
  yield* fadeIn(x3);

  // "But look closer."
  yield* s.at('closer');
  yield* all(nb.group.opacity(1, T.base), rc.node.opacity(1, T.base), rcLink.opacity(1, T.base), nb.book.stroke(C.accent, T.base));

  // "It didn't run anything either. It wrote three more entries in the notebook."
  yield* s.at('records');
  yield* all(
    x3.opacity(0, T.fast),
    ...pods.map((p, i) => all(
      p.node.position(entryPos(i + 1), T.slow), p.node.scale(0.4, T.slow), p.node.opacity(0, T.slow))),
    sequence(0.2, ...nb.pods.slice(0, 3).map(e => e.node.opacity(1, T.base))),
  );
  yield* nb.book.stroke(C.stroke, T.base);

  // "Kubernetes is extremely good at paperwork."
  yield* s.at('paper');
  yield* fadeIn(run0);
  yield* sequence(0.1, ...sv.list.map(v => flash(v.frame, C.text)));

  // "And remember our Pending pod? It exists. ... It's just missing one thing."
  yield* s.at('hook');
  yield* all(fadeTo(DIM, rc.node, rcLink, run0), fadeIn(list.node), ...list.rows.map(r => r.row.opacity(1, T.base)));
  const pend = list.rows[2];
  yield* chain(pend.status.scale(1.25, 0.25), pend.status.scale(1, 0.35));
  yield* all(
    nb.pods[2].node.stroke(C.accent, T.base), nb.pods[2].field.fill(C.accent, T.base),
    chain(pend.status.scale(1.25, 0.25), pend.status.scale(1, 0.35)),
  );

  // back to the plain notebook state scene 11 starts from
  yield* s.before(0.9);
  yield* all(
    nb.pods[2].node.stroke(C.stroke, 0.4), nb.pods[2].field.fill(C.dim, 0.4),
    rc.node.opacity(1, 0.4), rcLink.opacity(1, 0.4), rcLink.stroke(C.dim, 0.4), rc.box.stroke(C.stroke, 0.4),
  );
  yield* s.end([list.node, run0]);
});
