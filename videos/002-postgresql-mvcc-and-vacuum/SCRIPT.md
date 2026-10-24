# Postgres never updates a row. Here's what it does instead

**Aha:** Postgres never changes a row. It writes a new version and stamps the old one, so readers never block writers, and the table grows until vacuum cleans up.  
**Audience:** beginner + intermediate  
**Hook pain:** You delete half of a 10 gigabyte table, the disk still says 10 gigabytes, and Sam from infra says "you need to vacuum".  
**Recurring device:** Requirements checklist (we design the database ourselves) + row version stamps: CREATED BY / DELETED BY  
**Length:** 1650 words, 11:05 (measured from elevenlabs audio)

> Generated from `narration/script.mjs`. Edit that file, not this one, then run `npm run script 002-postgresql-mvcc-and-vacuum`.

---

### SCENE 01: Deleted, but still there
LABEL: THE PROBLEM
NARRATION:
"Want to ruin your afternoon? Take an accounts table with 20 million rows. It uses 10 gigabytes of disk. You delete the 10 million closed accounts, and the row count drops to 10 million. Then you check the disk. 10 gigabytes. Not 9. Not even 9 and a half. And Sam from infra leans over and says: you need to vacuum. Which sounds less like database advice and more like something your mom would say."
VISUAL:
- TABLE box "accounts" center with a "20,000,000 rows" counter
- Disk bar below it, full, labeled "10 GB"
- Terminal types "DELETE FROM accounts WHERE closed;" → "DELETE 10000000"
- Row counter ticks 20,000,000 → 10,000,000 in accent
- Accent arrow points at the disk bar
- Disk bar does not move; "10 GB" turns red; "9?" and "9.5?" ghost labels appear and fade
- Chat chip appears bottom-right: "Sam (infra): you need to vacuum."
HANDS OFF TO: "the rows are gone, but their space is still taken" (scene 02)
EST. DURATION: 28.0 s

### SCENE 02: A hoarder
LABEL: THE PROBLEM
NARRATION:
"The rows are gone from every query. But their space is still taken. Now try something even more innocent. Change one column in every row, and the table can almost double in size. My favourite fact about Postgres: it has never updated a row in its life. Postgres is a hoarder. A very organised hoarder. By the end, you'll know exactly what it keeps, and why I think hoarding was the right call."
VISUAL:
- SELECT count returns 10,000,000; the deleted half of the table is empty to queries
- Disk bar still full: the empty half is hatched grey "space still taken"
- Table dims
- Terminal: "UPDATE accounts SET plan = 'pro';"
- Disk bar grows to almost 2× its width, in red
- Text "Postgres has never updated a row" in accent
- Word "hoarder" appears under it; neat stacked boxes icon
- "the right call?" chip: readers vs disk space on a balance
HANDS OFF TO: "let's build the database ourselves" (scene 03), after the channel intro
EST. DURATION: 28.4 s

### CHANNEL INTRO: Lifted Lid (A)
Shared animated intro + music (shared/motion/intros). No narration.
EST. DURATION: 7.0 s

### SCENE 03: The checklist
LABEL: WHAT WE NEED
NEW TERM: none (introduces the checklist device)
NARRATION:
"Let's pretend we're building the database ourselves. Two rows: alice and bob, 100 dollars each. A report is adding up all the money. At the exact same moment, a payment moves 50 dollars from alice to bob. To survive that, our database needs four things. One: readers never wait. Two: writers never wait for readers. Three: every query sees one clean moment, never half a payment. And four: if the payment fails, undo is instant."
VISUAL:
- "let's build it ourselves" appears
- Table zooms to two rows: alice 100, bob 100 (these two rows are the running example)
- REPORT box left with "SUM(balance)" and an arrow to both rows
- PAYMENT box right: "alice −50, bob +50", arrow to both rows in accent
- Checklist panel center
- Row 1 "readers never wait"
- Row 2 "writers don't wait for readers"
- Row 3 "one clean moment"
- Row 4 "instant undo"; then the panel shrinks into the top-right corner and stays
HANDS OFF TO: "the obvious design: overwrite it" (scene 04)
EST. DURATION: 35.2 s

### SCENE 04: Overwrite in place
LABEL: ATTEMPT 1: OVERWRITE
NARRATION:
"The obvious design: when something changes, overwrite it. The report reads alice: 100. Then the payment lands and overwrites both rows. Alice 50, bob 150. Then the report reads bob: 150. Total: 250 dollars. Fifty dollars just appeared out of thin air. Great news for alice and bob. Terrible news for a bank. So much for one clean moment."
VISUAL:
- "overwrite in place" title; the two rows alice 100 / bob 100
- REPORT cursor on alice; "100" collected into a running sum
- PAYMENT arrow hits both rows in accent
- Values flip in place: alice 50, bob 150
- REPORT cursor moves to bob; "150" collected
- Sum shows "250" in red
- "+50 from nowhere" chip
- Checklist box 3 red cross
HANDS OFF TO: "the textbook fix is a lock" (scene 05)
EST. DURATION: 27.1 s

### SCENE 05: The four-way stop
LABEL: ATTEMPT 1: OVERWRITE
NEW TERM: lock = a do not disturb sign
NARRATION:
"The textbook fix is a lock: a do not disturb sign on the rows. While the report reads, the payment waits. While the payment writes, the report waits. Every total comes out clean. But now everyone is politely waiting for everyone else. It's a four-way stop, for data. So much for the first two boxes. And undo means saving the old values somewhere, then copying them back, one row at a time. On a million rows, that's not instant. That's a coffee break."
VISUAL:
- Padlock icon on the two rows
- Term card "lock = do not disturb"
- REPORT holds the lock; PAYMENT greyed with "waiting…" bar
- Swap: PAYMENT holds the lock; REPORT greyed with "waiting…"
- Sum shows 200; checklist box 3 green
- Both "waiting…" bars pulse; small four-way-stop sign icon between them
- Checklist boxes 1 and 2 red crosses
- Dashed "saved old values: alice 100, bob 100" box appears off to the side
- Arrows copy the saved values back onto each row, one at a time
- Checklist box 4 red cross; a coffee cup icon
HANDS OFF TO: "we already need the old value; what if we never threw it away?" (scene 06)
EST. DURATION: 32.0 s

### SCENE 06: Never throw it away
LABEL: THE BETTER QUESTION
NARRATION:
"Okay. Let's look under the abstraction, and ask a better question. To undo anything, we already need the old value. So what if we just never threw it away? What if nothing ever got overwritten at all? The report keeps reading the old alice. The payment writes a new alice, right next to her. Nobody waits. It's not a four-way stop anymore. It's two lanes."
VISUAL:
- Checklist resets to four empty boxes; lock fades
- The "saved old values" box from scene 05 pulses
- It slides back next to the rows, now labeled "old alice"
- "never overwrite" in accent
- REPORT arrow to old alice 100 (dim outline)
- PAYMENT arrow to a new alice 50 (accent outline) stacked under it
- Both "waiting…" bars disappear; the stop sign becomes two lane lines
HANDS OFF TO: "that's exactly what Postgres does" (scene 07)
EST. DURATION: 25.9 s

### SCENE 07: An insert with extra paperwork
LABEL: ROW VERSIONS
NEW TERM: row version = one copy of a row
NARRATION:
"And that is exactly what Postgres does. When you update alice, it doesn't touch her row. It writes a whole new copy, with the new balance. The old copy stays right where it was, with a little note that says: expired. Each copy is called a row version. So an update is really an insert, with extra paperwork. You might be thinking: that sounds wasteful. It is. On purpose."
VISUAL:
- TABLE PAGE frame: a stack of row slots, alice 100 and bob 100 inside
- Terminal: "UPDATE accounts SET balance = 50 WHERE name = 'alice';"
- A new slot draws at the bottom of the page
- It fills with "alice 50" in accent
- Old "alice 100" stays in its slot
- Old slot dims and gets a red "expired" tag
- Term card "row version = one copy of a row"
- "UPDATE = INSERT + paperwork" equation at top
HANDS OFF TO: "but that note has to say who expired her" (scene 08)
EST. DURATION: 27.3 s

### SCENE 08: Take a ticket
LABEL: TRANSACTIONS
NEW TERM: transaction = changes that happen together or not at all
NARRATION:
"But that note has to say who expired her, and when. Our payment changes two rows, and they have to happen together, or not at all. A bundle of changes like that is called a transaction. Every transaction that writes takes a ticket number, like the machine at a deli counter, always counting up. Our payment pulled number 42."
VISUAL:
- Accent "?" on the expired tag
- PAYMENT box brackets its two changes: alice −50, bob +50
- Term card "transaction = all together or not at all"
- Deli ticket dispenser icon; ticket chip "#41" slides out
- Tickets #40, #41 dim on the left, counting up
- PAYMENT gets the ticket "#42" in accent
HANDS OFF TO: "every row version carries two labels" (scene 09)
EST. DURATION: 22.6 s

### SCENE 09: Two hidden labels
LABEL: THE STAMPS
NEW TERM: xmin / xmax = CREATED BY / DELETED BY stamps
NARRATION:
"This is the bit I find genuinely delightful. Postgres labels every row version with two hidden stamps, like a hoarder labelling every box in the garage. Created by: the ticket that wrote it. Deleted by: the ticket that expired it. The old alice says: created by 7, deleted by 42. The new alice says: created by 42, deleted by nobody, yet. Postgres calls these xmin and xmax, which might be why you've never heard of them."
VISUAL:
- Back to the TABLE PAGE; the alice slots zoom in
- Two empty label fields appear on every row version, like box labels
- Field "CREATED BY" highlights
- Field "DELETED BY" highlights
- Old alice: CREATED BY 7, DELETED BY 42 (42 in accent)
- New alice: CREATED BY 42 (accent), DELETED BY —
- Field labels swap to their real names: xmin, xmax
HANDS OFF TO: "so which alice does a query see?" (scene 10)
EST. DURATION: 32.0 s

### SCENE 10: A photo of finished tickets
LABEL: SNAPSHOTS
NEW TERM: snapshot = a photo of which tickets had finished
NARRATION:
"So with two alices on the page, which one does a query see? When a query starts, Postgres hands it a snapshot: think of it as a photo of which tickets had finished at that moment. Then one rule decides everything. You see a version if its creator had finished in your photo, and its deleter hadn't."
VISUAL:
- Both alice versions side by side with their stamps; "?" between them
- A query box gets a camera-frame icon labeled "snapshot"
- Inside the frame: "finished: 1…41" (green) and "42: not yet" (dim)
- Term card "snapshot = a photo of finished tickets"
- Rule line 1: "CREATED BY ∈ photo ✓" 
- Rule line 2: "DELETED BY ∉ photo ✓"
HANDS OFF TO: "back to our report" (scene 11)
EST. DURATION: 20.0 s

### SCENE 11: Same instant, two answers
LABEL: SNAPSHOTS
NARRATION:
"Back to our report. It took its photo before ticket 42 finished. So it sees the old alice, 100, and the old bob, 100. Total: 200. Now a second query starts just after 42 finishes. It sees alice 50 and bob 150. Also 200. Same table, same instant, two different answers, and both are right. That sounds like a bug. It's the entire feature. And nobody waited for anybody. Three out of four, without a single lock."
VISUAL:
- REPORT box left with its snapshot frame; four row versions in the page (old/new alice, old/new bob)
- Snapshot frame shows "42: not yet"
- Arrow from REPORT to old alice 100; new versions dim
- Arrow to old bob 100
- REPORT sum "200" in green
- QUERY 2 box right with a photo "42: finished"
- Arrows from QUERY 2 to new alice 50 and new bob 150
- QUERY 2 sum "200" in green
- Both arrows highlight at once, a clock icon between them shows the same time
- No "waiting…" bars anywhere
- Checklist boxes 1, 2, 3 green; crossed-out padlock icon
HANDS OFF TO: "now say the payment blows up halfway" (scene 12)
EST. DURATION: 32.5 s

### SCENE 12: Undo is one line
LABEL: ROLLBACK
NARRATION:
"Now say the payment blows up halfway through. You roll it back. And Postgres doesn't erase anything. It writes one line in a little status list: ticket 42, aborted. Everything 42 created now counts for nobody. Every deleted-by-42 stamp is ignored. One line, whether the payment touched two rows or two million. Honestly, I wish my mistakes worked like that. That's all four."
VISUAL:
- PAYMENT #42 box gets a red error chip
- Terminal: "ROLLBACK;"
- Crossed-out eraser icon over the page; rows unchanged
- Status list panel: "41 committed", "42 aborted" (red)
- New alice 50 and new bob 150 fade to 0.3
- The "42" in DELETED BY on old alice and old bob is struck through; old rows brighten again
- "undo = 1 line" in accent
- Checklist box 4 green: all four done
HANDS OFF TO: "all four, from one hoarding habit" (scene 13)
EST. DURATION: 27.3 s

### SCENE 13: Many versions
LABEL: MVCC
NEW TERM: MVCC = many versions, each query picks one
NARRATION:
"All four boxes, from one hoarding habit: keep many versions of every row, and let each query pick the one its photo allows. The official name is multi-version concurrency control, a name only a committee could love. Everyone just says M-V-C-C. MySQL does it too, but tidier: it overwrites the row and stashes the old version in a separate undo log. Postgres keeps it all in the table. So every one of those old versions is still sitting on your disk."
VISUAL:
- Checklist panel pulses, all green
- The page shows stacked versions of alice
- Two query boxes with snapshot frames point to different versions
- Term card "MVCC = multi-version concurrency control"
- Split panel: "MySQL: overwrite + undo log (old versions elsewhere)" vs "Postgres: old versions stay in the table"
- Old versions highlight in red; a small disk bar fills
HANDS OFF TO: "once the report finishes, nobody can see the old alice" (scene 14)
EST. DURATION: 31.4 s

### SCENE 14: Delete is a stamp too
LABEL: DEAD ROWS
NEW TERM: dead row = a version no photo can see
NARRATION:
"Once the report finishes, no photo anywhere can see the old alice. Not ever again. She's a dead row. But she's still taking up space on the page. So why not delete her right away? Because some photo might still need her, so Postgres leaves the cleanup for later. And delete? Same trick. It doesn't remove anything. It just fills in the deleted-by stamp. Those 10 million accounts you deleted? 10 million dead rows, still sitting in your 10 gigabytes."
VISUAL:
- REPORT box and its snapshot fade out
- No query arrow reaches old alice
- Old alice goes grey
- Term card "dead row = no photo can see it"
- Its slot outlined: still occupying the page
- Small "cleanup: later" sticky note on the grey slot
- Terminal: "DELETE FROM accounts WHERE name = 'bob';"
- Old bob stays in place; only its DELETED BY field fills in
- Callback: the scene 01 "accounts" TABLE, half its rows turning grey
- Callback: the scene 01 disk bar, "10 GB", full
HANDS OFF TO: "which brings us to vacuum" (scene 15)
EST. DURATION: 31.4 s

### SCENE 15: The cleaning crew
LABEL: VACUUM
NEW TERM: vacuum = the cleaning crew
NARRATION:
"Which brings us to vacuum. If Postgres is the hoarder, vacuum is the cleaning crew. It walks the table page by page, finds rows no photo can see anymore, and marks their space as free. New rows move into those holes. And this is where Sam's advice disappoints people. The file doesn't shrink. You cleared out half the closet, and the closet is still the same size. Still 10 gigabytes, just with room inside."
VISUAL:
- Terminal: "VACUUM accounts;"
- Term card "vacuum = the cleaning crew"
- A sweep line moves across a row of pages
- Grey dead rows highlight
- Their slots empty out and get green "free" tags
- A new row "carol 30" drops into a free slot
- Sam's chat chip from scene 01 reappears; disk bar from scene 01 appears
- Bar stays the same width
- "10 GB" with hatched "free inside" region
HANDS OFF TO: "if you really want the space back, there's vacuum full" (scene 16)
EST. DURATION: 28.5 s

### SCENE 16: Moving to a smaller apartment
LABEL: VACUUM FULL
NARRATION:
"If you really want the space back, there's vacuum full. It builds a brand new copy of the table, with only the live rows, then throws the old file away. 10 gigabytes becomes 5. But it's like moving to a smaller apartment. While you're packing, nobody gets in: no reads, no writes. And for a while, you're paying rent on both places. That's the bill for hoarding, and I won't pretend it's small."
VISUAL:
- Terminal: "VACUUM FULL accounts;"
- Second empty file draws beside the old one
- Only live rows stream into it; dead and free slots stay behind
- Old file fades out
- Disk bar shrinks: 10 GB → 5 GB, green
- Padlock from scene 05 snaps onto the table
- REPORT and PAYMENT both get "waiting…" bars; checklist boxes 1 and 2 flash red
- Both files shown at once; disk bar briefly at 15 GB
HANDS OFF TO: "luckily, you almost never run vacuum by hand" (scene 17)
EST. DURATION: 26.3 s

### SCENE 17: The forgotten BEGIN
LABEL: AUTOVACUUM
NEW TERM: autovacuum = the background cleaner
NARRATION:
"Luckily, you almost never run vacuum by hand. Postgres has a background helper called autovacuum. It wakes up whenever enough rows in a table have died. But it has one weakness, and it's a person. Somewhere, someone typed BEGIN in a terminal, went to lunch, and never came back. That forgotten BEGIN is still holding its old photo. And vacuum won't clean anything that photo might still see. So the table grows. And grows. And grows. Disk filling up for no reason? Look for the forgotten BEGIN first."
VISUAL:
- Terminal fades
- Small "autovacuum" process box appears in the corner
- Dead-row counter climbs; at a threshold, autovacuum lights up and sweeps
- Sweep pauses
- Session box "BEGIN; … idle for 3 days" appears, with an empty chair icon
- Its old snapshot frame stays open, accent
- Sweep skips the dead rows; they get "still visible to someone" tags
- Disk bar grows in three steps, red
HANDS OFF TO: "vacuum has one more job, and it's the scary one" (scene 18)
EST. DURATION: 35.9 s

### SCENE 18: When the tickets run out
LABEL: WRAPAROUND
NEW TERM: freeze = stamp an old row visible to everyone
NARRATION:
"Vacuum has one more job, and it's the scary one. Those deli tickets are a 32-bit number. After about 4 billion, they wrap back around to the start. So Postgres reads them like a clock. 2 billion behind now is the past. 2 billion ahead is the future. Leave a row alone long enough, and its created-by ticket drifts into the future, and a row from the future is invisible. Your data would just vanish. So vacuum freezes old rows: it stamps them as visible to everyone, forever. And if vacuum falls too far behind, Postgres stops accepting writes, rather than let your data disappear. This isn't hypothetical. In 2015, Sentry was down for most of a working day because of exactly this. Painful. But I'd still rather my database stop than lie to me."
VISUAL:
- Ticket chip "#42" from scene 08
- Counter races up to "4,294,967,295"
- It wraps back to "3"
- Ticket numbers laid on a circle like a clock face; a "now" hand
- Left half of the circle shaded "past"
- Right half shaded "future"
- Old alice's "CREATED BY 7" moves around the circle as "now" advances, crossing into "future"
- Old alice fades out, red
- Rewind: vacuum stamps old alice "FROZEN" in accent
- Frozen row stays visible no matter where the hand is
- Terminal error in red: "database is not accepting commands that assign new transaction IDs…"
- Chip "Sentry · July 2015 · down most of a day"; then a shield icon "stop > lie"
HANDS OFF TO: "so, putting it all together" (scene 19)
EST. DURATION: 50.9 s

### SCENE 19: The big idea
LABEL: THE BIG IDEA
NARRATION:
"So, putting it all together. An update writes a new version. A delete stamps an old one. Every query reads through its own photo. And vacuum sweeps up whatever no photo can see. Postgres never changes a row. It writes a new one, which is why readers never block writers, and why your table grows until vacuum cleans up."
VISUAL:
- Summary panel top-left: "Postgres ="
- Row "UPDATE → new version" with the two alice cards
- Row "DELETE → DELETED BY stamp"
- Row "query → snapshot photo"
- Row "VACUUM → frees what no photo sees"
- Big "Postgres never changes a row." in accent
- "it writes a new one"
- "readers never block writers" in green; checklist pulses
- "the table grows until vacuum cleans up" with the disk bar
HANDS OFF TO: "back to your 10 gigabytes" (scene 20)
EST. DURATION: 22.3 s

### SCENE 20: Sam was right
LABEL: THE PROBLEM, REVISITED
NARRATION:
"So, back to your 10 gigabytes. Your delete stamped 10 million rows as dead. Autovacuum marks their space as free. Your next 10 million inserts move into those holes, and the file doesn't grow at all. And if you truly need the disk back, run vacuum full at 3 a.m., when nobody's looking. Sam was right, by the way. Sam is annoyingly often right."
VISUAL:
- Callback: the exact scene 01 frame: "accounts" TABLE, terminal, disk bar "10 GB"
- Half the rows turn grey with DELETED BY stamps
- Autovacuum sweeps; grey slots become green "free"
- Counter of new inserts fills the free slots
- Disk bar stays at 10 GB, now green
- Dashed alternative branch
- "VACUUM FULL, 3 a.m." → disk bar 5 GB
- Sam's chat chip "you need to vacuum." returns, now with a green check
HANDS OFF TO: "want to catch Postgres in the act?" (scene 21)
EST. DURATION: 23.6 s

### SCENE 21: Catch it in the act
LABEL: PROOF
NARRATION:
"Want to catch Postgres in the act? Run select xmin, xmax, star from accounts. Those are hidden columns on every table you've ever made. Update a row, run it again, and the created-by number has changed. It's not the same row anymore. It's a brand new copy. Postgres never forgets. It just eventually lets go. Have you ever been bitten by a forgotten BEGIN? How long did it take you to find it?"
VISUAL:
- Terminal center
- Types "SELECT xmin, xmax, * FROM accounts;" → table: xmin 7, xmax 0, alice, 100
- xmin and xmax column headers highlight in accent
- Types "UPDATE accounts SET balance = 50 WHERE name = 'alice';"
- Re-runs the SELECT
- xmin now 42, highlighted
- "not the same row." appears
- "a brand new copy." in accent; then "Postgres never forgets. It just eventually lets go."
HANDS OFF TO: "so, to summarise everything" (scene 22)
EST. DURATION: 27.2 s

### SCENE 22: To summarise
LABEL: TO SUMMARISE
NARRATION:
"So, to summarise everything. An update never changes a row. It writes a new version, and stamps the old one. Every query reads through its own snapshot, so readers and writers never wait for each other. A delete is just a stamp, and vacuum is what turns dead rows back into free space. Leave a transaction open, or let vacuum fall behind, and the table grows. Postgres is a hoarder. On purpose."
VISUAL:
- Heading "to summarise everything"; the outro music bed fades in
- Point 01 "UPDATE writes a new version, stamps the old one"
- Point 02 "each query reads its own snapshot: nobody waits"
- Point 03 "DELETE is a stamp; VACUUM frees the space"
- Point 04 "forgotten BEGIN or slow vacuum → the table grows"
- Aha line in accent: "Postgres is a hoarder. On purpose." (callback to scene 07)
HANDS OFF TO: the end card (scene 23)
EST. DURATION: 28.7 s

### SCENE 23: End card
LABEL: END
NARRATION:
"If you liked the video, drop a like and subscribe, and tell me what topics you want to see next."
VISUAL:
- like() chip
- subscribe() chip; cursor clicks → subscribed() ✓
- suggest(next_topic) chip with blinking caret; hold for the YouTube end screen
EST. DURATION: 14.2 s

## Scene table (measured from elevenlabs audio)

| # | Label | Seconds | Words |
|---|---|---|---|
| 01 | THE PROBLEM | 28.0 | 75 |
| 02 | THE PROBLEM | 28.4 | 73 |
| intro | CHANNEL INTRO | 7.0 | 0 |
| 03 | WHAT WE NEED | 35.2 | 75 |
| 04 | ATTEMPT 1: OVERWRITE | 27.1 | 59 |
| 05 | ATTEMPT 1: OVERWRITE | 32.0 | 83 |
| 06 | THE BETTER QUESTION | 25.9 | 65 |
| 07 | ROW VERSIONS | 27.3 | 69 |
| 08 | TRANSACTIONS | 22.6 | 59 |
| 09 | THE STAMPS | 32.0 | 76 |
| 10 | SNAPSHOTS | 20.0 | 57 |
| 11 | SNAPSHOTS | 32.5 | 77 |
| 12 | ROLLBACK | 27.3 | 63 |
| 13 | MVCC | 31.4 | 81 |
| 14 | DEAD ROWS | 31.4 | 80 |
| 15 | VACUUM | 28.5 | 74 |
| 16 | VACUUM FULL | 26.3 | 73 |
| 17 | AUTOVACUUM | 35.9 | 88 |
| 18 | WRAPAROUND | 50.9 | 135 |
| 19 | THE BIG IDEA | 22.3 | 59 |
| 20 | THE PROBLEM, REVISITED | 23.6 | 64 |
| 21 | PROOF | 27.2 | 73 |
| 22 | TO SUMMARISE | 28.7 | 72 |
| 23 | END | 14.2 | 20 |

## Term table

| Term | Scene | Plain meaning used in narration |
|---|---|---|
| lock | scene05 | a do not disturb sign on the rows (everyone waiting: "a four-way stop for data") |
| row version | scene07 | one copy of a row; an update writes a new one ("an insert with extra paperwork") |
| transaction | scene08 | a bundle of changes that happen together or not at all, with a deli-counter ticket number |
| xmin / xmax | scene09 | the CREATED BY and DELETED BY labels on every row version |
| snapshot | scene10 | a photo of which tickets had finished when your query started |
| MVCC | scene13 | keep many versions of every row; each query picks the one its photo allows |
| dead row | scene14 | a version no photo can ever see again |
| vacuum | scene15 | the cleaning crew for the hoarder: marks dead rows' space as free |
| autovacuum | scene17 | the background helper that runs vacuum for you |
| freeze | scene18 | stamp an old row as visible to everyone, forever |

## "Didn't know that" moments

- **Scene scene07:** An UPDATE is really an INSERT of a new version plus a note on the old one.
- **Scene scene09:** Every row version carries two hidden stamps: the ticket that created it and the ticket that deleted it.
- **Scene scene11:** Two queries at the same moment can see different versions of the same row, and both are correct.
- **Scene scene12:** ROLLBACK erases nothing. It writes one note: ticket 42 was aborted.
- **Scene scene14:** DELETE removes nothing. It only fills in the DELETED BY stamp.
- **Scene scene15:** VACUUM does not shrink the file; it only makes the space reusable. Only VACUUM FULL gives it back.
- **Scene scene18:** Ticket numbers run out after about 4 billion and wrap around; if vacuum falls behind, Postgres stops accepting writes.

## [VERIFY] before publishing

- [ ] Scenes 01, 14, 20: 20 million rows / 10 GB / "still 10 GB" are illustrative. Plain VACUUM can give back fully empty pages at the very end of the file, so the size may drop a little.
- [ ] Scene 02: "nearly double" assumes full pages (default fillfactor 100), so new versions land on new pages. HOT updates can reuse space within a page when there is room.
- [ ] Scene 08: only transactions that write get a real transaction ID; read-only queries get a virtual one. The narration says "every transaction that writes" for this reason.
- [ ] Scene 10: simplified visibility rule (creator committed in the snapshot, deleter not). Under the default READ COMMITTED, each statement gets a new snapshot; REPEATABLE READ keeps one per transaction. A transaction also sees its own changes.
- [ ] Scene 11: two writers changing the SAME row still wait for each other in real Postgres. The checklist only promises readers and writers never wait for each other.
- [ ] Scene 12: the "little status list" is the commit log, pg_xact (pg_clog before version 10).
- [ ] Scene 13: MySQL/InnoDB updates the row in place and keeps prior versions in undo logs (purged later); Postgres stores old versions in the table itself. Sources: severalnines "PostgreSQL MVCC vs InnoDB", EnterpriseDB "Databases use different approaches for MVCC".
- [ ] Scene 14: "why not delete her right away": Postgres defers cleanup to VACUUM (and opportunistic page pruning during later reads/HOT updates), because another snapshot may still need the version.
- [ ] Scene 16: "10 GB becomes 5" ignores indexes and per-page overhead. VACUUM FULL takes an ACCESS EXCLUSIVE lock and needs extra disk for the new copy.
- [ ] Scene 17: autovacuum default trigger is 50 rows + 20% of the table dead (autovacuum_vacuum_threshold / scale_factor). An old snapshot (idle-in-transaction session, long query, replication slot) holds back cleanup for every table it might read, not only one.
- [ ] Scene 18: transaction IDs are 32-bit, compared modulo 2^32 (2 billion past / 2 billion future). New XIDs are refused below 3 million left (PostgreSQL 14+; 1 million before). Sentry outage: Monday 20 July 2015, "down for most of the US working day" (blog.sentry.io, "Transaction ID Wraparound in Postgres", 23 July 2015).
- [ ] Scene 21: SELECT xmin, xmax, * FROM accounts; works on any table; after an UPDATE the row shows the updating transaction's ID in xmin.

## Packaging

**Titles**

1. Postgres never updates a row. Here's what it does instead
2. Why DELETE doesn't free disk space in Postgres
3. Postgres is a hoarder (and that's a good thing)
4. What VACUUM actually does (and why your table keeps growing)
5. MVCC: how Postgres lets readers and writers never wait

**Thumbnail text** (pair #1 with title #1)

1. DELETED. STILL THERE.
2. NEVER UPDATES
3. 10 GB → 10 GB
4. IT KEEPS COPIES
5. A HOARDER

**Thumbnail layout:** Postgres elephant logo left-of-center with a soft accent (#8b7cf6) glow on #141414 with a faint grid. Right side: two stacked row cards "alice 100" (dim, struck through in red #ef4444) above "alice 50" (accent outline), and above them "NEVER UPDATES" in heavy uppercase sans, "NEVER" in accent. Nothing else.

**Description**

You delete half of a table, and the disk usage does not go down. That is not a bug. Postgres is a hoarder: it never changes a row in place, it writes a new version, stamps the old one, and lets every query read through its own snapshot. Vacuum is the cleaning crew, and the bill.\n\nKey terms: MVCC, row version, transaction ID, xmin, xmax, snapshot, dead rows, VACUUM, VACUUM FULL, autovacuum, freezing, transaction ID wraparound.

**Chapters** (measured from elevenlabs audio)

```
0:00 The Problem
1:03 What We Need
1:38 Attempt 1: Overwrite
2:37 The Better Question
3:03 Row Versions
3:30 Transactions
3:53 The Stamps
4:25 Snapshots
5:18 Rollback
5:45 Mvcc
6:16 Dead Rows
6:48 Vacuum
7:16 Vacuum Full
7:42 Autovacuum
8:18 Wraparound
9:09 The Big Idea
9:32 The Problem, Revisited
9:55 Proof
10:22 To Summarise
10:51 End
```

**Tags:** postgresql, postgres, postgres mvcc, postgres vacuum, vacuum full, autovacuum, database internals, transaction id wraparound, postgres delete disk space, how postgres works
