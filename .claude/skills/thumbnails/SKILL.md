---
name: thumbnails
description: Design 3-4 YouTube thumbnail variants for a video as HTML (shared/thumbnail/base.css kit, VIDEO_BRIEF §8) and render them to 1280x720 PNGs. Argument is the video folder or its number, optionally followed by notes like "more contrast on #2".
---

# Thumbnails for a video

Arguments: $ARGUMENTS (first word = video; the rest = optional notes from the user).

1. Read `docs/VIDEO_BRIEF.md` §2 (titles) and §8 (thumbnail rules), the video's
   `narration/script.mjs` meta (`titles`, `thumbnails`, `thumbnailLayout`, `aha`), and
   `shared/thumbnail/base.css` (the kit).
2. Look at the pilot's examples: `videos/001-docker/thumbnails/thumb-*.html` and `preview.png`.
3. Design **4 variants** (3 if the user asks), each a different idea, not a recolor:
   e.g. (a) hero logo/icon + 2–3 word headline, (b) the video's own key visual
   (a box/wall/diagram from the animation) + headline, (c) a tension or contrast
   ("A vs B", a struck-through misconception), (d) a question or surprising number.
   Each pairs with one of `meta.titles`. Write that pairing in an HTML comment.
4. Rules (§8): dark `#141414` background (grid/noise allowed), ONE big recognizable
   icon with soft accent glow, 2–4 words max, uppercase, one accent word max,
   text complements the title (never repeats it), readable at phone size
   (headline ≥ 110 px tall letters; nothing important near the bottom-right corner
   where YouTube puts the duration badge).
5. Logos/icons: draw them as inline SVG (simple, recognizable shapes). If the user put
   an official logo in `assets/logos/`, use it via a relative `<img>`.
6. Write `videos/<video>/thumbnails/thumb-1.html … thumb-4.html`. Each links
   `../../../shared/thumbnail/base.css` and draws inside `<main class="thumb">`.
   If thumbnails already exist and the user gave notes, revise rather than replace
   unless they asked for new ideas.
7. `npm run thumbs <video>`, then **look at** `thumbnails/preview.png` (phone size) and
   each `thumb-N.png` with the Read tool. Fix anything cramped, illegible, clipped,
   or off-brand, and re-render. Iterate until all four pass §8 at phone size.
8. `npm run stage <video> thumbnails "Thumbnails v<N> rendered"` (stage stays `thumbnails`
   until the user picks one in the Studio).
9. Reply with one line per variant: text, idea, paired title.
