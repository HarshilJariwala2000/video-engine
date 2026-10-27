# Under the Abstraction: video studio

Production repo for the YouTube channel *Under the Abstraction*: minimal,
code-animated explainers of programming and infrastructure concepts.
**`docs/VIDEO_BRIEF.md` is the channel rulebook. Read it before any creative
work and follow it unless the video's brief or the user overrides it.**
Scripts are a chain of problems, each fix creating the next one (§3.2), told in a
calm, practical voice (§3.5) with nothing from §3.8. `ideal_scripts/` holds the five
reference scripts for this style (study them, never copy lines). `transcripts/` is
from an older style and is no longer a reference.

## Layout

```
docs/VIDEO_BRIEF.md        channel rules: story, script format, visual style, thumbnails
ideal_scripts/             reference scripts for the script style (VIDEO_BRIEF §3)
ideas/backlog.json         brainstormed ideas (written by /brainstorm, read by the Studio)
videos/NNN-name/           one folder per video
  video.json               workflow state: stage, reviews, history (Studio reads/writes it)
  brief.md                 VIDEO_BRIEF §0 for this video
  narration/script.mjs     THE source of truth: meta + scenes (narration with {cue} markers)
  narration/history/       snapshots of earlier script versions (script.v1.mjs, …)
  SCRIPT.md                generated from script.mjs (npm run script <video>)
  src/project.ts           auto-loads src/scenes/scene*.tsx in order (don't edit)
  src/scenes/sceneNN.tsx   one Motion Canvas scene per narration scene
  src/lib/                 video-local: figures.tsx (shared diagrams, the running example),
                           sync/ui/theme shims that re-export @shared/*
  src/timings.json         generated: scene durations, cue times, captions
  audio/                   generated voiceover, captions.srt, chapters.txt
  thumbnails/thumb-N.html  thumbnail designs → thumb-N.png (npm run thumbs <video>)
  shorts.json              3 Shorts cut from the render (clips, hook titles, views)
  shorts/short-N.mp4       1080×1920 Shorts (npm run shorts <video>)
shared/motion/             channel-wide Motion Canvas library, imported as @shared/*
  theme.ts ui.tsx sync.tsx checklist.tsx
  brand.tsx                logo / wordmark / tagline / grid / LOCKUP (the channel brand in code)
  intros/introA|B|C.tsx    the three channel intros (scenes; no per-video code)
  outro.tsx                summary() + endCard() for the standard ending
shared/brand/brand.json    defaultIntro, intro beat times, outro CTA + music bed settings
shared/brand/music/        composed cues (npm run music): intro-a|b|c, outro-bed (+ -24k mono)
shared/thumbnail/base.css  thumbnail kit (fonts, grid/noise, glow, headline, box, chip)
templates/video/           what `npm run new` copies
tools/                     CLI (see below); tools/music/compose.py writes the music
showcase/_demo             demo video (hook → intro → summary → end card) rendered by npm run showcase
tts/                       local voice server: Chatterbox + Whisper alignment (Python, uv)
voice/                     the channel voice: reference.wav + voice.json (+ voicelab output)
studio/                    the web UI for the workflow (npm run studio → localhost:7860)
```

`videos/001-docker` is the pilot and the **reference implementation**: when
writing scenes, figures or thumbnails, read how it does things first.

## Workflow (stages in video.json)

| Stage | Who | What happens |
|---|---|---|
| (ideas) | Claude `/brainstorm` | 15–20 ideas appended to `ideas/backlog.json` |
| `script` | Claude `/write-script <video>` | writes `narration/script.mjs` + SCRIPT.md → stage `review` |
| `review` | **User** in the Studio | comments per scene → "Request changes" or "Approve" |
| `review` (changes) | Claude `/revise-script <video>` | applies the latest review, bumps version |
| `voice` | Studio button / `npm run voice <video>` | real audio + timings → stage `code` |
| `code` | Claude `/build-video <video>` | writes scenes until `npm run check <video>` passes → stage `thumbnails` |
| `thumbnails` | Claude `/thumbnails <video>` | 3–4 designs rendered to PNG; user picks one → stage `publish` |
| (shorts) | Claude `/shorts <video>` (Studio: Shorts tab) | after the final render: 3 Shorts picked, framed and rendered → `shorts/short-N.mp4` |
| `publish` | User | render in the editor, upload with description/chapters/captions |

Never skip the review gate: do not write animation code for a script whose
latest review is not `approved` unless the user explicitly says so.

## Commands (run from the repo root; `<video>` = folder name or its number prefix)

```
npm run studio                    workflow UI (http://localhost:7860)
npm run new <name> -- --title "…" scaffold videos/NNN-name
npm run script <video>            regenerate SCRIPT.md from narration/script.mjs
npm run voice:estimate <video>    timings without TTS (fast preview, word-count based)
npm run tts                       start the local voice server (needed for npm run voice)
npm run voice <video>             real voiceover (cached per scene; --only sceneNN to re-roll;
                                  --provider local|elevenlabs picks the engine, default TTS_PROVIDER)
npm run edit <video>              Motion Canvas editor (localhost:9000) for that video
npm run check <video>             typecheck + headless editor load + audio/animation length check
npm run thumbs <video>            render thumbnails/thumb-N.html → PNG + preview.png (phone size)
npm run shorts <video>            cut shorts.json clips from output/project.mp4 → shorts/short-N.mp4 (--only N)
npm run stage <video> <stage> "message"   move the workflow stage, logged in video.json
npm run typecheck                 all videos + shared lib
npm run music                     re-compose intro/outro music from brand.json beats
npm run showcase [-- B]           render demo videos with each intro → showcase/output/intro-X.mp4
```

## narration/script.mjs format

```js
export const meta = {
  title, aha, audience, hook, example, stance,  // strings: aha = the core idea, example = the running example,
                                                // stance = the practical take (VIDEO_BRIEF §3.5)
  chain: ['problem → fix', ...],                // the problem chain, one line per link (VIDEO_BRIEF §3.2)
  verify: ['…'],                                // [VERIFY] items, plain strings
  titles: [5], thumbnails: [5], thumbnailLayout, description, tags: [10],
};
export const scenes = [
  {id: 'scene01', label: 'FIVE SERVICES', title: 'One order, five reactions',
   text: "{app}Let's say you're running a web application. {services}Behind it…",
   visual: ['APP box with five service boxes behind it', …],   // one bullet per {cue}
   leaves: 'how do the other services find out about the order?'},   // open problem for the next scene
  // …more hook scenes if needed…
  {id: 'intro', intro: 'default'},              // channel intro right after the hook (music only)
  // …the chain…, then the standard ending:
  {id: 'scene21', label: 'TO SUMMARISE', title: 'Summary', bed: true,
   text: "{sum}To summarise everything. {p1}… {p2}… {aha}…", visual: [...]},
  {id: 'scene22', label: 'END', title: 'End card', endCard: true,
   text: "{like}If you liked the video, drop a like {sub}and subscribe, {next}and tell me what topics you want to see next.",
   visual: ['like()', 'subscribe() + click', 'suggest(next_topic)']},
];
```

- `text` is spoken verbatim by the TTS. `{cue}` markers sit right before the word
  where a VISUAL bullet starts; they're stripped before speech. Cue names are
  `\w+` and unique within a scene. Moving a cue later costs no TTS time.
- Scene ids are `sceneNN`, consecutive, and match `src/scenes/sceneNN.tsx`. The intro entry has id
  `intro` and no text/visual; it's not counted in the numbering.
- `bed: true` mixes the outro music under that scene and all after it; `endCard: true` also
  holds the scene for brand.json `outro.endScreenHold` s. Videos made before the intro/outro kit
  (001, 002) have their own project.ts and scripts; leave them as they are.
- Scripts written before the problem-chain format (001–003, 005) use old fields (`checklist`,
  `didntKnow`, `terms`, per-scene `term`/`handsOff`/`checklist`). The tools and Studio still
  render them; don't add those fields to new scripts.

## Motion Canvas conventions

- Summary scene: `summary(points)` → `reveal(i)` per point cue, `aha(text)`; end card: `endCard()` →
  `enter()`, `like()`, `subscribe()`, `suggest()`, `idle()` (both from `@shared/outro`; see showcase/_demo).
- Every scene: `const s = setup(view, 'sceneNN', 'LABEL')`, put content in
  `s.stage`, wait on words with `yield* s.at('cue')`, finish with `yield* s.end()`.
  Persistent overlays (the old checklist) are added to `view`, not `s.stage`.
- Use the factories in `@shared/ui` (box, frame, arrow, wall, terminal, code,
  meter, termCard, mono, sans, fadeIn, draw, swap…) and colors from `@shared/theme`.
  Add a new factory to shared/motion/ui.tsx only if it's channel-generic;
  video-specific diagrams go in the video's `src/lib/figures.tsx`.
- Line widths and label sizes come from `W` / `FS` in `@shared/theme` (`W.main` 4, `W.line` 3, `W.fine` 2;
  `FS.label` 26, `FS.small` 24, `FS.tiny` 18). Never hard-code thinner/smaller values: they vanish at 360p.
- An animation must finish before the next cue's word and before the scene's
  audio ends; `npm run check` fails otherwise.
- Changing anything in `shared/` affects every video: run `npm run typecheck` after.

## Voice

- Local TTS (default): `npm run tts` starts tts/server.py on :7861. First start
  downloads Chatterbox (~3 GB) and Whisper small.en. Only one GPU job at a time.
- `voice/voice.json` + `voice/reference.wav` define the narrator for every video.
  Don't change them per video. The voice lab (`npm run voice:test`) compares
  candidate settings against the pilot's ElevenLabs audio.
- Don't run `npm run voice` while the voice lab is running (8 GB VRAM).

## Environment notes

- Windows; Node 25; Python 3.11 venv in tts/.venv managed by uv.
- GPU: RTX 5060 Laptop 8 GB (Blackwell, sm_120) → needs torch ≥ 2.7 with CUDA 12.8
  (pinned to 2.8.0+cu128 via uv override in tts/pyproject.toml).
- Thumbnails and `npm run check` drive the installed Edge via playwright-core.
