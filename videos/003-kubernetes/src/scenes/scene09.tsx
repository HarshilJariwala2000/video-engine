import {Line, makeScene2D} from '@motion-canvas/2d';
import {all, chain, sequence} from '@motion-canvas/core';
import {setup} from '../lib/sync';
import {arrow, checkMark, code, draw, fadeIn, fadeTo, mono, sans, terminal, termCard, type} from '../lib/ui';
import {checklist} from '../lib/checklist';
import {chip, entryPos, NOTE_POS, NOTE_W, notebook, servers} from '../lib/figures';
import {C, DIM, FS, T, W} from '../lib/theme';

export default makeScene2D(function* (view) {
  const s = setup(view, 'scene09', 'THE NOTEBOOK');
  const wantH = mono('WANT', {x: -450, y: -120, size: FS.label, fill: C.dim});
  const q = mono('?', {x: -450, y: -50, size: 80, fill: C.accent});
  const yaml = code(['kind: Deployment', 'name: web', 'replicas: 3'], {x: -450, y: -50, w: 480});
  yaml.lines[2].fill(C.accent);
  const term = terminal({x: -200, y: -250, w: 820});
  const fun = chip('fun fact', {x: 330, y: -250, color: C.dim});
  const nothing = sans('starts nothing', {x: 90, y: -60, size: 44, fill: C.accent});
  const nb = notebook();
  const send = arrow([[215, -250], [475, -250]], {stroke: C.accent});
  const card = termCard('API server = the shared notebook');
  const output = mono('deployment.apps/web created', {x: -590, y: -170, size: 28, align: 'left'});
  const ok = checkMark({x: -100, y: -170});
  const okWish = mono('wish', {x: -70, y: -170, size: 30, fill: C.accent});
  const sv = servers();
  const running = mono('running: 0', {x: -200, y: 80, size: FS.label, fill: C.text});
  const [ex, ey] = entryPos(0);
  const wish = chip('wish', {x: ex, y: entryPos(1)[1], color: C.accent, stroke: C.accent});
  const but = chip('but 2 pods started…', {x: -450, y: -20, color: C.dim});
  const lead = (<Line points={[[NOTE_POS[0] - NOTE_W / 2, -20], [130, -20]]} stroke={C.dim} lineWidth={W.line}
                      lineDash={[12, 8]} endArrow arrowSize={12} end={0} opacity={0} />) as Line;
  const what = mono('something else?', {x: -20, y: -20, size: FS.small, fill: C.dim});

  s.stage.add([sv.group, nb.group, wantH, q, yaml.node, term.node, fun.node, nothing, send, card, output, ok, okWish,
    running, wish.node, but.node, lead, what]);
  view.add(checklist().node);

  // "So where does the want live?"
  yield* s.at('where');
  yield* fadeIn(wantH, q);

  // "In a file: a deployment called web, with three replicas."
  yield* s.at('file');
  yield* all(fadeTo(0, wantH, q), fadeIn(yaml.node));

  // "You run kube control apply."
  yield* s.at('apply');
  yield* term.node.opacity(1, T.fast);
  yield* type(term.cmd, 'kubectl apply -f web.yaml');

  // "And now my favourite fact about Kubernetes."
  yield* s.at('fav');
  yield* all(term.node.opacity(DIM, T.base), fadeIn(fun.node));

  // "Apply doesn't start anything."
  yield* s.at('nothing');
  yield* fadeIn(nothing);

  // "It sends your file to one program, the API server,"
  yield* s.at('sends');
  yield* all(term.node.opacity(1, T.fast), fun.node.opacity(0, T.fast), nothing.opacity(DIM, T.base), fadeIn(card));
  yield* draw(send);
  yield* fadeIn(nb.api);

  // "which saves it in a database"
  yield* s.at('db');
  yield* all(fadeIn(nb.link, nb.book),
    yaml.node.position([ex, ey], T.slow), yaml.node.scale(0.25, T.slow), yaml.node.opacity(0, T.slow),
    nb.deploy.node.opacity(1, T.slow));

  // "and replies: OK."
  yield* s.at('ok');
  yield* fadeIn(output);

  // "Zero containers are running."
  yield* s.at('zero');
  yield* all(sequence(0.1, ...sv.list.map(x => x.frame.opacity(1, T.base))), fadeIn(running));

  // "All you've done is write down a wish."
  yield* s.at('wish');
  yield* fadeIn(wish.node);

  // "So that created from the start of the video? It means the wish was written down."
  yield* s.at('created');
  yield* all(chain(output.fill(C.accent, 0.3), output.fill(C.text, 0.5)), ok.end(1, T.base));
  yield* all(ok.opacity(0, T.base), fadeIn(okWish));

  // "But two of my pods did start, you say. They did. Just not because of apply."
  yield* s.at('objection');
  yield* all(nothing.opacity(0, T.fast), fadeIn(but.node));
  yield* all(draw(lead, T.slow), fadeIn(what));

  // keep the notebook (deployment entry) and the empty servers for scene 10
  yield* s.end([wantH, q, yaml.node, term.node, fun.node, nothing, send, card, output, ok, okWish,
    running, wish.node, but.node, lead, what]);
});
