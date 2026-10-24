# Brief: Postgres never updates a row. Here's what it does instead

> VIDEO_BRIEF.md §0 for this video. Claude reads this together with
> `docs/VIDEO_BRIEF.md` at every stage. Fill in what you know; Claude fills the rest
> when it writes the script and you can correct it during review.

- **Topic:** PostgreSQL MVCC and VACUUM
- **Target length (minutes):** 7–9
- **Target audience level:** beginner + intermediate
- **The ONE "aha" insight viewers should leave with:** An UPDATE in Postgres writes a brand-new copy of the row and marks the old one dead, which is how readers never block writers and why the table grows.
- **The real-world pain that opens the video:** You deleted half a table and the disk usage didn't go down, or someone said 'you need to vacuum'.
- **What viewers probably already know:**
- **3–5 things they probably don't know yet:**
- **Title format:** under-the-hood
- **Notes / things to include or avoid:** Didn't-know candidates: UPDATE is effectively INSERT a new version + mark the old one expired | Each row version carries the transaction IDs that created and expired it | DELETE doesn't free disk space; VACUUM marks the space reusable, and only VACUUM FULL shrinks the file | Two queries running at the same moment can see different versions of the same row | Transaction IDs are 32-bit, and if they wrap without vacuuming Postgres stops accepting writes  
Core visual: A table page with stacked row versions stamped with xmin/xmax numbers; two reader boxes with snapshot glasses seeing different rows  
Device: Row version stamps: CREATED BY tx / DELETED BY tx
