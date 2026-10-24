import {makeScene2D} from '@motion-canvas/2d';
import {all, sequence} from '@motion-canvas/core';
import {setup} from '../lib/sync';
import {draw, drawCross, fadeIn, fadeTo} from '../lib/ui';
import {laptopServer} from '../lib/figures';
import {T} from '../lib/theme';

export default makeScene2D(function* (view) {
  const s = setup(view, 'scene01', 'THE PROBLEM');
  const f = laptopServer(false);
  s.stage.add(f.group);

  // "Your app works perfectly on your laptop."
  yield* s.at('laptop');
  yield* fadeIn(f.laptop.node, f.appL.node);
  yield* f.okL.end(1, T.base);

  // "You put it on a server, and it crashes."
  yield* s.at('server');
  yield* draw(f.link);
  yield* fadeIn(f.server.node, f.appR.node);
  yield* drawCross(f.badR);

  // "The server has a different Node version." / "A library is missing." / "A setting is different."
  yield* s.at('node');
  yield* fadeIn(f.chips[0]);
  yield* s.at('lib');
  yield* fadeIn(f.chips[1]);
  yield* s.at('cfg');
  yield* fadeIn(f.chips[2]);

  // "Docker's promise is simple:"
  yield* s.at('promise');
  yield* fadeTo(0.3, ...f.chips);

  // "pack the app together with everything it needs,"
  yield* s.at('pack');
  yield* all(f.appL.node.opacity(0, T.fast), f.okL.opacity(0, T.fast));
  yield* fadeIn(f.pkgL.node);

  // "so it runs the same everywhere."
  yield* s.at('same');
  f.pkgR.node.position([-420, -40]);
  yield* all(
    f.pkgR.node.opacity(1, 0.2), f.pkgR.node.x(420, T.slow),
    f.appR.node.opacity(0, T.fast), f.badR.node.opacity(0, T.fast), fadeTo(0, ...f.chips),
  );
  f.okL.position([-420, 100]);
  f.okR.position([420, 100]);
  f.okL.end(0);
  f.okL.opacity(1);
  yield* sequence(0.15, f.okL.end(1, T.base), f.okR.end(1, T.base));

  yield* s.end();
});
