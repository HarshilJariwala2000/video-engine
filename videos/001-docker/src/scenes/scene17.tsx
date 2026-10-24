import {Txt, makeScene2D} from '@motion-canvas/2d';
import {all, sequence, ThreadGenerator} from '@motion-canvas/core';
import {setup} from '../lib/sync';
import {code, fadeIn, mono, swap, termCard} from '../lib/ui';
import {checklist} from '../lib/checklist';
import {DOCKERFILE, LAYER_NAMES, layerStack} from '../lib/figures';
import {C, T} from '../lib/theme';

export default makeScene2D(function* (view) {
  const s = setup(view, 'scene17', 'IMAGES', {fadeLabel: false});
  const df = code(DOCKERFILE, {x: -430, y: 0, w: 700});
  const layers = layerStack(LAYER_NAMES, {x: 480, y: 180, w: 420});
  const card = termCard('Dockerfile = a recipe');
  const note = mono('4 steps → 4 layers', {x: 480, y: -100, size: 24, fill: C.accent});
  s.stage.add([df.node, ...layers.map(l => l.node), card, note]);
  view.add(checklist({state: ['ok', 'ok', 'ok', 'ok']}).node);

  let active: Txt | null = null;
  function* step(i: number): ThreadGenerator {
    const prev = active;
    active = df.lines[i];
    yield* all(df.lines[i].fill(C.accent, T.fast), ...(prev ? [prev.fill(C.text, T.fast)] : []), fadeIn(layers[i].node));
  }

  // "You describe an image with a short recipe called a Dockerfile."
  yield* s.at('recipe');
  yield* fadeIn(df.node, card);

  // "Each step adds a layer: a set of files stacked on top of the step before."
  yield* s.at('layer');
  yield* swap(card, "layer = one step's files");

  // "Start from a base..." / "Copy in your list of dependencies." / "Install them." / "Then copy in your code."
  yield* s.at('base');
  yield* step(0);
  yield* s.at('deps');
  yield* step(1);
  yield* s.at('install');
  yield* step(2);
  yield* s.at('code');
  yield* step(3);

  // "Four steps, four layers."
  yield* s.at('four');
  yield* all(fadeIn(note), sequence(0.08, ...layers.map(l => l.node.stroke(C.accent, T.base))));

  yield* s.end();
});
