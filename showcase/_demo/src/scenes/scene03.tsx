import {makeScene2D} from '@motion-canvas/2d';
import {useThread} from '@motion-canvas/core';
import {endCard} from '@shared/outro';
import {setup} from '../lib/sync';

export default makeScene2D(function* (view) {
  const s = setup(view, 'scene03', '', {fadeLabel: false});
  const card = endCard();
  s.stage.add(card.node);

  yield* card.enter();
  // "If you liked the video, drop a like"
  yield* s.at('like');
  yield* card.like();
  // "and subscribe,"
  yield* s.at('sub');
  yield* card.subscribe();
  // "and tell me what topics you want to see next."
  yield* s.at('next');
  yield* card.suggest();
  // hold for YouTube's end screen (the voiceover tool added endScreenHold seconds)
  while (useThread().time() < s.duration - 2) yield* card.idle();
  yield* s.end([]);
});
