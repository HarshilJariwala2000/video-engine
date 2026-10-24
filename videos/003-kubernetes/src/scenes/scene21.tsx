import {makeScene2D} from '@motion-canvas/2d';
import {summary} from '@shared/outro';
import {setup} from '../lib/sync';
import {sans} from '../lib/ui';
import {T} from '../lib/theme';

export default makeScene2D(function* (view) {
  const s = setup(view, 'scene21', 'TO SUMMARISE');
  const head = sans('to summarise everything', {y: -360, size: 40, opacity: 0});
  const sum = summary([
    'kubectl apply only writes the want.',
    'Controllers: want vs have, forever.',
    'The scheduler fills in a node; the kubelet makes it real.',
    'Pending = a want nothing can have yet.',
  ], {y: -90});
  s.stage.add(<>{head}{sum.node}</>);

  // "To summarise everything."
  yield* s.at('sum');
  yield* head.opacity(1, T.base);
  // "Apply doesn't start anything. It writes the want into the API server…"
  yield* s.at('p1');
  yield* sum.reveal(0);
  // "Controllers compare want with have, and fix the difference, forever."
  yield* s.at('p2');
  yield* sum.reveal(1);
  // "The scheduler fills in a server name, and that server's kube-let makes it real."
  yield* s.at('p3');
  yield* sum.reveal(2);
  // "A Pending pod isn't an error. It's a want that nothing can have yet…"
  yield* s.at('p4');
  yield* sum.reveal(3);
  // "Kubernetes isn't a launcher. It's a room full of stubborn thermostats…"
  yield* s.at('aha');
  yield* sum.aha('Not a launcher. A room full of stubborn thermostats.');
  yield* s.end();
});
