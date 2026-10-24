import {Circle, makeScene2D, Rect} from '@motion-canvas/2d';
import {all, chain, sequence} from '@motion-canvas/core';
import {setup} from '../lib/sync';
import {box, code, crossMark, draw, drawCross, fadeIn, fadeTo, mono, swap, termCard, arrow} from '../lib/ui';
import {checklist} from '../lib/checklist';
import {chip, NOTE_LEFT, SERVER_Y} from '../lib/figures';
import {machineRoom} from '../lib/extra-c';
import {C, DIM, FS, T, W} from '../lib/theme';

export default makeScene2D(function* (view) {
  const s = setup(view, 'scene16', 'SERVICES');
  const m = machineRoom();
  const nodes = m.sv.list;
  // this scene is about pods, addresses and the kernel: paperwork controllers stay out
  m.replica.node.opacity(0);
  m.scheduler.node.opacity(0);
  m.group.opacity(0);
  nodes.forEach(n => n.kubelet.opacity(0));
  const ADDR = ['10.1.0.4', '10.1.2.7', '10.1.3.9'];

  // scene 01's config line, called back
  const cfg = mono('web = 10.0.0.4', {x: -200, y: 30, size: 30, fill: C.bad});
  const card = termCard('Service = one stable address');
  const svc = box({x: -200, y: -120, w: 380, h: 70, title: 'web · 10.96.0.10', size: 28, stroke: C.accent, color: C.accent});
  const proxy = box({x: -200, y: 5, w: 220, h: 60, title: 'proxy?', size: 26, dashed: true, color: C.dim});
  const pCross = crossMark({x: -200, y: 5, s: 1.4});
  const rules = code(['→ 10.96.0.10: pick', '  10.1.0.4 | 10.1.2.7 | 10.1.3.12'], {x: -200, y: 5, w: 640, size: 24, fill: C.text});
  // kube-proxy sits where the free-room bar was; the kernel bar where the kubelet was
  const kp = nodes.map(n => box({x: n.x, y: n.y - 80, w: 200, h: 40, title: 'kube-proxy', size: FS.small, color: C.dim}).node);
  const kernel = nodes.map(n => box({x: n.x, y: n.y + 80, w: 250, h: 42, title: 'KERNEL · rules', size: FS.small, stroke: C.accent}).node);
  // kube-proxy reads the notebook: one bus just above the node tags, dropping into each kube-proxy
  const BUS_Y = SERVER_Y - 168;
  const reads = nodes.map(n => arrow([[NOTE_LEFT - 6, BUS_Y], [n.x + 60, BUS_Y], [n.x + 60, n.y - 104]], {width: W.fine}));
  const dot = (<Circle size={18} fill={C.accent} position={[-200, -85]} opacity={0} />) as Circle;
  const nothing = chip('kube-proxy: proxies nothing', {x: -200, y: -200, color: C.accent, stroke: C.accent});

  s.stage.add([m.group, cfg, svc.node, proxy.node, pCross.node, rules.node, ...kp, ...kernel, ...reads, card, dot, nothing.node]);
  const cl = checklist({state: ['ok', 'ok', 'ok', '']});
  view.add(cl.node);

  // "One box left: one address."
  yield* s.at('left');
  yield* all(m.group.opacity(1, T.base), fadeTo(DIM, m.nb.group), cl.pulse(3));

  // "Pods come and go, and each new one gets a new address."
  yield* s.at('come');
  nodes.forEach((n, i) => n.addr.text(ADDR[i]));
  yield* sequence(0.15, ...nodes.map(n => n.addr.opacity(1, T.base)));
  yield* all(nodes[2].web.opacity(0.1, T.fast), nodes[2].addr.opacity(0, T.fast));
  nodes[2].addr.text('10.1.3.12');
  yield* all(nodes[2].web.opacity(1, T.base), nodes[2].addr.opacity(1, T.base), nodes[2].addr.fill(C.accent, T.base));
  // "That's the config you used to fix by hand."
  yield* chain(fadeIn(cfg), cfg.opacity(DIM, T.base));

  // "So you add a Service: one stable name, web,"
  yield* s.at('service');
  yield* all(fadeIn(card, svc.node), cfg.opacity(0, T.fast), nodes[2].addr.fill(C.dim, T.base));

  // "You'd expect a program sitting at that address, passing traffic along."
  yield* s.at('expect');
  yield* fadeIn(proxy.node);

  // "Nope."
  yield* s.at('nope');
  yield* all(drawCross(pCross), proxy.node.stroke(C.bad, T.fast));

  // "On every server, one more thermostat, kube proxy, reads the notebook and writes packet rules"
  yield* s.at('rules');
  yield* all(fadeTo(0, proxy.node, pCross.node, card));
  yield* sequence(0.15, ...kp.map(k => k.opacity(1, T.base)));
  yield* all(m.nb.group.opacity(1, T.base), ...reads.map(r => draw(r)));
  yield* fadeIn(rules.node);

  // "The kernel forwards it itself."
  yield* s.at('kernel');
  yield* all(rules.node.opacity(DIM, T.fast), fadeTo(DIM, ...reads, m.nb.group),
    ...kernel.map(k => k.opacity(1, T.base)));
  dot.opacity(1);
  yield* dot.position([nodes[0].x, nodes[0].y + 80], 0.4);
  yield* dot.position([nodes[0].x, nodes[0].y - 20], 0.35);
  yield* all(dot.opacity(0, T.fast), (nodes[0].web as Rect).stroke(C.accent, T.fast));

  // "So despite the name, kube proxy usually proxies nothing."
  yield* s.at('name');
  yield* all(fadeIn(nothing.node), (nodes[0].web as Rect).stroke(C.stroke, T.base));

  // "When a pod is replaced, it just rewrites the rules."
  yield* s.at('rewrite');
  yield* all(rules.node.opacity(1, T.fast), nothing.node.opacity(DIM, T.fast),
    nodes[2].web.opacity(0.1, T.fast), nodes[2].addr.opacity(0, T.fast));
  nodes[2].addr.text('10.1.3.20');
  yield* all(nodes[2].web.opacity(1, T.fast), nodes[2].addr.opacity(1, T.fast),
    swap(rules.lines[1], '  10.1.0.4 | 10.1.2.7 | 10.1.3.20', C.accent));
  yield* cl.check(3);

  yield* s.end();
});
