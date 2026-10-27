---
name: build-video
description: Write the Motion Canvas animation code for an approved script, one scene file per narration scene, synced to the generated voice timings, then verify with npm run check. Argument is the video folder or its number.
---

# Build the animation for a video

Video: $ARGUMENTS

## Gate
Read `videos/<video>/video.json`. The latest review must have `"decision": "approved"`
for the current `scriptVersion`. If not, stop and tell the user (unless they said to proceed anyway).
`src/timings.json` should come from real audio (`"estimated": false`). If it's
estimated or empty, say so; you may build against `npm run voice:estimate`, but warn
that cue times will shift once real audio is generated (the code still works
because it waits on cue names, not fixed seconds).

## Study first (don't skip)
1. `docs/VIDEO_BRIEF.md` §5–7 (visual identity, devices, code rules).
2. `shared/motion/ui.tsx`, `sync.tsx`, `checklist.tsx`, `theme.ts`: the toolkit.
3. The pilot `videos/001-docker/src/`: `lib/figures.tsx` and at least scenes 01, 03, 09, 12, 21.
   That is the quality bar: cue-driven reveals, dim-what's-not-discussed,
   continuity between consecutive scenes, callbacks reusing exact figures.
4. This video's `narration/script.mjs` (cues + visual bullets) and `src/timings.json`
   (seconds per cue, scene durations: know how much time each animation has).

## Write
- `src/lib/checklist.tsx`: only for old-format scripts with `meta.checklist`; new scripts have no checklist.
- `src/lib/figures.tsx`: every diagram used by more than one scene (continuity and callbacks).
  The running example (`meta.example`) is the main diagram: build it once here so each link
  of the chain can add to it or zoom into it (VIDEO_BRIEF §5 "Story on screen").
  Factories return nodes created invisible plus handles to animate.
- `src/scenes/sceneNN.tsx` for every scene in script.mjs:
  - `const s = setup(view, 'sceneNN', 'LABEL')`; content into `s.stage`.
  - Show the break before the fix: when narration states a new problem, it gets its own
    visual moment (red error, blocked queue, duplicate) before the fix appears.
  - One `yield* s.at('cue')` block per cue, commented with the narration phrase.
    Implement that cue's VISUAL bullet. Animations 0.3–0.8 s, ease defaults.
    Each block must finish before the next cue's time (check timings.json).
  - Consecutive scenes on the same diagram start from the previous scene's last frame.
  - End with `yield* s.end()` (or `s.end([])` for a hard cut into a continuing diagram).
  - Only the §5 palette; one accent; dim (opacity 0.3) what's not being discussed.
  - Strokes and label sizes only from `W` / `FS` (theme.ts): containers `W.main`, boxes/rows/arrows
    `W.line`, grey labels `FS.label`/`FS.small`, never below `FS.tiny`. Readable at 360p is a requirement.
- The channel intro (`{id: 'intro'}` in script.mjs) needs no code: project.ts pulls it from
  shared/motion/intros. The SUMMARY scene uses `summary()` and the END CARD scene `endCard()`
  from `@shared/outro`; copy the pattern in `showcase/_demo/src/scenes/scene02.tsx` / `scene03.tsx`
  (end card: `enter`, then `like`/`subscribe`/`suggest` on their cues, `idle()` through the hold, `s.end([])`).
- Don't edit `src/project.ts` (it builds the scene order from script.mjs). Video-specific helpers stay in
  the video; only channel-generic factories go into `shared/motion/ui.tsx`.

## Verify (loop until clean)
1. `npm run check <video>`: must print `✔ check passed`. It type-checks, loads the
   project headless, and flags runtime errors, scenes whose animations outlast their
   narration, and length mismatches. Fix and re-run.
2. If you changed `shared/`, run `npm run typecheck` (all videos).
3. `npm run stage <video> thumbnails "Animation code written, check passed"`.

## Reply
List scenes written, any visual bullets you simplified or couldn't implement, and tell
the user to scrub through it with `npm run edit <video>` (or Studio → Open editor).
