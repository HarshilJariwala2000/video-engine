---
name: shorts
description: Pick 3 YouTube Shorts from a finished video, write videos/<video>/shorts.json (clips, hook titles, region-crop views and shots), render them to 1080x1920 with npm run shorts, and check every shot. Argument is the video folder or its number, optionally followed by notes like "#2: start at the crash".
---

# Shorts for a video

Arguments: $ARGUMENTS (first word = video; the rest = optional notes from the user).

Shorts are cut from the final render (`output/project.mp4`) by `tools/shorts.mjs`: each one is a
time range of the video, a hook title, and one or more **views** (a crop of the 1920×1080 frame)
laid out on a 1080×1920 canvas with big captions. Read the header of `tools/shorts.mjs` for the
exact `shorts.json` format.

1. Check `videos/<video>/output/project.mp4` exists. If it doesn't, stop and say the video has to
   be rendered in the editor first.
2. Read `narration/script.mjs` (meta: `aha`, `didntKnow`, `stance`; every scene's text) and
   `src/timings.json` (scene durations and cue times). If `shorts.json` exists and the user gave
   notes, **revise it** instead of starting over.
3. **Pick 3 clips.** Good shorts are the "I didn't know that" moments (`meta.didntKnow`), the
   counter-intuitive reveals and the payoff demo, not the setup. Each one:
   - stands alone: makes sense to someone who never saw the video; no "as we saw earlier"
     depending on something off-screen in the first seconds
   - is 20–58 s; usually one whole scene, or a run of cues inside one or two scenes
   - starts on the first word of a sentence and ends after a punchline (a scene end, or a
     cue + a little tail, e.g. `scene12:finally+3`)
   - doesn't overlap the other two
4. **Hook title** per clip: the surprising claim in ≤ 8 words, in the channel voice
   (VIDEO_BRIEF §3.6, none of the §3.7 AI tells). It complements what's said in the first
   seconds instead of repeating it. Examples: "kubectl apply doesn't start anything",
   "A server dies at 3 a.m. Nobody wakes up." Top-level `kicker` is the topic ("Kubernetes").
5. **Views.** Read the clip's scene files (`src/scenes/sceneNN.tsx`) and `src/lib/figures.tsx`
   for where things are: positions are scene coordinates (origin at the centre, x −960…960,
   y −540…540), the same numbers a view uses: `[centre x, centre y, width]`. The video box is
   1080×840, so a view of width w shows w × 0.78 of height; narrower = bigger on the phone.
   - Frame what the narration is about *right now*, as tight as it reads: one diagram area
     usually fits in 700–1250 px of width.
   - Use `shots` to cut to a new view at the cue where the action moves (e.g. an arrow to the
     notebook appears → wide view). Only go wide (1500–1800) while something really spans the
     frame; cut back in when it's over. 2–4 shots per short; no shot shorter than ~3 s.
   - Leave ≥ 40 px of air around everything in the view; nothing may touch the edges.
   - The section label, corner checklist and small built-in captions are masked automatically.
6. Write `videos/<video>/shorts.json`, then `npm run shorts <video>` (or `-- --only N` while
   fixing one).
7. **Look at** every `shorts/short-N-sheet.png` with the Read tool: one frame per shot, at the
   moment the most is on screen. Fix anything clipped at an edge, too small to read, mostly
   empty, or framing the wrong thing, and re-render that short. Iterate until all three pass.
8. Reply with one line per short: title, clip range and length, and what each shot frames.
