import {makeScene2D} from '@motion-canvas/2d';
import {spawn, useThread} from '@motion-canvas/core';
import {endCard} from '@shared/outro';
import {setup} from '../lib/sync';

export default makeScene2D(function* (view) {
  const s = setup(view, 'scene23', '', {fadeLabel: false});
  const card = endCard();
  s.stage.add(card.node);

  yield* card.enter();
  // "If you liked the video, drop a like" (cues are close: chips run alongside each other)
  yield* s.at('like');
  spawn(card.like());
  // "and subscribe,"
  yield* s.at('sub');
  spawn(card.subscribe());
  // "and tell me what topics you want to see next."
  yield* s.at('next');
  yield* card.suggest();
  // hold for YouTube's end screen (the voiceover tool added endScreenHold seconds)
  while (useThread().time() < s.duration - 2) yield* card.idle();
  yield* s.end([]);
});
