// Channel identity (VIDEO_BRIEF §5). Shared by every video: change ACCENT once
// here and every video follows.
export const C = {
  bg: '#141414',
  stroke: '#5a5a5a', // outlines (was #3a3a3a: ~1.6:1 on bg, vanished at 360p/480p)
  dim: '#8a8a8a',    // secondary text (was #666666: ~3.2:1)
  text: '#e6e6e6',
  label: '#bbbbbb',
  accent: '#8b7cf6', // the ONE accent color
  bad: '#ef4444',
  good: '#22c55e',
};
export const MONO = 'JetBrains Mono';
export const SANS = 'Inter';
/** Transition lengths (s). Brief: 0.3–0.8 s, easeInOut (Motion Canvas default). */
export const T = {fast: 0.3, base: 0.5, slow: 0.8};
export const DIM = 0.3; // opacity for "not the thing we're talking about"

/**
 * Line widths (px at 1080p). YouTube's 360p preset shrinks the frame 3×, so
 * nothing structural may be thinner than `fine`. Use these instead of numbers.
 */
export const W = {
  main: 4,  // containers: frames, table pages, terminals, panels
  line: 3,  // boxes, rows, fields, chips, arrows, dashed walls
  fine: 2,  // small details only (progress bars, tick lines)
};
/** Minimum font sizes (px at 1080p) so labels survive 360p/480p. */
export const FS = {
  label: 26, // grey labels/tags on frames and diagrams ("table page", "status list", "xmin")
  small: 24, // secondary annotations under/next to things
  tiny: 18,  // absolute minimum, only where space forces it (field captions like CREATED BY)
};
