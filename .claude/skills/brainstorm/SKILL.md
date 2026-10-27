---
name: brainstorm
description: Brainstorm 15-20 new video ideas for Under the Abstraction (VIDEO_BRIEF §2 formats + topic test) and append them to ideas/backlog.json. Use when the user wants video ideas or topics. Optional argument is a focus area, e.g. "databases" or "networking".
---

# Brainstorm video ideas

Focus (may be empty): $ARGUMENTS

1. Read `docs/VIDEO_BRIEF.md` §2 (what gets clicked, winning/losing formats, topic
   test) and §3.1–3.3 (audience, the problem chain, hooks).
2. Read `ideas/backlog.json` (if it exists) and the `title` of every `videos/*/video.json`
   so you don't repeat ideas that already exist, were picked, or were rejected.
   Rejected ideas tell you what the user doesn't want; steer away from similar ones.
3. If a focus is given, at least two thirds of the ideas must be within it.
4. Produce **15–20 ideas**. Each must:
   - use one of the winning formats (finally-make-sense / why-is-X-so-Y / A-vs-B / under-the-hood),
   - name ONE core idea in a single sentence (the thing the whole chain hangs off),
   - open with a concrete situation or a mundane-made-mysterious hook (VIDEO_BRIEF §3.3),
   - have one running example and a draft problem chain of 5–9 "problem → fix" links,
     each fix creating the next problem (VIDEO_BRIEF §3.2),
   - honestly pass all 5 topic-test checks (drop ideas that don't).
   Prefer tools devs touch daily but can't explain. Mix difficulty and domains.
   Be technically accurate; mark doubtful claims with `[VERIFY]`.
5. Append them to `ideas/backlog.json` (create it if missing) without touching existing entries.
   The file is `{"ideas": [...]}`; each new idea is:

```json
{
  "id": "short-kebab-id-unique",
  "batch": "YYYY-MM-DD focus-or-general",
  "title": "Kafka will finally make sense after this video",
  "format": "finally-make-sense | why-is | vs | under-the-hood",
  "topic": "Kafka",
  "aha": "the core idea, one sentence",
  "pain": "the opening scenario or hook",
  "example": "the running example, one line",
  "chain": ["problem → fix", "..."],
  "visual": "the main diagram in boxes/arrows/numbers",
  "score": 1-10,
  "why": "one line: why this will get clicked",
  "status": "new"
}
```

   `score` is your honest click-potential estimate using the §2 view data.
6. Validate the file parses as JSON (`node -e "JSON.parse(require('fs').readFileSync('ideas/backlog.json','utf8'))"`).
7. Reply with a compact table of the new ideas (title, format, score) sorted by score,
   and recommend your top 3 in one line each.
