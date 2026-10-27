---
name: write-script
description: Write the full narration script for one video (VIDEO_BRIEF §3-4) as videos/<video>/narration/script.mjs, generate SCRIPT.md, and move the video to the review stage. Argument is the video folder (e.g. 002-redis) or its number.
---

# Write the script for a video

Video: $ARGUMENTS (resolve a number prefix like `002` to the folder in `videos/`).

## Read first
1. `docs/VIDEO_BRIEF.md`, all of it. §3 (script rules) and §4 (scene format) are binding.
2. `videos/<video>/brief.md` and `video.json` (the `idea` field may hold the brainstorm card).
3. **All five scripts in `ideal_scripts/`.** They are the style reference: how the problem
   chain turns, how a running example is walked through a mechanism, how numbers and
   questions are used, how plain the voice is. Strip the timestamps and read them as prose.
   Learn the craft; never copy a line, even when the topic overlaps (there is a Kafka one).
   Kafka, Nginx and Face ID are the best voice references; text rendering and UUID are
   good structure but slightly too hyped.

Older videos (001–003, 005) were written under a previous format (checklists,
personified systems, named colleagues, humour quotas). Don't use them as script references.

## Research
Verify every technical claim you're unsure of (official docs via WebSearch/WebFetch).
Go deep enough to name the real mechanism (system calls, data structures, the actual
algorithm, version changes). Anything still uncertain or version-specific goes in `meta.verify`.

## Build the chain before writing prose (think it through, don't output it separately)
1. **Core idea:** the one sentence everything hangs off (`meta.aha`).
2. **Organising frame:** scaling story, attacker, layered fix, or decision (VIDEO_BRIEF §3.2).
3. **Opening scenario** and hook shape (§3.3) (`meta.hook`).
4. **Running example:** one concrete thing followed the whole way (`meta.example`).
5. **The chain:** 5–9 links, each "problem → fix" (`meta.chain`). For each link check:
   - the viewer feels the problem before the fix appears,
   - the fix's cost or limit is the next link's problem,
   - there's a concrete number or a step-by-step trace of the running example,
   - the core idea needs it (cut it otherwise).
6. Where the tool first appears: as the answer to a problem, never as the topic.
7. The practical take (`meta.stance`): when to use it, when not to, the gotcha people hit.
8. At least two "you're probably thinking…" moments, and at most one deliberate
   "let me say that again" wow moment.

## Write `videos/<video>/narration/script.mjs`

```js
export const meta = {
  title: '…',                      // best of the 5
  aha: '…',                        // the core idea, one sentence
  audience: 'beginner + intermediate devs who …',
  hook: '…',                       // the opening scenario
  example: '…',                    // the running example
  stance: '…',                     // the practical take
  chain: ['direct calls tangle and cascade → a log in the middle', '…'],
  verify: ['…'],
  titles: [/* 5 */], thumbnails: [/* 5 */], thumbnailLayout: '…',
  description: '…', tags: [/* 10 */],
};
export const scenes = [
  {id: 'scene01', label: 'FIVE SERVICES', title: 'One order, five reactions',
   text: "{app}Let's say you're running …",
   visual: ['…'],                  // one bullet per {cue}, in order
   leaves: 'how do the other four find out?'},
  // …more hook scenes if needed, then:
  {id: 'intro', intro: 'default'},
  // …the chain…
  {id: 'sceneNN', label: 'TO SUMMARISE', title: 'Summary', bed: true,
   text: "{sum}To summarise everything. {p1}… {p2}… {aha}…", visual: ['…']},
  {id: 'sceneNN', label: 'END', title: 'End card', endCard: true,
   text: "{like}If you liked the video, drop a like {sub}and subscribe, {next}and tell me what topics you want to see next.",
   visual: ['like()', 'subscribe() + click', 'suggest(next_topic)']},
];
```

Rules that matter most:
- Scene ids `sceneNN`, consecutive; the intro entry isn't counted. One scene = one link
  (or one step of a walk-through) = one visual change, usually 15–40 s (35–90 words).
- `leaves` on every scene except summary and end card: the open problem or question
  the next scene answers. If you can't write one, the chain is broken there.
- Length follows the chain: typically 800–1,300 words (~140 wpm). Never pad.
- Plain, calm, spoken sentences (§3.5, §3.7). Connective openers carry the chain
  ("So,", "But,", "Now,", "Let's say…"). Ideas before names; define terms in passing.
- Every explanatory sentence showable. `{cue}` before the word where each VISUAL bullet
  begins, roughly every 2–5 seconds of speech. Visual bullets say concretely what appears
  (shapes, labels, which element is accent, what goes red when it breaks). The running
  example is the main diagram and grows across scenes (§5 "Story on screen").
- TTS-friendly: numbers and symbols written as said, no parentheses, slashes, ellipses
  or em-dash asides.
- **Intro and ending (VIDEO_BRIEF §3.6):** `{id: 'intro', intro: 'default'}` right after the
  hook. SUMMARY scene: label `TO SUMMARISE`, `bed: true`, opens "To summarise everything.",
  2–4 point cues `{p1}`… then `{aha}` with the core idea (decision rule for A-vs-B videos).
  END CARD: label `END`, `endCard: true`, text exactly brand.json `outro.cta` with `{like}` `{sub}` `{next}`.

## Check pass (after the draft, before finishing)
1. Read only the `leaves` lines top to bottom: they should read like the story. Then check
   "but / so / because" fits between every pair of scenes.
2. Is any concept introduced without a problem in front of it? Fix or cut.
3. Is the tool named before the viewer wants it? Move it later.
4. Does every major link have a number or a trace of the running example?
5. Is any term named before the idea is shown?
6. Search for everything in §3.8 and rewrite each hit. Remove hype adjectives.
7. Rhythm: no four same-length sentences in a row; read it aloud in your head once.

If `narration/script.mjs` already exists (re-write requested), first copy it to
`narration/history/script.v<N>.mjs` where N is the current `scriptVersion` in video.json.

## Finish
1. `npm run script <video>` (regenerates SCRIPT.md) and `npm run voice:estimate <video>`
   (proves cues parse; gives a length estimate). Fix any error.
2. Update video.json: set `scriptVersion` to previous+1 (1 if new), and keep other fields.
3. `npm run stage <video> review "Script v<N> written"`.
4. Reply with: the title, the core idea, total words and estimated length, the chain
   (one line per link), the scene table (number | label | seconds | words), and the
   [VERIFY] list. End by asking the user to review it in the Studio.
