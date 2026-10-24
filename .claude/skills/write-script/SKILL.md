---
name: write-script
description: Write the full narration script for one video (VIDEO_BRIEF §3-4) as videos/<video>/narration/script.mjs, generate SCRIPT.md, and move the video to the review stage. Argument is the video folder (e.g. 002-redis) or its number.
---

# Write the script for a video

Video: $ARGUMENTS (resolve a number prefix like `002` to the folder in `videos/`).

## Read first
1. `docs/VIDEO_BRIEF.md`, all of it. §3 (script rules) and §4 (scene format) are binding.
2. `videos/<video>/brief.md` and `video.json` (the `idea` field may hold the brainstorm card).
3. `videos/001-docker/narration/script.mjs`: the reference for quality, pacing,
   cue density and the file format. Match its craft, not its topic.

## Research
Verify every technical claim you're unsure of (official docs via WebSearch/WebFetch).
Anything still uncertain or version-specific goes in `meta.verify`.

## Find the voice before the outline
Read VIDEO_BRIEF §3.6–3.7 again, and skim two transcripts in `transcripts/`
to hear what a human, opinionated explainer sounds like (techniques only; never
borrow their lines, catchphrases or characters). Decide, in one line each:
- **Stance:** the opinion this video argues (`meta.stance`). Use the brief's "My take" if given.
- **The character:** how the main system is personified (follows from how it really works).
- **The person:** the named colleague/skeptic who carries the hook line.
- **Handles:** 1–2 coined names you'll reuse as callbacks.
- **The real story:** one verifiable incident or design decision (research it now).
- **The concession + comparison:** where this design loses, and who does it differently.

## Outline before prose (think it through, don't output it separately)
Hook pain → mystery + promise → requirements device (3–5 items) → naive approach
and exactly where it fails → the better question → 4–6 concepts (each answers the
previous scene's question and checks a requirement; one new term max per scene) →
aha sentence → payoff that replays the hook → proof/outro.
Place 3–5 "didn't know that" moments through the middle, not at the end.
Run the connection test: "but / so / because" must fit between every pair of scenes.

## Write `videos/<video>/narration/script.mjs`
Use the format in CLAUDE.md ("narration/script.mjs format"); fill every meta field:
title (best of the 5), aha, audience, hook, device, checklist, terms (with the
plain meaning used in narration), didntKnow, verify, titles (5), thumbnails (5),
thumbnailLayout, description, tags (10).

Narration rules that matter most:
- ~140 spoken words per minute; target the brief's length (default 7–9 min ≈ 1,000–1,250 words).
  A scene is usually 12–30 s (30–70 words). Personality is not padding: cut a flat
  sentence before cutting a joke that teaches.
- Spoken sentences with varied rhythm (§3.5): mostly 8–20 words, plus short punches and
  the odd long run. "I" and "you". Concrete numbers, one idea each.
- Every explanatory sentence showable. Plain meaning first, then the name.
- TTS-friendly: write numbers/symbols as they should be said, no parentheses,
  slashes, ellipses, or em-dash asides. Avoid starting a scene with a lone "So,".
- Put `{cue}` markers before the word where each VISUAL bullet begins; aim for a
  cue every 2–5 seconds of speech. `visual` has one bullet per cue, in order, saying
  concretely what appears (shapes, labels, colors, which element is accent).
- Callbacks: the payoff and at least one mid-video scene reuse the hook's exact visual and words.
- `handsOff` on every scene but the last.
- **Channel intro + standard ending (VIDEO_BRIEF §3.4):** insert `{id: 'intro', intro: 'default'}`
  right after the hook scene(s), where the hook's question has landed. End with a SUMMARY scene
  (label `TO SUMMARISE`, `bed: true`, opens "To summarise everything.", 3–5 point cues + `{aha}`)
  and an END CARD scene (label `END`, `endCard: true`) whose text is exactly brand.json `outro.cta`
  with cues `{like}` `{sub}` `{next}`. Put the specific viewer question before the summary.

## Voice pass (after the draft, before finishing)
Re-read the whole narration out loud in your head as the narrator and fix:
1. The first two sentences take a stance. The last scene has callback + aphorism + specific question.
2. Count: personified system recurs ≥ 3 times; coined handle used ≥ 2 times; named person
   appears at hook and payoff; ≥ 2 voiced objections; 1 real story; 1 concession; 1 comparison;
   3–5 humor beats with none inside the core mechanism; exactly one "under the abstraction" moment.
3. Search for every phrase in §3.7 and rewrite each hit. No "Box N fails" narration.
4. Rhythm: no run of four same-length sentences; no scene where every sentence is under 10 words.
5. Delete any joke that a beginner would need to pause to get.

If `narration/script.mjs` already exists (re-write requested), first copy it to
`narration/history/script.v<N>.mjs` where N is the current `scriptVersion` in video.json.

## Finish
1. `npm run script <video>` (regenerates SCRIPT.md) and `npm run voice:estimate <video>`
   (proves cues parse; gives a length estimate). Fix any error.
2. Update video.json: set `scriptVersion` to previous+1 (1 if new), and keep other fields.
3. `npm run stage <video> review "Script v<N> written"`.
4. Reply with: the title, the aha, total words and estimated length, the scene table
   (number | label | seconds | words), the "didn't know that" list, and the [VERIFY] list.
   End by asking the user to review it in the Studio.
