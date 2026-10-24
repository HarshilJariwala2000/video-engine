// Channel brand in code: the "lifted lid" logo, the wordmark, the grid
// background, and the banner lockup (docs/YouTube banner). Shared by every
// intro and the end card, so the brand looks identical in every video.
//
// Logo anatomy (from docs/A Lifted lid@2x.png, 1600 px artboard):
//   box   open-top dashed U, accent, 840 × 600, stroke 32, dash 64 / gap 30
//   core  solid accent rounded square 280 × 240, slightly below box centre
//   lid   light bar 920 × 95, hinged at its left end; open = tilted −9° and raised
import '@fontsource/jetbrains-mono/400.css';
import '@fontsource/jetbrains-mono/800.css';
import {Line, Node, Rect, Txt} from '@motion-canvas/2d';
import {all, easeInOutCubic, easeOutBack, ThreadGenerator} from '@motion-canvas/core';
import brand from '../brand/brand.json';
import {C, MONO} from './theme';

export const BRAND = brand as {
  defaultIntro: string; name: string; tagline: string;
  intros: Record<string, {title: string; duration: number; music: string; beats: Record<string, any>}>;
  outro: {bed: string; bedGainDb: number; endScreenHold: number; cta: string};
};
export const LID = '#e6e6e6';
const GLOW = 'rgba(139,124,246,0.75)';

/** Faint 48 px grid like the banner, fading toward the edges. */
export function grid(opacity = 0) {
  const lines: Line[] = [];
  for (let x = -960; x <= 960; x += 48) lines.push(<Line points={[[x, -540], [x, 540]]} stroke="#ffffff" lineWidth={1} /> as Line);
  for (let y = -528; y <= 540; y += 48) lines.push(<Line points={[[-960, y], [960, y]]} stroke="#ffffff" lineWidth={1} /> as Line);
  return (<Node opacity={opacity}><Node opacity={0.045}>{lines}</Node></Node>) as Node;
}

export interface Logo {
  node: Node; box: Line; core: Rect; lid: Rect; glow: Rect;
  /** lid positions in logo space */
  closed: {x: number; y: number; r: number}; open: {x: number; y: number; r: number};
  k: number; w: number; h: number;
  openLid(d?: number): ThreadGenerator; closeLid(d?: number): ThreadGenerator;
}

/**
 * The logo, `width` = box width in px. Everything starts invisible except what
 * you ask for; animate the returned parts.
 */
export function logo(o: {x?: number; y?: number; width?: number; lid?: 'open' | 'closed' | 'hidden'; visible?: boolean} = {}): Logo {
  const k = (o.width ?? 300) / 840;
  const w = 840 * k, h = 600 * k;
  const closed = {x: -460 * k, y: -h / 2 - 48 * k, r: 0};
  const open = {x: -455 * k, y: -h / 2 - 125 * k, r: -9};
  const lidAt = o.lid === 'closed' ? closed : open;
  const v = o.visible === false ? 0 : 1;

  // dark shape casting a violet shadow = light spilling out around the box (as in the logo)
  const glow = (<Rect width={w * 0.96} height={h * 0.9} y={h * 0.06} radius={44 * k} fill={C.bg}
                      opacity={0} shadowColor={GLOW} shadowBlur={170 * k} />) as Rect;
  const box = (
    <Line points={[[-w / 2, -h / 2], [-w / 2, h / 2], [w / 2, h / 2], [w / 2, -h / 2]]}
          stroke={C.accent} lineWidth={32 * k} lineDash={[64 * k, 30 * k]} radius={44 * k}
          shadowColor={GLOW} shadowBlur={40 * k} opacity={v} />
  ) as Line;
  const core = (<Rect width={280 * k} height={240 * k} y={20 * k} radius={40 * k} fill={C.accent} opacity={v} />) as Rect;
  const lid = (<Rect width={920 * k} height={95 * k} radius={28 * k} fill={LID} offsetX={-1}
                     x={lidAt.x} y={lidAt.y} rotation={lidAt.r} opacity={o.lid === 'hidden' ? 0 : v} />) as Rect;
  const node = (<Node x={o.x ?? 0} y={o.y ?? 0}>{glow}{box}{core}{lid}</Node>) as Node;

  return {
    node, box, core, lid, glow, closed, open, k, w, h,
    *openLid(d = 0.5) {
      yield* all(lid.position([open.x, open.y], d, easeOutBack), lid.rotation(open.r, d, easeOutBack));
    },
    *closeLid(d = 0.4) {
      yield* all(lid.position([closed.x, closed.y], d, easeInOutCubic), lid.rotation(closed.r, d, easeInOutCubic));
    },
  };
}

export function wordmark(o: {x?: number; y?: number; size?: number; text?: string; opacity?: number} = {}) {
  return (<Txt text={o.text ?? BRAND.name} fontFamily={MONO} fontWeight={800} fontSize={o.size ?? 92}
               fill={C.text} letterSpacing={-1} offsetX={-1} x={o.x ?? 0} y={o.y ?? 0} opacity={o.opacity ?? 1} />) as Txt;
}

export function tagline(o: {x?: number; y?: number; size?: number; opacity?: number} = {}) {
  return (<Txt text={BRAND.tagline} fontFamily={MONO} fontSize={o.size ?? 40} fill="#a3a3a3"
               offsetX={-1} x={o.x ?? 0} y={o.y ?? 0} opacity={o.opacity ?? 0} />) as Txt;
}

/**
 * Banner layout: logo on the left, wordmark + tagline on the right, centred as a group.
 * Positions are what every intro animates *towards*, so all three end on the same frame.
 */
export const LOCKUP = {logo: {x: -590, y: -12, width: 210}, word: {x: -400, y: -26}, tag: {x: -398, y: 60}};
