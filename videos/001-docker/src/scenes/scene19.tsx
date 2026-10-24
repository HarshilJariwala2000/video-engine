import {Line, makeScene2D} from '@motion-canvas/2d';
import {all, sequence} from '@motion-canvas/core';
import {setup} from '../lib/sync';
import {arrow, box, code, draw, fadeIn, fadeTo, mono} from '../lib/ui';
import {checklist} from '../lib/checklist';
import {DOCKERFILE} from '../lib/figures';
import {C, T} from '../lib/theme';

export default makeScene2D(function* (view) {
  const s = setup(view, 'scene19', 'BUILD CACHE');
  const df = code(DOCKERFILE, {x: -430, y: 0, w: 700, fill: C.text});
  const title = mono('docker build  (again)', {x: -430, y: -190, size: 22, fill: C.dim});
  const note = mono('every step = a saved layer', {x: -430, y: 190, size: 22, fill: C.dim});
  const tags = DOCKERFILE.map((_, i) =>
    mono(i < 3 ? 'REUSED' : 'RUN', {x: -50, y: df.lineY(i), size: 20, fill: i < 3 ? C.good : C.accent, align: 'left'}));
  const y3 = df.lineY(3);
  const chip = box({x: 520, y: y3, w: 400, h: 60, title: 'server.js: 1 line changed', size: 20, stroke: C.accent});
  const chipArrow = arrow([[315, y3], [70, y3]], {stroke: C.accent});
  const [y1, y2] = [df.lineY(1), df.lineY(2)];
  const bracket = (
    <Line points={[[-795, y1 - 22], [-815, y1 - 22], [-815, y2 + 22], [-795, y2 + 22]]} stroke={C.accent} lineWidth={3} end={0} />
  ) as Line;
  const depsFirst = mono('dependencies first', {x: -430, y: -150, size: 20, fill: C.accent});
  const bad = code(['FROM node:22-alpine', 'COPY . .', 'RUN npm install'], {x: 430, y: -40, w: 440, size: 24, fill: C.text, stroke: C.bad});
  const badTags = ['REUSED', 'RUN', 'RUN'].map((t, i) =>
    mono(t, {x: 670, y: bad.lineY(i), size: 18, fill: i === 0 ? C.good : C.bad, align: 'left'}));
  const badNote = mono('any edit → reinstall everything', {x: 430, y: 90, size: 20, fill: C.bad});
  s.stage.add([df.node, title, note, ...tags, chip.node, chipArrow, bracket, depsFirst, bad.node, ...badTags, badNote]);
  view.add(checklist({state: ['ok', 'ok', 'ok', 'ok']}).node);

  // "Layers also make rebuilds fast."
  yield* s.at('fast');
  yield* fadeIn(df.node, title);

  // "Docker keeps every layer it has built."
  yield* s.at('keeps');
  yield* fadeIn(note);

  // "Change one line of your code,"
  yield* s.at('change');
  yield* fadeIn(chip.node);
  yield* draw(chipArrow);

  // "and every step before copying your code is reused as-is."
  yield* s.at('reused');
  yield* sequence(0.2, ...tags.slice(0, 3).map(t => fadeIn(t)));

  // "Only the last steps run again."
  yield* s.at('last');
  yield* all(fadeIn(tags[3]), df.lines[3].fill(C.accent, T.base));

  // "That's why good Dockerfiles install dependencies before copying the code."
  yield* s.at('good');
  yield* all(bracket.end(1, T.base), df.lines[3].fill(C.text, T.base),
    df.lines[1].fill(C.accent, T.base), df.lines[2].fill(C.accent, T.base), fadeIn(depsFirst));

  // "Do it the other way around,"
  yield* s.at('other');
  yield* fadeTo(0, chip.node, chipArrow);
  yield* fadeIn(bad.node);

  // "and every tiny edit reinstalls everything."
  yield* s.at('every');
  yield* sequence(0.15, ...badTags.map(t => fadeIn(t)), fadeIn(badNote));

  yield* s.end();
});
