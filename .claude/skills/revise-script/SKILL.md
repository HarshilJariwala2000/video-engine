---
name: revise-script
description: Apply the user's latest script review (per-scene comments + general notes stored in videos/<video>/video.json) to narration/script.mjs, snapshot the previous version, and return the video to review. Argument is the video folder or its number.
---

# Revise a script from review feedback

Video: $ARGUMENTS

1. Read `videos/<video>/video.json`. The last entry of `reviews` with
   `"decision": "changes"` and no `"addressed": true` is the one to apply. It has
   `version`, `general` (free text) and `comments: [{scene, quote?, text}]`.
   (`quote` is the narration excerpt the user highlighted, if any.)
   If there is no such review, stop and say so.
2. Read `docs/VIDEO_BRIEF.md`, `videos/<video>/brief.md` and the current `narration/script.mjs`.
3. Snapshot: copy `narration/script.mjs` to `narration/history/script.v<scriptVersion>.mjs`.
4. Apply **every** comment. The user's comments override the brief. If a comment
   is ambiguous, make the most reasonable interpretation and note it in your reply.
   Keep the narrator's voice (VIDEO_BRIEF §3.6): rewritten lines must sound like the
   same person, keep the personified system and callbacks consistent, and must not
   reintroduce §3.7 tells. If the user asks for "more personality", run the
   write-script skill's voice pass on the whole script.
   After local edits, re-check story-level rules: connection test between all
   neighbouring scenes, one new term per scene, callbacks still match, cue/visual
   bullets still line up, scene ids still consecutive (renumber if you add/remove
   scenes and update `term`/`didntKnow`/`terms` scene references).
5. `npm run script <video>` and `npm run voice:estimate <video>`; fix any error.
6. In video.json: bump `scriptVersion`, and on the review you applied set
   `"addressed": true` and `"addressedIn": <new version>` (edit the JSON carefully; keep everything else).
7. `npm run stage <video> review "Script v<N> addresses review of v<M>"`.
8. Reply with a short changelog: one line per comment saying what you changed
   (or why you interpreted it a certain way), then the new length estimate.
