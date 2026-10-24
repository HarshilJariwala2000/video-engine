import {Rect, makeScene2D} from '@motion-canvas/2d';
import {all, chain, sequence} from '@motion-canvas/core';
import {setup} from '../lib/sync';
import {arrow, box, draw, fadeIn, fadeTo, mono, proc, swap, wall} from '../lib/ui';
import {checklist} from '../lib/checklist';
import {laptopServer} from '../lib/figures';
import {C, T} from '../lib/theme';

export default makeScene2D(function* (view) {
  const s = setup(view, 'scene15', 'IMAGES');
  const ns = wall({x: -450, y: 20, w: 460, h: 320, tag: 'pid  mnt  net', drawn: true});
  const p = proc({name: 'my-app', pid: 1, x: -450, y: -60, opacity: 1});
  p.node.stroke(C.accent);
  const folder = mono('/  (empty)', {x: -450, y: 55, size: 24, fill: C.dim, opacity: 1});
  const folder2 = mono('libraries  your code', {x: -450, y: 95, size: 20, fill: C.text});

  // callback: the exact server from scene 01
  const cb = laptopServer(false);
  cb.badR.a.end(1);
  cb.badR.b.end(1);
  cb.badR.node.opacity(0);
  const callback = [cb.server.node, cb.appR.node, cb.badR.node, ...cb.chips];

  const img = (<Rect x={430} y={20} width={420} height={360} stroke={C.stroke} lineWidth={2} radius={4} opacity={0} />) as Rect;
  const imgTitle = mono('IMAGE', {x: 430, y: -125, size: 30});
  const rows = ['linux tools', 'node 22', 'libraries', 'your code'].map((t, i) =>
    box({x: 430, y: -60 + i * 58, w: 340, h: 44, title: t, size: 20}).node);
  const link = arrow([[215, 20], [-215, 20]], {stroke: C.accent});
  const cl = checklist({state: ['', 'ok', 'ok', 'ok']});
  s.stage.add([ns.node, p.node, folder, folder2, cb.group, img, imgTitle, ...rows, link]);
  view.add(cl.node);

  // "That leaves box one: the files."
  yield* s.at('left');
  yield* cl.pulse(0);

  // "Remember the crash from the beginning?"
  yield* s.at('crash');
  yield* fadeIn(...callback);

  // "The server had the wrong files."
  yield* s.at('wrong');
  yield* sequence(0.1, ...cb.chips.map(c => chain(c.scale(1.08, 0.2), c.scale(1, 0.3))));

  // "So the fix is to ship the files with the app."
  yield* s.at('ship');
  yield* fadeTo(0, ...callback);

  // "That bundle is called an image."
  yield* s.at('image');
  yield* fadeIn(img, imgTitle);

  // "It holds a small set of Linux tools," / "the right Node version," / "your libraries," / "and your code."
  yield* s.at('holds');
  yield* fadeIn(rows[0]);
  yield* s.at('node');
  yield* fadeIn(rows[1]);
  yield* s.at('libs');
  yield* fadeIn(rows[2]);
  yield* s.at('code');
  yield* fadeIn(rows[3]);

  // "When the container starts, the image's files fill that private folder."
  yield* s.at('fill');
  yield* draw(link);
  yield* all(swap(folder, 'linux tools  node 22', C.text), folder2.opacity(1, T.base));

  // "Box one."
  yield* s.at('box');
  yield* cl.check(0);

  yield* s.end();
});
