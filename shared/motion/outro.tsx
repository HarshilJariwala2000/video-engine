// The channel's standard ending, used by every video:
//
//   SUMMARY scene   "To summarise everything…": numbered recap of the video's points
//   END CARD scene  "If you liked the video, drop a like and subscribe, and tell me
//                    what topics you want to see next." + the logo lockup
//
// Both are ordinary narrated scenes in narration/script.mjs; their .tsx files call
// these helpers. The voiceover tool mixes the outro music bed (brand.json outro)
// under scenes marked `bed: true`, and holds the end card for YouTube's end screen.
//
//   // sceneNN.tsx (summary)
//   const s = setup(view, 'scene22', 'TO SUMMARISE');
//   const sum = summary(['An update writes a new version', …]);
//   s.stage.add(sum.node);
//   yield* s.at('p1'); yield* sum.reveal(0); …
//   yield* s.at('aha'); yield* sum.aha('Postgres never changes a row.');
//
//   // sceneNN.tsx (end card)
//   const s = setup(view, 'scene23', '', {fadeLabel: false});
//   const card = endCard();
//   s.stage.add(card.node);
//   yield* card.enter();
//   yield* s.at('like'); yield* card.like();
//   yield* s.at('sub'); yield* card.subscribe();
//   yield* s.at('next'); yield* card.suggest();
//   yield* s.end([]);
import {Line, Node, Rect, Txt} from '@motion-canvas/2d';
import {all, chain, easeInOutCubic, easeOutBack, easeOutCubic, sequence, ThreadGenerator, waitFor} from '@motion-canvas/core';
import {LOCKUP, grid, logo, tagline, wordmark} from './brand';
import {C, MONO, SANS, T} from './theme';

// ── summary ──────────────────────────────────────────────────────────────────
export function summary(points: string[], o: {x?: number; y?: number; gap?: number; size?: number} = {}) {
  const gap = o.gap ?? 92, size = o.size ?? 42;
  const top = (o.y ?? -60) - ((points.length - 1) * gap) / 2;
  const rows = points.map((p, i) => {
    const num = (<Txt text={String(i + 1).padStart(2, '0')} fontFamily={MONO} fontSize={size * 0.8} fill={C.accent}
                      offsetX={-1} x={(o.x ?? -760)} y={top + i * gap} />) as Txt;
    const text = (<Txt text={p} fontFamily={SANS} fontSize={size} fill={C.text}
                       offsetX={-1} x={(o.x ?? -760) + size * 2.1} y={top + i * gap} />) as Txt;
    const row = (<Node opacity={0}>{num}{text}</Node>) as Node;
    return {row, num, text};
  });
  const ahaTxt = (<Txt text="" fontFamily={MONO} fontWeight={800} fontSize={size * 1.05} fill={C.accent}
                       y={top + points.length * gap + gap * 0.5} opacity={0} />) as Txt;
  const node = (<Node>{rows.map(r => r.row)}{ahaTxt}</Node>) as Node;
  return {
    node, rows,
    /** reveal point i; earlier points dim slightly so the eye follows the new one */
    *reveal(i: number): ThreadGenerator {
      const r = rows[i];
      r.row.position.x(-30);
      yield* all(
        r.row.opacity(1, T.base), r.row.position.x(0, T.base, easeOutCubic),
        ...rows.slice(0, i).map(p => p.row.opacity(0.55, T.base)),
      );
    },
    /** the one-sentence aha, under the list */
    *aha(text: string): ThreadGenerator {
      ahaTxt.text(text);
      yield* all(ahaTxt.opacity(1, T.slow), ...rows.map(p => p.row.opacity(0.35, T.slow)));
    },
  };
}

// ── end card ─────────────────────────────────────────────────────────────────
function chip(label: string, x: number, y: number) {
  const w = label.length * 25 + 70;
  const rect = (<Rect width={w} height={86} radius={10} stroke={C.stroke} lineWidth={3} end={0} />) as Rect;
  const fill = (<Rect width={w} height={86} radius={10} fill={C.accent} opacity={0} />) as Rect;
  const txt = (<Txt text="" fontFamily={MONO} fontWeight={800} fontSize={40} fill={C.text} />) as Txt;
  const node = (<Node x={x} y={y}>{fill}{rect}{txt}</Node>) as Node;
  return {node, rect, fill, txt, w, label};
}

function* typeInto(t: Txt, text: string, cps = 30): ThreadGenerator {
  for (let i = 1; i <= text.length; i++) {
    t.text(text.slice(0, i));
    yield* waitFor(1 / cps);
  }
}

export function endCard(o: {y?: number} = {}) {
  const y = o.y ?? 0;
  const bg = grid(0);
  // banner lockup, scaled down and centred near the top
  const L = logo({...LOCKUP.logo});
  const word = wordmark({...LOCKUP.word});
  const tag = tagline({...LOCKUP.tag, opacity: 1});
  L.glow.opacity(0.7);
  const lockup = (<Node scale={0.72} x={-22} y={y - 280} opacity={0}>{L.node}{word}{tag}</Node>) as Node;

  // the three asks, as function calls (it's that kind of channel)
  const like = chip('like()', -560, y - 80);
  const sub = chip('subscribe()', -40, y - 80);
  const sug = chip('suggest(next_topic)', 560, y - 80);
  const check = (<Line points={[[-14, 0], [-4, 10], [16, -12]]} stroke="#ffffff" lineWidth={6} lineCap="round"
                       lineJoin="round" end={0} x={sub.w / 2 - 44} />) as Line;
  sub.node.add(check);
  const cursor = (
    <Line points={[[0, 0], [0, 40], [10, 31], [18, 47], [25, 44], [17, 28], [31, 28]]} closed
          fill={C.text} stroke={C.bg} lineWidth={2} x={260} y={y + 140} opacity={0} />
  ) as Line;
  const node = (<Node>{bg}{lockup}{like.node}{sub.node}{sug.node}{cursor}</Node>) as Node;

  function* drawChip(c: ReturnType<typeof chip>, accent = false): ThreadGenerator {
    c.rect.stroke(accent ? C.accent : C.stroke);
    yield* all(c.rect.end(1, T.base, easeInOutCubic), typeInto(c.txt, c.label, 34));
  }

  return {
    node, lockup, logo: L, chips: {like, sub, sug}, cursor,
    *enter(): ThreadGenerator {
      yield* all(bg.opacity(1, T.slow), lockup.opacity(1, T.slow), lockup.position.y(y - 300, T.slow));
    },
    *like(): ThreadGenerator {
      yield* drawChip(like);
      yield* chain(like.node.scale(1.08, 0.12), like.node.scale(1, 0.2));
      like.rect.stroke(C.accent);
    },
    *subscribe(): ThreadGenerator {
      yield* drawChip(sub, true);
      // the cursor glides in and clicks
      yield* all(cursor.opacity(1, 0.2), cursor.position([sub.node.x() + 30, sub.node.y() + 10], 0.55, easeInOutCubic));
      yield* chain(cursor.scale(0.85, 0.08), cursor.scale(1, 0.1));
      // grow the chip to fit "subscribed()" plus the check mark
      sub.txt.text('subscribed()');
      const w = sub.txt.width() + 120;
      check.x(w / 2 - 40);
      yield* all(
        sub.rect.width(w, 0.2), sub.fill.width(w, 0.2), sub.fill.opacity(1, 0.2), sub.rect.stroke(C.accent, 0.2),
        sub.txt.position.x(-24, 0.2), check.end(1, 0.3),
      );
      yield* cursor.opacity(0, 0.3);
    },
    *suggest(): ThreadGenerator {
      yield* drawChip(sug);
      // a blinking caret inviting a comment
      const caret = (<Rect width={4} height={44} fill={C.accent} x={sug.txt.width() / 2 + 12} />) as Rect;
      sug.node.add(caret);
      yield* sequence(0.5, ...[0, 1, 2].map(() => chain(caret.opacity(0, 0.01), waitFor(0.25), caret.opacity(1, 0.01), waitFor(0.25))));
    },
    /** gentle lid wiggle to keep the hold alive while YouTube's end screen is up */
    *idle(): ThreadGenerator {
      yield* chain(L.lid.rotation(L.open.r - 4, 0.6, easeInOutCubic), L.lid.rotation(L.open.r, 0.6, easeOutBack));
    },
  };
}
