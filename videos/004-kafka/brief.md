# Brief: Kafka will finally make sense after this video

> VIDEO_BRIEF.md §0 for this video. Claude reads this together with
> `docs/VIDEO_BRIEF.md` at every stage. Fill in what you know; Claude fills the rest
> when it writes the script and you can correct it during review.

- **Topic:** Kafka
- **Target length (minutes):** 7–9
- **Target audience level:** beginner + intermediate
- **The ONE "aha" insight viewers should leave with:** Kafka isn't a queue, it's an append-only log file, and each consumer just keeps a bookmark of how far it has read.
- **The real-world pain that opens the video:** Your team adopted Kafka, and you're nodding along to 'partitions', 'offsets' and 'consumer groups' without knowing what they are.
- **What viewers probably already know:**
- **3–5 things they probably don't know yet:**
- **My take (the opinion this video argues):**
- **Title format:** finally-make-sense
- **Notes / things to include or avoid:** Didn't-know candidates: Reading a message doesn't remove it; messages are deleted by age or size, read or not | Order is only guaranteed within one partition, not across a topic | A consumer group can't have more active consumers than partitions; the extra ones sit idle | You can replay the past by moving your offset back | A message's key decides its partition, which is how 'all events for user 42 stay in order' works  
Core visual: A long tape of numbered cells (the log) with bookmark arrows for each consumer; topic = several tapes side by side  
Device: Bookmark arrows labelled with offset numbers that move along the log
