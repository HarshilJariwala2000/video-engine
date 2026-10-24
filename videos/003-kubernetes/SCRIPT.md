# Kubernetes will finally make sense after this video

**Aha:** Kubernetes isn't a launcher. It's a set of loops that keep comparing what you asked for with what exists, and fixing the difference.  
**Audience:** beginner + intermediate  
**Hook pain:** One container is easy. Three copies on three servers, started by hand, and you become the program that checks they are still running: paged at 3 a.m., tracking free memory, fixing addresses. Kubernetes is supposed to take that job. Then on day one, kubectl says "created", two pods run, the third sits on Pending with no error, and Jordan from the platform team says "it's not stuck. It's waiting."  
**Recurring device:** Requirements checklist (the chores you did by hand become the requirements; we build Kubernetes ourselves) + the reconcile stamp WANT 3 / HAVE 2 / ACT +1 that reappears for every loop  
**Length:** 2091 words, 13:57 (estimated)

> Generated from `narration/script.mjs`. Edit that file, not this one, then run `npm run script 003-kubernetes`.

---

### SCENE 01: Containers by hand
LABEL: THE PROBLEM
NARRATION:
"One container is easy. You type docker run, your web app starts, and life is good. Then people actually start using it. Now you need three copies, on three servers, so you log in to each one and start it by hand. At 3 a.m. one of them crashes, and guess who gets woken up to restart it. A new copy needs a home, and you're the one who remembers which server still has memory free. Every time a copy moves, its address changes, and you go and fix the config. Without noticing, you've become a program. A slow, tired one, whose whole job is checking that things are still running. That job is exactly what Kubernetes was built to take off your hands."
VISUAL:
- Big line "one container is easy"; a single SERVER frame "server-1"
- Terminal types "docker run web"; a web container appears in server-1 with a green check
- Users chip ticks up: "10 users" → "10,000 users"
- server-2 and server-3 frames slide in beside server-1 (the running example)
- A small "you" icon hops server to server; each time the terminal types "ssh server-N, docker run web" and a container appears
- Clock chip "3:00 a.m."; server-3's container turns red; a "paged" chip buzzes next to "you"; "you" hops over and it turns green again
- Free-room bars over each server; a new web container hovers over them; "you" checks each bar in turn
- A container moves server-1 → server-2; its address chip changes 10.0.0.4 → 10.0.0.9; a config line "web = 10.0.0.4" rewrites in red
- A loop arrow draws around "you": check → fix → check; label "you = the program"
- Box "Kubernetes" fades in above the servers; the loop arrow slides off "you" onto it
HANDS OFF TO: "so your team installs it" (scene 02)
EST. DURATION: 50.6 s

### SCENE 02: Created, not running
LABEL: THE PROBLEM
NARRATION:
"So your team installs it, and Jordan from the platform team promises you'll finally sleep through the night. You apply your web app, three copies. It says: created. You check the pods. Two are running. The third one says Pending. Ten minutes later, still Pending. No error. No crash. Nothing. Jordan rolls their chair over, squints at your screen, and says: it's not stuck. It's waiting."
VISUAL:
- The "Kubernetes" box from scene 01 grows into a frame around the three servers; chat chip "Jordan (platform): you'll sleep now"
- Terminal types "kubectl apply -f web.yaml"
- Terminal prints "deployment.apps/web created" with a green check
- Terminal types "kubectl get pods"; three pod rows appear: web-a1b2c, web-m3n8d, web-x7k2p
- web-a1b2c and web-m3n8d show "Running" in green
- web-x7k2p shows "Pending" in accent
- Clock chip "+10 min"; web-x7k2p still "Pending"
- Dim chips "no error", "no crash" beside the row
- Chat chip bottom-right: "Jordan (platform): it's not stuck. it's waiting."
HANDS OFF TO: "waiting for what?" (scene 03), after the channel intro
EST. DURATION: 32.3 s

### CHANNEL INTRO: Lifted Lid (default = A)
Shared animated intro + music (shared/motion/intros). No narration.
EST. DURATION: 7.0 s

### SCENE 03: Waiting for what?
LABEL: THE MYSTERY
NARRATION:
"Waiting for what? You go looking for logs, and there are none, because that copy never started anywhere. For my first year with Kubernetes, I treated it like a very expensive remote control for docker run. The same thing I used to do by hand, just on every server at once. Press apply, things start. If that were true, created would mean running, and anything that didn't run would come with an error. That picture is wrong, and it's why Kubernetes feels like magic on good days and haunted on bad ones. By the end of this video, you'll know exactly what that pod is waiting for, and why it's the same thing that finally lets you sleep."
VISUAL:
- Big "?" over the Pending row
- Terminal types "kubectl logs web-x7k2p"; output stays empty; dim chip "never started"
- A remote-control icon labeled "apply = docker run × 3"; the scene 01 "you" icon hopping between servers flashes beside it
- Equation "created = running" appears under the remote
- The remote and the equation are struck through in red; small "magic / haunted" pair of labels
- The pod list returns; a dashed accent loop arrow circles the Pending row
- Loop arrow pulses; chip "not an error" in accent; a small "zzz" beside the "3:00 a.m." clock chip
HANDS OFF TO: "let's build Kubernetes ourselves" (scene 04)
EST. DURATION: 48.3 s

### SCENE 04: The checklist
LABEL: WHAT WE NEED
NEW TERM: cluster = a group of servers run as one
NARRATION:
"So let's pretend we're building Kubernetes ourselves, to take over your 3 a.m. job. Same web app, same three servers. Except we stop thinking of them as three separate machines you log in to. They're one group, managed together, and that group has a name: a cluster. Ours is three servers. Every chore you did by hand becomes a requirement. One: keep three copies of the app running, always. Two: pick a server with room for each copy, without anyone choosing by hand. Three: heal on its own, even when a server dies at 3 a.m. And four: one address that reaches whichever copies are alive, so nobody edits config when they move."
VISUAL:
- "let's build it ourselves" appears
- APP box "web" center; the three SERVER frames from scene 01 below: server-1, server-2, server-3
- One dashed frame draws around all three servers, labeled "cluster"; term card "cluster = servers run as one"; the "you" icon's ssh hops fade
- Checklist panel center; the scene 01 chores ("restart", "find room", "fix address") fly into it as dim chips
- Row 1 "always 3 copies"
- Row 2 "picks the servers"
- Row 3 "heals on its own"
- Row 4 "one address"; then the panel shrinks into the top-right corner and stays
HANDS OFF TO: "the obvious first try is a script" (scene 05)
EST. DURATION: 36.7 s

### SCENE 05: The script that went home
LABEL: ATTEMPT 1: A SCRIPT
NARRATION:
"The obvious first try is to automate your own hands: a script. For each server, connect, and start the app. Three copies. It even picks the servers, sort of: we typed their names in by hand, and it never checked if they had room. That doesn't count. Now server two dies at 3 a.m. The script finished hours ago. It printed done, and went home. You have two copies, and nobody knows. And there's no single address, just three server names you hand out and hope."
VISUAL:
- Code panel left: "for s in server-1 server-2 server-3: ssh $s docker run web"
- Arrows from the script to each SERVER frame in turn
- A web container appears in each server; checklist box 1 green
- The hard-coded names highlight; checklist box 2 red cross
- server-2 turns red, its container disappears; clock chip "3:00 a.m."
- Script panel shows "done." and dims
- Script panel fades out completely: "exited"
- Copy counter "2 / 3" in red; checklist box 1 turns to red cross; box 3 red cross
- Three server names as loose chips; checklist box 4 red cross
HANDS OFF TO: "just add a restart policy?" (scene 06)
EST. DURATION: 37.1 s

### SCENE 06: Just restart it?
LABEL: ATTEMPT 1: A SCRIPT
NARRATION:
"You might be thinking: just add a restart policy. Sure. Docker will restart a crashed container, on the same machine. But at 3 a.m., the machine is the thing that died, and its restart policy died with it. Both fixes act once, and then nothing is watching."
VISUAL:
- Chip "restart: always" attaches to the web container on server-1
- Container on server-1 crashes red, then comes back green with a small loop arrow
- The loop arrow is drawn inside server-1's frame only
- Callback: server-2 red and dark from scene 05; its restart loop arrow fades away with it
- Timeline bar: a single accent tick "started" at the left
- Rest of the timeline empty and dim, labeled "nobody watching"
HANDS OFF TO: "let's ask a better question" (scene 07)
EST. DURATION: 21.4 s

### SCENE 07: Always, not once
LABEL: THE BETTER QUESTION
NARRATION:
"Okay. Let's look under the abstraction, and ask a better question. The script answers: how do I start three copies? The better question is: how do I make sure there are always three? Starting happens once. Always means someone keeps checking. At the start of this video, that someone was you. We need a thermostat. You set what you want: 21 degrees. It measures what you have: 19. And it acts on the difference. Not once. Forever."
VISUAL:
- Checklist resets to four empty boxes; script and servers fade
- "how do I start 3 copies?" (dim)
- "how do I make sure there are always 3?" (accent) appears under it
- Word "once" under the first line
- Word "always" under the second line, accent; the scene 01 "you" icon with its loop arrow flashes beside it
- Thermostat dial icon center
- WANT column: "21°"
- HAVE column: "19°"
- Diff arrow between them, "ACT: heat on"; arrow loops back to WANT
HANDS OFF TO: "Kubernetes is built out of thermostats" (scene 08)
EST. DURATION: 35.4 s

### SCENE 08: Want versus have
LABEL: THE LOOP
NEW TERM: controller = a thermostat for one kind of thing
NARRATION:
"Kubernetes is built out of thermostats. Each one is a small program called a controller, running three steps in a loop. Read what you want. Compare it with what you have. Fix the difference. Then again. And again. Want three, have two? Act: plus one. I call it want versus have, and honestly, it's the only idea in this video. A controller never finishes, and it never trusts that things stayed fixed."
VISUAL:
- Thermostat icon multiplies into a row of small controller boxes
- Term card "controller = a thermostat"; one controller box zooms center
- Loop diagram around it: READ step lights up
- COMPARE step lights up
- FIX step lights up
- Loop arrow spins back to READ, twice
- The reconcile stamp appears for the first time: WANT 3 / HAVE 2 / ACT +1 (ACT in accent)
- Loop keeps spinning slowly; label "never done"
HANDS OFF TO: "so where does the want live?" (scene 09)
EST. DURATION: 32.7 s

### SCENE 09: Apply starts nothing
LABEL: THE NOTEBOOK
NEW TERM: API server = the shared notebook
NARRATION:
"So where does the want live? In a file: a deployment called web, with three replicas. You run kube control apply. And now my favourite fact about Kubernetes. Apply doesn't start anything. It sends your file to one program, the API server, which saves it in a database and replies: OK. Zero containers are running. All you've done is write down a wish. So that created from the start of the video? It means the wish was written down. Nothing more. But two of my pods did start, you say. They did. Just not because of apply."
VISUAL:
- Empty WANT column with a "?"
- YAML panel: "kind: Deployment / name: web / replicas: 3", replicas line in accent
- Terminal types "kubectl apply -f web.yaml"
- Terminal dims; small "fun fact" tag
- "starts nothing" in accent
- Arrow from terminal to a box API SERVER; term card "API server = the shared notebook"
- Notebook icon "etcd" under API SERVER; the YAML slides into it as one entry "web: want 3"
- Terminal prints "deployment.apps/web created"
- Three empty server frames, counter "running: 0"
- Notebook entry gets a small "wish" tag
- Callback: the scene 02 terminal line "deployment.apps/web created" flashes up; its green check turns into the "wish" tag
- Dim chip "but 2 pods started…" then a dashed line from the notebook toward "something else?"
HANDS OFF TO: "writing the wish wakes up the first thermostat" (scene 10)
EST. DURATION: 42.0 s

### SCENE 10: Paperwork
LABEL: THE REPLICA LOOP
NEW TERM: pod = one running copy of your app
NARRATION:
"The wish wakes up the first thermostat: the replica controller. It reads the notebook. Want: three copies of web. Have: zero. So it creates three pods. Pod is Kubernetes' word for one copy of your app. It never handles a bare container. It wraps it in a pod, usually just one container, sometimes with a small helper that has to live and die with it, and the pod gets its own address. So for us, one pod is one copy of web, and we want three. But look closer. It didn't run anything either. It wrote three more entries in the notebook. Kubernetes is extremely good at paperwork. And remember our Pending pod? It exists. It's a perfectly good entry in this notebook. It's just missing one thing."
VISUAL:
- Controller box "replica controller" appears left of the API SERVER; arrow to the notebook
- Arrow reads "web: want 3"
- Stamp: WANT 3
- Stamp: HAVE 0
- Stamp: ACT +3 in accent
- Term card "pod = one running copy"; a pod outline (rounded dashed box) wraps a web container, a small dim "helper" box slots in beside it, an address chip "10.1.0.4" on the pod
- Helper box fades; three pod outlines side by side labeled "web ×3" (still dashed: not running)
- Zoom into the notebook
- Three new entries: "pod web-a1b2c · node: ___" ×3, all inside the notebook
- Server frames still empty; "running: 0"
- Callback: the scene 02 pod list flashes up beside it, the "web-x7k2p Pending" row pulsing; its notebook entry's empty "node: ___" highlights
HANDS OFF TO: "each new pod has an empty field: node" (scene 11)
EST. DURATION: 39.7 s

### SCENE 11: One blank to fill
LABEL: THE SCHEDULER
NEW TERM: node = one of our servers
NARRATION:
"Each new pod has an empty field, called node. A node is Kubernetes' word for one machine in the cluster that can run pods. A physical server in a rack, or far more often a virtual one you rent from a cloud. Our three servers are three nodes. The next thermostat, the scheduler, watches for pods with that field blank. It checks how much room each server has left against how much the pod asks for, picks the best fit, and writes that server's name into the blank. That's the scheduler's entire job. It doesn't start anything. It fills in one blank. As long as some server has room. Hold that thought. And nobody typed a server name by hand, least of all you."
VISUAL:
- Pod entry close-up: "node: ___" field highlighted
- Term card "node = a machine that runs pods"; the cluster frame from scene 04 returns around the three servers
- Two small icons "rack server" and "cloud VM" (the second in accent) beside the frame; the three server frames relabel node-1, node-2, node-3
- Controller box "scheduler" appears; arrow to the notebook; stamp WANT: node set / HAVE: blank
- Free-room bars over each node (the same bars "you" checked in scene 01); the pod entry gets an "asks: 2 GB" chip
- node-2 bar highlights as best fit
- "node-2" types into the field in accent; then node-1 and node-3 into the other two pods
- "entire job: 1 field" chip
- Crossed-out chips "start" and "copy"
- All three pod entries show filled node fields
- Small dim "if room" tag under the filled fields; the free-room bars flash once
- Checklist box 2 green
HANDS OFF TO: "so who actually runs anything?" (scene 12)
EST. DURATION: 40.3 s

### SCENE 12: Making it real
LABEL: THE KUBELET
NEW TERM: kubelet = the thermostat on each server
NARRATION:
"So who actually runs anything? Every server has a small agent called the kube-let. Another thermostat, but it only cares about its own server. Want: every pod with my name on it. Have: what's running on me right now. Want one, have zero, so it tells the container engine to start one. That container is the same thing from our Docker video: an ordinary process, with blinders on. Three servers, three copies. After a file, a notebook and three thermostats, something has finally started."
VISUAL:
- Notebook with three pod entries; "running: 0" counter
- Small "kubelet" box appears inside each node frame; term card "kubelet = the thermostat on each server"
- node-2's kubelet highlights; others dim
- Arrow from node-2's kubelet up to the notebook; stamp WANT: pods for node-2
- Stamp HAVE: 0 running
- Stamp ACT +1; a web container fades in inside node-2
- Container zooms: "process + blinders" (the namespace wall from 001)
- All three kubelets act; one container per node; checklist box 1 green
- Chain under the frame: file → notebook → replica → scheduler → kubelet; "running: 3" in green
HANDS OFF TO: "now notice who talked to whom" (scene 13)
EST. DURATION: 38.5 s

### SCENE 13: Choreography, not orchestration
LABEL: THE NOTEBOOK
NARRATION:
"Now notice who talked to whom. The scheduler never called a kube-let. The replica controller never called the scheduler. Nobody calls anybody. They only read and write the notebook, and react to what changes. That's deliberate. In 2016, the Google engineers behind Borg, Kubernetes' ancestor, wrote a paper about it. They called the design choreography, not orchestration. No conductor shouting cues. Just dancers, all watching the same floor. Kill any one of them, restart it, and it reads the notebook and carries on."
VISUAL:
- Hub diagram: API SERVER + notebook center; replica controller, scheduler, three kubelets around it
- Dashed line scheduler → kubelet, struck through in red
- Dashed line replica controller → scheduler, struck through in red
- All direct lines gone
- Every component gets a solid arrow to the center only; arrows pulse in accent
- Paper card: "Borg, Omega, and Kubernetes · ACM Queue · 2016"
- Quote line "choreography, not orchestration" in accent
- Conductor baton icon struck through
- Components orbit the center
- The scheduler box fades out, then back in
- Its arrow to the notebook reconnects; "picks up where it was"
HANDS OFF TO: "so where do all these thermostats live?" (scene 14)
EST. DURATION: 41.0 s

### SCENE 14: The office and the floor
LABEL: THE CONTROL PLANE
NEW TERM: control plane = the office: notebook + paperwork thermostats
NARRATION:
"So where do all these thermostats actually live? Look at the hub again, because it splits cleanly in two. The notebook, the replica controller and the scheduler never run your app. They only do paperwork. Kubernetes keeps them together, usually on machines of their own, and calls that group the control plane. I think of it as the office. It decides what should exist and where. The nodes are the workshop floor: each one has its kube-let, and that's where your containers actually run. Office plus floor. That's the whole cluster. And on a managed cloud cluster, you often never see the office at all. The provider runs it, and you only get the floor. Which is why, when a node goes quiet, the floor can't fix itself. The office has to notice."
VISUAL:
- Hub diagram from scene 13: API SERVER + notebook center; replica controller, scheduler, three kubelets around it
- A horizontal divider line draws across the frame; components slide to their side: notebook, replica controller, scheduler above; node-1..3 with their kubelets below
- Top group gets a frame "control plane" in accent; term card "control plane = the office"; small "paperwork only" chip
- Desk/office icon beside the frame; chips "what" and "where"
- Bottom frame "nodes" around node-1, node-2, node-3; each kubelet highlights; a web container glows in each node
- The scene 04 "cluster" frame draws around both groups
- Control-plane frame dims and gets a cloud chip "run by your provider"; the nodes stay bright
- node-2 dims slightly; a dashed arrow from the control plane down toward it labeled "notices"
HANDS OFF TO: "back to 3 a.m." (scene 15)
EST. DURATION: 42.1 s

### SCENE 15: Back to 3 a.m.
LABEL: HEALING
NARRATION:
"Which brings us back to 3 a.m. Server two dies. Its kube-let stops checking in. Another thermostat in the office, the node controller, notices the silence and marks server two unreachable. Then it waits, about five minutes by default, in case it's only a bad moment. After that, its pods are struck from the books. And the replica controller does its thing. Want three, have two. Plus one. The scheduler fills in a server, a kube-let starts it. Nobody woke up. Not you, not even Jordan. A dead server is just a very large bug report."
VISUAL:
- Callback: the scene 05 frame: three node frames, clock chip "3:00 a.m."
- node-2 turns red and dark; its container disappears
- node-2 kubelet arrow to the notebook breaks
- Controller box "node controller" appears; arrow to the notebook
- node-2 entry in the notebook gets an "unreachable" tag in red
- Timer chip counts "5:00" down
- Pod entry for node-2 is struck out of the notebook
- Replica controller lights up; stamp WANT 3 / HAVE 2
- Stamp ACT +1 in accent; a new pod entry "node: ___"
- Scheduler writes "node-3" into it
- node-3's kubelet starts a second container there; "running: 3"
- Checklist box 3 green; a sleeping "zzz" over the clock chip; the scene 01 "paged" chip stays dark
HANDS OFF TO: "one box left: one address" (scene 16)
EST. DURATION: 46.3 s

### SCENE 16: A proxy that proxies nothing
LABEL: SERVICES
NEW TERM: Service = one stable address for whichever pods are alive
NARRATION:
"One box left: one address. Pods come and go, and each new one gets a new address. That's the config you used to fix by hand. So you add a Service: one stable name, web, meaning whichever web pods are alive right now. You'd expect a program sitting at that address, passing traffic along. Nope. On every server, one more thermostat, kube proxy, reads the notebook and writes packet rules into the Linux kernel: traffic for web goes to one of these pods. The kernel forwards it itself. So despite the name, kube proxy usually proxies nothing. When a pod is replaced, it just rewrites the rules."
VISUAL:
- Checklist box 4 pulses
- Three pods with addresses 10.1.0.4, 10.1.2.7, 10.1.3.9; one fades and returns as 10.1.3.12; the scene 01 red config line flashes
- SERVICE box "web · 10.96.0.10" in accent above the pods; term card "Service = one stable address"
- Dashed "proxy?" box appears between the Service and the pods
- The dashed box gets a red cross and fades
- "kube-proxy" box on each node reads from the notebook; a rule list appears: "→ 10.96.0.10: pick 10.1.0.4 | 10.1.2.7 | 10.1.3.12"
- Rule list moves into a KERNEL bar at the bottom of each node; a request dot flows straight from the kernel to one pod
- "kube-proxy: proxies nothing" chip
- A pod is replaced; one line of the rule list rewrites in accent; checklist box 4 green: all four done
HANDS OFF TO: "this design isn't free" (scene 17)
EST. DURATION: 46.5 s

### SCENE 17: Nobody is in charge
LABEL: THE BILL
NARRATION:
"This design isn't free. Here's the bill. Nobody is in charge, so when something breaks, no single place says why. The answer is scattered across a dozen loops, each doing exactly what it was told. Healing isn't instant either: we just waited five minutes. And it needs spare room. If no server has space for the replacement, it just waits, Pending, like the pod from our hook. And for one app on one server, it's a lot of machinery. A script and a restart policy would honestly do. But across many servers at 3 a.m., I'll take a room full of stubborn thermostats over a script that went home."
VISUAL:
- Hub diagram from scene 13, dimmed; "the bill" heading
- Center label "in charge: nobody"; a red "why?" chip
- Each component box gets a small log snippet; the snippets scatter
- The "5:00" timer chip from scene 15
- Free-room bars on every node, all full; callback: the "web-x7k2p Pending" row from scene 02 in accent
- Single server frame with a script panel and "restart: always" chip, green
- Scale-up: many node frames, clock "3:00 a.m."; the loops spin green while a script panel shows "exited"
HANDS OFF TO: "so, putting it all together" (scene 18)
EST. DURATION: 27.0 s

### SCENE 18: The big idea
LABEL: THE BIG IDEA
NARRATION:
"Let's put it all together. Apply writes what you want into the notebook. Controllers compare it with what you have. The scheduler fills in a server. The kube-let makes it real. And kube proxy points the address at it. Kubernetes isn't a launcher. It's a set of loops, comparing what you asked for with what exists, and fixing the difference."
VISUAL:
- Summary panel top-left: "Kubernetes ="
- Row "kubectl apply → writes the want"
- Row "controllers → want vs have" with the WANT 3 / HAVE 2 / ACT +1 stamp
- Row "scheduler → fills in node"
- Row "kubelet → starts containers"
- Row "kube-proxy → kernel rules"; checklist pulses all green
- "not a launcher" struck through
- "a set of loops: want vs have" big in accent
- "fixing the difference" under it
HANDS OFF TO: "back to the pod that said Pending" (scene 19)
EST. DURATION: 63.1 s

### SCENE 19: It was waiting
LABEL: THE PROBLEM, REVISITED
NARRATION:
"Now, back to the pod that said Pending. The replica controller did its part: three entries. Then the scheduler looked. Each copy asks for two gigabytes of memory. Two copies found a server with room. For the third, every server was already filled past that by other teams' apps. So its blank stayed blank. No error, because nothing failed. The scheduler wrote a note on the pod, and kept trying. So change the want, or the have. Add a fourth server, and once it joins, the scheduler fills in the blank, and the pod starts. You didn't apply anything. On a cloud, there's even a thermostat for that: a cluster autoscaler watches for Pending pods and rents another server. Finding room used to be your job too. Jordan was right, by the way. It wasn't stuck. It was waiting for a want it could actually have."
VISUAL:
- Callback: the exact scene 02 frame: pod list, "web-x7k2p Pending" in accent
- Replica controller + notebook from scene 10; three entries "node: ___"
- Scheduler box lights up over the three node frames with their free-room bars; each pod entry gets an "asks: 2 GB" chip
- node-1 and node-2 fill into the first two entries; those rows turn "Running" in green
- Free-room bars of all three nodes are nearly full with dim "other team" blocks; every bar shorter than 2 GB, red outline
- web-x7k2p entry: "node: ___" stays blank, pulsing
- Note on the pod: "0/3 nodes: insufficient memory" (dim); a small loop arrow "retry"
- Two chips: "change the want: asks 1 GB" and "change the have: + server"; the second highlights
- node-4 frame slides in with a full free-room bar
- Scheduler writes "node-4" into the blank in accent; node-4's kubelet starts the container; row turns "Running"; chip "no apply"
- Small "cluster autoscaler" box watches the Pending row and adds a node frame; the scene 01 "you" icon, checking free-room bars, fades out
- Jordan's chat chip returns, now with a green check
HANDS OFF TO: "want to see that note yourself?" (scene 20)
EST. DURATION: 47.3 s

### SCENE 20: Read the note, watch the loop
LABEL: PROOF
NARRATION:
"Want to see that note yourself? Run kube control describe pod on any Pending pod, and scroll to the bottom. The scheduler tells you exactly why: something like, zero of three nodes are available, insufficient memory. And to watch the loop at work, run kube control get pods, dash w, for watch, and delete a pod from a second terminal. A new name appears before the old one is even gone. You just filed a bug report to a loop. Kubernetes never does what you say. It does what you want, as soon as it can. Have you ever stared at a Pending pod, waiting for an error that never came? What turned out to be missing?"
VISUAL:
- Terminal types "kubectl describe pod web-x7k2p"
- Output scrolls to the Events section
- "FailedScheduling  0/3 nodes are available: 3 Insufficient memory." with "Insufficient memory" in accent
- A second terminal appears beside it; left types "kubectl get pods -w"; pod list streams
- Right types "kubectl delete pod web-m3n8d"
- Left shows "web-h2v6p ContainerCreating" (new name in accent) while "web-m3n8d Terminating" is still listed; chip "a bug report to a loop"
- "It does what you want. As soon as it can." in accent
- Question card with the loop arrow icon
HANDS OFF TO: "so, to summarise everything" (scene 21)
EST. DURATION: 37.6 s

### SCENE 21: Summary
LABEL: TO SUMMARISE
NARRATION:
"To summarise everything. Apply doesn't start anything. It writes the want into the API server, the shared notebook. Controllers compare want with have, and fix the difference, forever. The scheduler fills in a server name, and that server's kube-let makes it real. A Pending pod isn't an error. It's a want that nothing can have yet, so change the want, or the have. Kubernetes isn't a launcher. It's a room full of stubborn thermostats, doing the job you used to do at 3 a.m."
VISUAL:
- Heading "to summarise everything"; the outro music bed fades in
- Point 01 "kubectl apply only writes the want"
- Point 02 "controllers: want vs have, forever"
- Point 03 "scheduler fills in a node; kubelet makes it real"
- Point 04 "Pending = a want nothing can have yet"
- Aha line in accent: "Not a launcher. A room full of stubborn thermostats."
HANDS OFF TO: the end card (scene 22)
EST. DURATION: 15.9 s

### SCENE 22: End card
LABEL: END
NARRATION:
"If you liked the video, drop a like and subscribe, and tell me what topics you want to see next."
VISUAL:
- like() chip
- subscribe() chip; cursor clicks → subscribed() ✓
- suggest(next_topic) chip with blinking caret; hold for the YouTube end screen
EST. DURATION: 8.6 s

## Scene table (estimated)

| # | Label | Seconds | Words |
|---|---|---|---|
| 01 | THE PROBLEM | 50.6 | 124 |
| 02 | THE PROBLEM | 32.3 | 66 |
| intro | CHANNEL INTRO | 7.0 | 0 |
| 03 | THE MYSTERY | 48.3 | 118 |
| 04 | WHAT WE NEED | 36.7 | 113 |
| 05 | ATTEMPT 1: A SCRIPT | 37.1 | 86 |
| 06 | ATTEMPT 1: A SCRIPT | 21.4 | 47 |
| 07 | THE BETTER QUESTION | 35.4 | 77 |
| 08 | THE LOOP | 32.7 | 72 |
| 09 | THE NOTEBOOK | 42.0 | 97 |
| 10 | THE REPLICA LOOP | 39.7 | 128 |
| 11 | THE SCHEDULER | 40.3 | 124 |
| 12 | THE KUBELET | 38.5 | 84 |
| 13 | THE NOTEBOOK | 41.0 | 83 |
| 14 | THE CONTROL PLANE | 42.1 | 133 |
| 15 | HEALING | 46.3 | 96 |
| 16 | SERVICES | 46.5 | 107 |
| 17 | THE BILL | 27.0 | 109 |
| 18 | THE BIG IDEA | 63.1 | 60 |
| 19 | THE PROBLEM, REVISITED | 47.3 | 146 |
| 20 | PROOF | 37.6 | 117 |
| 21 | TO SUMMARISE | 15.9 | 84 |
| 22 | END | 8.6 | 20 |

## Term table

| Term | Scene | Plain meaning used in narration |
|---|---|---|
| cluster | scene04 | a group of servers managed together as one; later: the office (control plane) plus the floor (nodes) |
| controller | scene08 | a thermostat for one kind of thing: read the want, compare with what you have, fix the difference, forever |
| API server | scene09 | the shared notebook every part of Kubernetes reads and writes (saved in a database, etcd) |
| pod | scene10 | one copy of your app: Kubernetes' wrapper around a container (sometimes plus a helper that lives and dies with it), with its own address |
| node | scene11 | one machine in the cluster that can run pods: a physical server or, more often, a rented virtual one |
| kubelet | scene12 | the thermostat on each server that makes that server's pods real |
| control plane | scene14 | the office: the notebook plus the paperwork thermostats (replica controller, scheduler), usually on machines of their own; the nodes are the floor |
| Service | scene16 | one stable name and address that means "whichever web pods are alive right now" |

## "Didn't know that" moments

- **Scene scene09:** kubectl apply starts nothing. It writes your file into the API server, which saves it in a database, and replies OK.
- **Scene scene10:** The controller that "creates pods" also starts nothing. It writes three more entries in the notebook.
- **Scene scene11:** The scheduler's whole job is filling in one field of the pod: the node name.
- **Scene scene13:** No component ever calls another one. They all only read and write the API server, by design: "choreography, not orchestration".
- **Scene scene14:** On a managed cloud cluster you usually never see the control plane: the provider runs the office, and you only get the nodes.
- **Scene scene15:** By default Kubernetes waits about five minutes before giving up on a dead server's pods.
- **Scene scene16:** kube-proxy usually proxies nothing. It writes packet rules into the Linux kernel on every server, and the kernel forwards the traffic.
- **Scene scene19:** A Pending pod is not an error. Nothing failed: the scheduler could not fill in the node blank, wrote a note on the pod, and keeps retrying. Add a server and the pod starts without you applying anything.
- **Scene scene20:** Delete a pod owned by a Deployment and its replacement appears before the old one has even finished dying: you filed a bug report to a loop.

## [VERIFY] before publishing

- [ ] Scenes 02, 03, 19: a Pod that no node can fit stays in phase Pending with condition PodScheduled=False, reason Unschedulable. kubectl apply still reports "deployment.apps/web created", and kubectl logs on a never-started pod returns an error/nothing because no container exists.
- [ ] Scene 01: with plain docker run on separate hosts, a container's IP is assigned by that host's Docker network, so a copy started elsewhere is reached at a different address and clients/config must be updated by hand. The 10.0.0.x addresses on screen are illustrative.
- [ ] Scene 19: "asks for two gigabytes" = resources.requests.memory: 2Gi. The scheduler filters on requests (not actual usage) against each node's allocatable minus requests of pods already there. Other teams' pods filling the nodes is illustrative.
- [ ] Scene 19: unschedulable pods sit in the scheduler's unschedulable queue and are retried on cluster events such as a node being added (and periodically, ~5 min flush). Once the new node is Ready, the pod is bound and started with no new apply.
- [ ] Scene 19: Cluster Autoscaler (and Karpenter) add nodes in reaction to unschedulable Pending pods. Cloud-managed clusters only; not on by default everywhere.
- [ ] Scene 20: kubectl describe pod Events show e.g. "Warning FailedScheduling … 0/3 nodes are available: 3 Insufficient memory. preemption: 0/3 nodes are available: …". Check exact wording against a current version before putting it on screen.
- [ ] Scene 06: Docker restart policies (restart: always / unless-stopped) restart a container on the same Docker host only; plain Compose does not move containers to another machine.
- [ ] Scene 09: kubectl apply sends the object to kube-apiserver, which persists it in etcd (the usual backing store) and returns success before any Pod exists. Server-side vs client-side apply does not change this.
- [ ] Scene 10: strictly, a Deployment's controller creates a ReplicaSet, and the ReplicaSet controller creates the Pods. The narration calls it "the replica controller"; the visual can label it ReplicaSet.
- [ ] Scene 11: the scheduler binds a Pod via the pods/binding subresource, which sets spec.nodeName. "How much memory and CPU each has free" is a simplification: it filters and scores on resource requests, affinity, taints, etc.
- [ ] Scene 12: the kubelet talks to the container runtime (containerd or CRI-O) through the CRI, not to Docker Engine (dockershim removed in 1.24). It watches the API server for Pods bound to its node.
- [ ] Scene 13: components can talk to things outside the cluster (cloud APIs, the container runtime), and the API server itself talks to kubelets for logs/exec. The claim is about control-plane coordination: controllers, the scheduler and kubelets coordinate only through the API server.
- [ ] Scene 13: Burns, Grant, Oppenheimer, Brewer, Wilkes, "Borg, Omega, and Kubernetes", ACM Queue vol. 14 no. 1, 2016: "control through choreography … a conscious design choice in contrast to a centralized orchestration system". Check exact wording before quoting on screen.
- [ ] Scene 10: a Pod is the smallest deployable unit; its containers share one network namespace and IP (the Pod IP). "Helper" = sidecar/init container. Kubernetes never schedules a bare container.
- [ ] Scene 14: control plane = kube-apiserver, etcd, kube-scheduler, kube-controller-manager (+ cloud-controller-manager). It usually runs on dedicated nodes (kubeadm taints them NoSchedule), though small/dev clusters can run both on one machine. On managed offerings (GKE, EKS, AKS) the provider runs the control plane and users do not see those machines. The node controller (scene 15) runs inside kube-controller-manager.
- [ ] Scene 15: the node lifecycle controller taints an unreachable node (node.kubernetes.io/unreachable:NoExecute); Pods get a default toleration of 300 s, then are evicted. Node-monitor grace period (~40–50 s) comes first, so total is a bit over 5 minutes. StatefulSet pods may stay stuck.
- [ ] Scene 16: kube-proxy modes on Linux are iptables (default in current docs), nftables and IPVS; all program the kernel and no proxy sits in the data path. The name dates from the original userspace proxy mode (removed in 1.26). Some clusters replace kube-proxy entirely (e.g. Cilium eBPF).
- [ ] Scene 20: with kubectl get pods -w, the replacement pod usually shows up while the old one is still Terminating (default 30 s grace period), because the ReplicaSet stops counting a pod once it is marked for deletion.
- [ ] Scenes 01–05, 15, 19: pod names, three servers, user counts, "ten minutes", "3 a.m.", the fourth server and Jordan are illustrative.

## Packaging

**Titles**

1. Kubernetes will finally make sense after this video
2. Why your Kubernetes pod is stuck on Pending (and who it's waiting for)
3. Kubernetes is just a bunch of thermostats
4. kubectl apply doesn't start anything. Here's what does
5. Kubernetes under the hood: want versus have

**Thumbnail text** (pair #1 with title #1)

1. STUCK ON PENDING
2. CREATED ≠ RUNNING
3. WAITING FOR WHAT?
4. WANT 3 · HAVE 2
5. JUST LOOPS

**Thumbnail layout:** Kubernetes helm-wheel logo left-of-center with a soft accent (#8b7cf6) glow on #141414 with a faint grid. Right side: a terminal-style card "deployment.apps/web created" with a green check, under it a pod row "web-x7k2p  Pending" with "Pending" in accent and a small clock, and above them "STUCK ON PENDING" in heavy uppercase sans, "PENDING" in accent. Nothing else.

**Description**

One container is easy. Three copies on three servers, and you become the person restarting them at 3 a.m. That is the job Kubernetes exists to take, and it does it in a way nobody expects: it is not a launcher, it is a room full of stubborn thermostats. We build it ourselves from a 4-item checklist: the API server as the shared notebook, controllers that compare what you want with what you have, the scheduler, the kubelet, and Services. And we finally find out why a pod can sit on Pending with no error.\n\nKey terms: cluster, control plane, desired state, control loop, controller, kubectl apply, API server, etcd, pod, ReplicaSet, Deployment, scheduler, node, kubelet, Service, kube-proxy.

**Chapters** (estimated)

```
0:00 The Problem
1:29 The Mystery
2:18 What We Need
2:54 Attempt 1: A Script
3:53 The Better Question
4:28 The Loop
5:01 The Notebook
5:43 The Replica Loop
6:23 The Scheduler
7:03 The Kubelet
7:42 The Notebook
8:23 Healing
9:05 Services
9:51 The Bill
10:38 The Big Idea
11:05 The Problem, Revisited
12:08 Proof
12:55 To Summarise
13:33 End
```

**Tags:** kubernetes, kubernetes tutorial, kubernetes for beginners, kubernetes explained, k8s, kubernetes architecture, why kubernetes, reconciliation loop, kubectl apply, how kubernetes works
