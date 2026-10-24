// ─────────────────────────────────────────────────────────────────────────────
// SINGLE SOURCE OF TRUTH for the voiceover (Script v1).
//
// • `text` is exactly what the TTS speaks. `{cue}` markers are stripped
//   before TTS; the voiceover tool records the second each marked word starts
//   and scenes animate on it with `yield* s.at('cue')`.
// • Edit words → `npm run voice` → everything re-syncs. Moving a marker is free.
//
// Voice: Kubernetes is a room full of stubborn thermostats that never talk to each
// other, only to one shared notebook (the API server). Jordan from the platform team
// carries the hook line. Handles: "want versus have" (the loop stamp) and "a bug report
// to a loop". Real story: the 2016 "Borg, Omega, and Kubernetes" paper calling the
// design choreography, not orchestration.
// Spoken spellings: "kube control" = kubectl, "kube-let" = kubelet.
// ─────────────────────────────────────────────────────────────────────────────

export const meta = {
  title: 'Kubernetes will finally make sense after this video',
  aha: "Kubernetes isn't a launcher. It's a set of loops that keep comparing what you asked for with what exists, and fixing the difference.",
  stance: 'Stop treating Kubernetes like a remote control for docker run. It is a room full of stubborn thermostats, and once you change what they want instead of fighting what they do, it stops feeling haunted.',
  audience: 'beginner + intermediate',
  hook: 'You delete a misbehaving pod, it comes back three seconds later with a new name, and Jordan from the platform team says "you can\'t kill it, the deployment wants it".',
  device: 'Requirements checklist (we build Kubernetes ourselves) + the reconcile stamp WANT 3 / HAVE 2 / ACT +1 that reappears for every loop',
  checklist: ['always 3 copies', 'picks the servers', 'heals on its own', 'one address'],
  terms: [
    {term: 'controller', scene: 'scene07', meaning: 'a thermostat for one kind of thing: read the want, compare with what you have, fix the difference, forever'},
    {term: 'API server', scene: 'scene08', meaning: 'the shared notebook every part of Kubernetes reads and writes (saved in a database, etcd)'},
    {term: 'pod', scene: 'scene09', meaning: 'one running copy of your app: one or more containers that live and die together'},
    {term: 'node', scene: 'scene10', meaning: 'Kubernetes\' word for one of our servers'},
    {term: 'kubelet', scene: 'scene11', meaning: 'the thermostat on each server that makes that server\'s pods real'},
    {term: 'Service', scene: 'scene14', meaning: 'one stable name and address that means "whichever web pods are alive right now"'},
  ],
  didntKnow: [
    {scene: 'scene08', text: 'kubectl apply starts nothing. It writes your file into the API server, which saves it in a database, and replies OK.'},
    {scene: 'scene09', text: 'The controller that "creates pods" also starts nothing. It writes three more entries in the notebook.'},
    {scene: 'scene10', text: "The scheduler's whole job is filling in one field of the pod: the node name."},
    {scene: 'scene12', text: 'No component ever calls another one. They all only read and write the API server, by design: "choreography, not orchestration".'},
    {scene: 'scene13', text: 'By default Kubernetes waits about five minutes before giving up on a dead server\'s pods.'},
    {scene: 'scene14', text: 'kube-proxy usually proxies nothing. It writes packet rules into the Linux kernel on every server, and the kernel forwards the traffic.'},
  ],
  verify: [
    'Scenes 01, 17, 18: "back in about three seconds" depends on the image already being on the node; the new pod object itself appears almost instantly.',
    'Scene 05: Docker restart policies (restart: always / unless-stopped) restart a container on the same Docker host only; plain Compose does not move containers to another machine.',
    'Scene 08: kubectl apply sends the object to kube-apiserver, which persists it in etcd (the usual backing store) and returns success before any Pod exists. Server-side vs client-side apply does not change this.',
    'Scene 09: strictly, a Deployment\'s controller creates a ReplicaSet, and the ReplicaSet controller creates the Pods. The narration calls it "the replica controller"; the visual can label it ReplicaSet.',
    'Scene 10: the scheduler binds a Pod via the pods/binding subresource, which sets spec.nodeName. "How much memory and CPU each has free" is a simplification: it filters and scores on resource requests, affinity, taints, etc.',
    'Scene 11: the kubelet talks to the container runtime (containerd or CRI-O) through the CRI, not to Docker Engine (dockershim removed in 1.24). It watches the API server for Pods bound to its node.',
    'Scene 12: components can talk to things outside the cluster (cloud APIs, the container runtime), and the API server itself talks to kubelets for logs/exec. The claim is about control-plane coordination: controllers, the scheduler and kubelets coordinate only through the API server.',
    'Scene 12: Burns, Grant, Oppenheimer, Brewer, Wilkes, "Borg, Omega, and Kubernetes", ACM Queue vol. 14 no. 1, 2016: "control through choreography … a conscious design choice in contrast to a centralized orchestration system". Check exact wording before quoting on screen.',
    'Scene 13: the node lifecycle controller taints an unreachable node (node.kubernetes.io/unreachable:NoExecute); Pods get a default toleration of 300 s, then are evicted. Node-monitor grace period (~40–50 s) comes first, so total is a bit over 5 minutes. StatefulSet pods may stay stuck.',
    'Scene 14: kube-proxy modes on Linux are iptables (default in current docs), nftables and IPVS; all program the kernel and no proxy sits in the data path. The name dates from the original userspace proxy mode (removed in 1.26). Some clusters replace kube-proxy entirely (e.g. Cilium eBPF).',
    'Scene 18: with kubectl get pods -w, the replacement pod usually shows up while the old one is still Terminating (default 30 s grace period), because the ReplicaSet stops counting a pod once it is marked for deletion.',
    'Scenes 01–04, 13, 17: pod names, three servers, "3 a.m." and Jordan are illustrative.',
  ],
  titles: [
    'Kubernetes will finally make sense after this video',
    'Why Kubernetes pods come back when you delete them',
    'Kubernetes is just a bunch of thermostats',
    "kubectl apply doesn't start anything. Here's what does",
    'Kubernetes under the hood: want versus have',
  ],
  thumbnails: ['IT CAME BACK', "YOU CAN'T KILL IT", 'WHO RESTARTED IT?', 'WANT 3 · HAVE 2', 'JUST LOOPS'],
  thumbnailLayout:
    'Kubernetes helm-wheel logo left-of-center with a soft accent (#8b7cf6) glow on #141414 with a faint grid. ' +
    'Right side: a small pod card "web-x7k2p" struck through in red (#ef4444), with an accent arrow curving back to a new card "web-q9m4t", ' +
    'and above them "IT CAME BACK" in heavy uppercase sans, "BACK" in accent. Nothing else.',
  description:
    'You delete a pod, and three seconds later it is back with a new name. Nobody restarted it. Kubernetes is not a launcher: ' +
    'it is a room full of stubborn thermostats. We build it ourselves from a 4-item checklist: the API server as the shared notebook, ' +
    'controllers that compare what you want with what you have, the scheduler, the kubelet, and Services.\\n\\n' +
    'Key terms: desired state, control loop, controller, kubectl apply, API server, etcd, pod, ReplicaSet, Deployment, scheduler, node, kubelet, Service, kube-proxy.',
  tags: ['kubernetes', 'kubernetes tutorial', 'kubernetes for beginners', 'kubernetes explained', 'k8s', 'kubernetes architecture',
    'kubernetes controllers', 'reconciliation loop', 'kubectl apply', 'how kubernetes works'],
};

export const scenes = [
  {id: 'scene01', label: 'THE PROBLEM', title: 'It came back',
    text: "{habit}Kubernetes has one habit that drives every beginner up the wall: it refuses to let things die. {pod}One copy of your web app is acting weird, {delete}so you do the obvious thing and delete it. {gone}Gone. {back}Three seconds later, it's back. Same app, brand new name. {again}Delete it again. {again2}Back again. {jordan}And Jordan from the platform team rolls their chair over and says: you can't kill it. The deployment wants it.",
    visual: [
      'Big line "it refuses to let things die" in accent, then it shrinks away',
      'Three pod cards in a row: web-a1b2c, web-x7k2p (red border, "acting weird"), web-m3n8d',
      'Terminal types "kubectl delete pod web-x7k2p" → "pod deleted"',
      'web-x7k2p fades out; empty slot',
      'A new card "web-q9m4t" fades into the slot, accent; a "3 s" chip',
      'Terminal types "kubectl delete pod web-q9m4t"',
      'Slot empties and refills again with "web-z5k1r"',
      'Chat chip bottom-right: "Jordan (platform): you can\'t kill it. the deployment wants it."',
    ],
    handsOff: '"so who brought it back?" (scene 02)'},

  {id: 'scene02', label: 'THE PROBLEM', title: 'Who brought it back?',
    text: "{who}So who brought it back? {log}Your terminal won't say. {confess}For my first year with Kubernetes, I treated it like a very expensive remote control for docker run. {wrong}That picture is wrong, and it's why Kubernetes feels like magic on good days and haunted on bad ones. {promise}By the end of this video, you'll know who brought that pod back, {fight}and why fighting it never works.",
    visual: [
      'Big "?" over the refilled slot',
      'Terminal output stays empty; dim chip "no error, no log"',
      'A remote-control icon labeled "docker run × many"',
      'The remote is struck through in red; small "magic / haunted" pair of labels',
      'The three pod cards return, a dashed accent loop arrow circling the refilled slot',
      'Loop arrow pulses; "delete" chip bounces off it',
    ],
    handsOff: '"let\'s build Kubernetes ourselves" (scene 03), after the channel intro'},

  {id: 'intro', intro: 'default'},

  {id: 'scene03', label: 'WHAT WE NEED', title: 'The checklist', term: 'none (introduces the checklist device)',
    text: "{build}Let's pretend we're building Kubernetes ourselves. {app}We have one web app, and three servers to run it on. {four}We need four things. {r1}One: keep three copies of the app running, always. {r2}Two: pick a server for each copy, without us choosing by hand. {r3}Three: heal on its own, even when a server dies at 3 a.m. {r4}And four: one address that reaches whichever copies are alive.",
    visual: [
      '"let\'s build it ourselves" appears',
      'APP box "web" center; three SERVER frames below: server-1, server-2, server-3 (the running example)',
      'Checklist panel center',
      'Row 1 "always 3 copies"',
      'Row 2 "picks the servers"',
      'Row 3 "heals on its own"',
      'Row 4 "one address"; then the panel shrinks into the top-right corner and stays',
    ],
    handsOff: '"the obvious first try is a script" (scene 04)'},

  {id: 'scene04', label: 'ATTEMPT 1: A SCRIPT', title: 'The script that went home',
    text: "{obvious}The obvious first try is a script. {each}For each server, connect, and start the app. {run}Three copies. {picks}It even picks the servers, sort of: we typed their names in by hand. That doesn't count. {dies}Now server two dies at 3 a.m. {finished}The script finished hours ago. {home}It printed done, and went home. {two}You have two copies, and nobody knows. {addr}And there's no single address, just three server names you hand out and hope.",
    visual: [
      'Code panel left: "for s in server-1 server-2 server-3: ssh $s docker run web"',
      'Arrows from the script to each SERVER frame in turn',
      'A web container appears in each server; checklist box 1 green',
      'The hard-coded names highlight; checklist box 2 red cross',
      'server-2 turns red, its container disappears; clock chip "3:00 a.m."',
      'Script panel shows "done." and dims',
      'Script panel fades out completely: "exited"',
      'Copy counter "2 / 3" in red; checklist box 1 turns to red cross; box 3 red cross',
      'Three server names as loose chips; checklist box 4 red cross',
    ],
    handsOff: '"just add a restart policy?" (scene 05)'},

  {id: 'scene05', label: 'ATTEMPT 1: A SCRIPT', title: 'Just restart it?',
    text: "{think}You might be thinking: just add a restart policy. {restart}Sure. Docker will restart a crashed container, {same}on the same machine. {machine}But at 3 a.m., the machine is the thing that died, and its restart policy died with it. {once}Both fixes act once, {after}and then nothing is watching.",
    visual: [
      'Chip "restart: always" attaches to the web container on server-1',
      'Container on server-1 crashes red, then comes back green with a small loop arrow',
      'The loop arrow is drawn inside server-1\'s frame only',
      'Callback: server-2 red and dark from scene 04; its restart loop arrow fades away with it',
      'Timeline bar: a single accent tick "started" at the left',
      'Rest of the timeline empty and dim, labeled "nobody watching"',
    ],
    handsOff: '"let\'s ask a better question" (scene 06)'},

  {id: 'scene06', label: 'THE BETTER QUESTION', title: 'Always, not once',
    text: "{reset}Okay. Let's look under the abstraction, and ask a better question. {old}The script answers: how do I start three copies? {new}The better question is: how do I make sure there are always three? {once}Starting happens once. {always}Always means someone keeps checking. {thermo}We need a thermostat. {want}You set what you want: 21 degrees. {have}It measures what you have: 19. {act}And it acts on the difference. Not once. Forever.",
    visual: [
      'Checklist resets to four empty boxes; script and servers fade',
      '"how do I start 3 copies?" (dim)',
      '"how do I make sure there are always 3?" (accent) appears under it',
      'Word "once" under the first line',
      'Word "always" under the second line, accent',
      'Thermostat dial icon center',
      'WANT column: "21°"',
      'HAVE column: "19°"',
      'Diff arrow between them, "ACT: heat on"; arrow loops back to WANT',
    ],
    handsOff: '"Kubernetes is built out of thermostats" (scene 07)'},

  {id: 'scene07', label: 'THE LOOP', title: 'Want versus have', term: 'controller = a thermostat for one kind of thing',
    text: "{built}Kubernetes is built out of thermostats. {name}Each one is a small program called a controller, running three steps in a loop. {read}Read what you want. {compare}Compare it with what you have. {fix}Fix the difference. {again}Then again. And again. {stamp}Want three, have two? Act: plus one. I call it want versus have, and honestly, it's the only idea in this video. {stubborn}A controller never finishes, and it never trusts that things stayed fixed.",
    visual: [
      'Thermostat icon multiplies into a row of small controller boxes',
      'Term card "controller = a thermostat"; one controller box zooms center',
      'Loop diagram around it: READ step lights up',
      'COMPARE step lights up',
      'FIX step lights up',
      'Loop arrow spins back to READ, twice',
      'The reconcile stamp appears for the first time: WANT 3 / HAVE 2 / ACT +1 (ACT in accent)',
      'Loop keeps spinning slowly; label "never done"',
    ],
    handsOff: '"so where does the want live?" (scene 08)'},

  {id: 'scene08', label: 'THE NOTEBOOK', title: 'Apply starts nothing', term: 'API server = the shared notebook',
    text: "{where}So where does the want live? {file}In a file: a deployment called web, with three replicas. {apply}You run kube control apply. {fav}And now my favourite fact about Kubernetes. {nothing}Apply doesn't start anything. {sends}It sends your file to one program, the API server, {db}which saves it in a database {ok}and replies: OK. {zero}Zero containers are running. {wish}All you've done is write down a wish. {objection}But my pods did start, you say. They did. Just not because of apply.",
    visual: [
      'Empty WANT column with a "?"',
      'YAML panel: "kind: Deployment / name: web / replicas: 3", replicas line in accent',
      'Terminal types "kubectl apply -f web.yaml"',
      'Terminal dims; small "fun fact" tag',
      '"starts nothing" in accent',
      'Arrow from terminal to a box API SERVER; term card "API server = the shared notebook"',
      'Notebook icon "etcd" under API SERVER; the YAML slides into it as one entry "web: want 3"',
      'Terminal prints "deployment.apps/web created"',
      'Three empty server frames, counter "running: 0"',
      'Notebook entry gets a small "wish" tag',
      'Dim chip "but my pods started…" then a dashed line from the notebook toward "something else?"',
    ],
    handsOff: '"writing the wish wakes up the first thermostat" (scene 09)'},

  {id: 'scene09', label: 'THE REPLICA LOOP', title: 'Paperwork', term: 'pod = one running copy of your app',
    text: "{wakes}The wish wakes up the first thermostat: the replica controller. {reads}It reads the notebook. {want}Want: three copies of web. {have}Have: zero. {act}So it creates three pods. {pod}A pod is one running copy of your app: one or more containers that live and die together. {closer}But look closer. {records}It didn't run anything either. It wrote three more entries in the notebook. {paper}Kubernetes is extremely good at paperwork. {hook}And this is the thermostat that brought your pod back.",
    visual: [
      'Controller box "replica controller" appears left of the API SERVER; arrow to the notebook',
      'Arrow reads "web: want 3"',
      'Stamp: WANT 3',
      'Stamp: HAVE 0',
      'Stamp: ACT +3 in accent',
      'Term card "pod = one running copy"',
      'Zoom into the notebook',
      'Three new entries: "pod web-a1b2c · node: ___" ×3, all inside the notebook',
      'Server frames still empty; "running: 0"',
      'Callback: the scene 01 three-card row flashes up beside it, the refilled slot pulsing',
    ],
    handsOff: '"each new pod has an empty field: node" (scene 10)'},

  {id: 'scene10', label: 'THE SCHEDULER', title: 'One blank to fill', term: 'node = one of our servers',
    text: "{empty}Each new pod has an empty field, {field}called node. A node is just Kubernetes' word for one of our servers. {sched}The next thermostat, the scheduler, watches for pods with that field blank. {looks}It checks how much room each server has left, {picks}picks the best fit, {writes}and writes that server's name into the blank. {whole}That's the scheduler's entire job. {not}It doesn't start anything. {blank}It fills in one blank. {hand}And nobody typed a server name by hand.",
    visual: [
      'Pod entry close-up: "node: ___" field highlighted',
      'Term card "node = a server"; the three server frames relabel node-1, node-2, node-3',
      'Controller box "scheduler" appears; arrow to the notebook; stamp WANT: node set / HAVE: blank',
      'Free-room bars over each node',
      'node-2 bar highlights as best fit',
      '"node-2" types into the field in accent; then node-1 and node-3 into the other two pods',
      '"entire job: 1 field" chip',
      'Crossed-out chips "start" and "copy"',
      'All three pod entries show filled node fields',
      'Checklist box 2 green',
    ],
    handsOff: '"so who actually runs anything?" (scene 11)'},

  {id: 'scene11', label: 'THE KUBELET', title: 'Making it real', term: 'kubelet = the thermostat on each server',
    text: "{who}So who actually runs anything? {agent}Every server has a small agent called the kube-let. {own}Another thermostat, but it only cares about its own server. {want}Want: every pod with my name on it. {have}Have: what's running on me right now. {act}Want one, have zero, so it tells the container engine to start one. {docker}That container is the same thing from our Docker video: an ordinary process, with blinders on. {three}Three servers, three copies. {finally}After a file, a notebook and three thermostats, something has finally started.",
    visual: [
      'Notebook with three pod entries; "running: 0" counter',
      'Small "kubelet" box appears inside each node frame; term card "kubelet = the thermostat on each server"',
      'node-2\'s kubelet highlights; others dim',
      'Arrow from node-2\'s kubelet up to the notebook; stamp WANT: pods for node-2',
      'Stamp HAVE: 0 running',
      'Stamp ACT +1; a web container fades in inside node-2',
      'Container zooms: "process + blinders" (the namespace wall from 001)',
      'All three kubelets act; one container per node; checklist box 1 green',
      'Chain under the frame: file → notebook → replica → scheduler → kubelet; "running: 3" in green',
    ],
    handsOff: '"now notice who talked to whom" (scene 12)'},

  {id: 'scene12', label: 'THE NOTEBOOK', title: 'Choreography, not orchestration',
    text: "{notice}Now notice who talked to whom. {sched}The scheduler never called a kube-let. {repl}The replica controller never called the scheduler. {nobody}Nobody calls anybody. {all}They only read and write the notebook, and react to what changes. {story}That's deliberate. In 2016, the Google engineers behind Borg, Kubernetes' ancestor, wrote a paper about it. {chor}They called the design choreography, not orchestration. {conductor}No conductor shouting cues. {dancers}Just dancers, all watching the same floor. {kill}Kill any one of them, restart it, {resume}and it reads the notebook and carries on.",
    visual: [
      'Hub diagram: API SERVER + notebook center; replica controller, scheduler, three kubelets around it',
      'Dashed line scheduler → kubelet, struck through in red',
      'Dashed line replica controller → scheduler, struck through in red',
      'All direct lines gone',
      'Every component gets a solid arrow to the center only; arrows pulse in accent',
      'Paper card: "Borg, Omega, and Kubernetes · ACM Queue · 2016"',
      'Quote line "choreography, not orchestration" in accent',
      'Conductor baton icon struck through',
      'Components orbit the center',
      'The scheduler box fades out, then back in',
      'Its arrow to the notebook reconnects; "picks up where it was"',
    ],
    handsOff: '"back to 3 a.m." (scene 13)'},

  {id: 'scene13', label: 'HEALING', title: 'Back to 3 a.m.',
    text: "{back}Which brings us back to 3 a.m. {dies}Server two dies. {silent}Its kube-let stops checking in. {node}Another thermostat, the node controller, notices the silence {marks}and marks server two unreachable. {wait}Then it waits, about five minutes by default, in case it's only a bad moment. {evict}After that, its pods are struck from the books. {replica}And the replica controller does its thing. Want three, have two. {plus}Plus one. {sched}The scheduler fills in a server, {kubelet}a kube-let starts it. {sleep}Nobody woke up. Not you, not even Jordan. A dead server is just a very large bug report.",
    visual: [
      'Callback: the scene 04 frame: three node frames, clock chip "3:00 a.m."',
      'node-2 turns red and dark; its container disappears',
      'node-2 kubelet arrow to the notebook breaks',
      'Controller box "node controller" appears; arrow to the notebook',
      'node-2 entry in the notebook gets an "unreachable" tag in red',
      'Timer chip counts "5:00" down',
      'Pod entry for node-2 is struck out of the notebook',
      'Replica controller lights up; stamp WANT 3 / HAVE 2',
      'Stamp ACT +1 in accent; a new pod entry "node: ___"',
      'Scheduler writes "node-3" into it',
      'node-3\'s kubelet starts a second container there; "running: 3"',
      'Checklist box 3 green; a sleeping "zzz" over the clock chip',
    ],
    handsOff: '"one box left: one address" (scene 14)'},

  {id: 'scene14', label: 'SERVICES', title: 'A proxy that proxies nothing', term: 'Service = one stable address for whichever pods are alive',
    text: "{left}One box left: one address. {come}Pods come and go, and each new one gets a new address. {service}So you add a Service: one stable name, web, meaning whichever web pods are alive right now. {expect}You'd expect a program sitting at that address, passing traffic along. {nope}Nope. {rules}On every server, one more thermostat, kube proxy, reads the notebook and writes packet rules into the Linux kernel: traffic for web goes to one of these pods. {kernel}The kernel forwards it itself. {name}So despite the name, kube proxy usually proxies nothing. {rewrite}When a pod is replaced, it just rewrites the rules.",
    visual: [
      'Checklist box 4 pulses',
      'Three pods with addresses 10.1.0.4, 10.1.2.7, 10.1.3.9; one fades and returns as 10.1.3.12',
      'SERVICE box "web · 10.96.0.10" in accent above the pods; term card "Service = one stable address"',
      'Dashed "proxy?" box appears between the Service and the pods',
      'The dashed box gets a red cross and fades',
      '"kube-proxy" box on each node reads from the notebook; a rule list appears: "→ 10.96.0.10: pick 10.1.0.4 | 10.1.2.7 | 10.1.3.12"',
      'Rule list moves into a KERNEL bar at the bottom of each node; a request dot flows straight from the kernel to one pod',
      '"kube-proxy: proxies nothing" chip',
      'A pod is replaced; one line of the rule list rewrites in accent; checklist box 4 green: all four done',
    ],
    handsOff: '"this design isn\'t free" (scene 15)'},

  {id: 'scene15', label: 'THE BILL', title: 'Nobody is in charge',
    text: "{free}This design isn't free. Here's the bill. {charge}Nobody is in charge, so when something breaks, no single place says why. {spread}The answer is scattered across a dozen loops, each doing exactly what it was told. {slow}Healing isn't instant either: we just waited five minutes. {small}And for one app on one server, it's a lot of machinery. A script and a restart policy would honestly do. {still}But across many servers at 3 a.m., I'll take a room full of stubborn thermostats over a script that went home.",
    visual: [
      'Hub diagram from scene 12, dimmed; "the bill" heading',
      'Center label "in charge: nobody"; a red "why?" chip',
      'Each component box gets a small log snippet; the snippets scatter',
      'The "5:00" timer chip from scene 13',
      'Single server frame with a script panel and "restart: always" chip, green',
      'Scale-up: many node frames, clock "3:00 a.m."; the loops spin green while a script panel shows "exited"',
    ],
    handsOff: '"so, putting it all together" (scene 16)'},

  {id: 'scene16', label: 'THE BIG IDEA', title: 'The big idea',
    text: "{together}Let's put it all together. {apply}Apply writes what you want into the notebook. {ctrl}Controllers compare it with what you have. {sched}The scheduler fills in a server. {kubelet}The kube-let makes it real. {proxy}And kube proxy points the address at it. {aha}Kubernetes isn't a launcher. {loops}It's a set of loops, comparing what you asked for with what exists, {fix}and fixing the difference.",
    visual: [
      'Summary panel top-left: "Kubernetes ="',
      'Row "kubectl apply → writes the want"',
      'Row "controllers → want vs have" with the WANT 3 / HAVE 2 / ACT +1 stamp',
      'Row "scheduler → fills in node"',
      'Row "kubelet → starts containers"',
      'Row "kube-proxy → kernel rules"; checklist pulses all green',
      '"not a launcher" struck through',
      '"a set of loops: want vs have" big in accent',
      '"fixing the difference" under it',
    ],
    handsOff: '"back to the pod that wouldn\'t die" (scene 17)'},

  {id: 'scene17', label: 'THE PROBLEM, REVISITED', title: 'A bug report to a loop',
    text: "{back}Now, back to the pod that wouldn't die. {delete}You deleted it. {looked}The replica controller looked. Want three, have two. {plus}Plus one. {report}What you actually did was file a bug report to a loop, and the loop fixed it in three seconds. {fewer}Want fewer pods? Change the want. {scale}Set replicas to two, and apply. {stays}Now it stays gone. {jordan}Jordan was right, by the way. You can't kill it. You can only change its mind.",
    visual: [
      'Callback: the exact scene 01 frame: three pod cards, terminal "kubectl delete pod web-x7k2p"',
      'web-x7k2p fades out',
      'Reconcile stamp beside it: WANT 3 / HAVE 2',
      'ACT +1; web-q9m4t fades into the slot',
      'Chip "delete = a bug report to a loop" in accent',
      'YAML panel from scene 08; "replicas: 3" highlights',
      'It changes to "replicas: 2"; terminal "kubectl apply -f web.yaml"; stamp WANT 2 / HAVE 3 / ACT −1',
      'Slot empties and stays empty; green check',
      'Jordan\'s chat chip returns, now with a green check',
    ],
    handsOff: '"want to watch the loop yourself?" (scene 18)'},

  {id: 'scene18', label: 'PROOF', title: 'Watch the loop',
    text: "{proof}Want to watch the loop yourself? {watch}Run kube control get pods, dash w, for watch. {delete}Delete a pod from a second terminal, {see}and a new name appears before the old one is even gone. {aphorism}Kubernetes never does what you say. It does what you want, over and over. {question}Have you ever deleted something again and again before you found the loop that kept putting it back? What was it?",
    visual: [
      'Two terminals side by side',
      'Left types "kubectl get pods -w"; pod list streams',
      'Right types "kubectl delete pod web-q9m4t"',
      'Left shows "web-h2v6p ContainerCreating" (new name in accent) while "web-q9m4t Terminating" is still listed',
      '"It does what you want. Over and over." in accent',
      'Question card with the loop arrow icon',
    ],
    handsOff: '"so, to summarise everything" (scene 19)'},

  // ── standard channel ending (VIDEO_BRIEF §3.4 steps 10–11) ──
  {id: 'scene19', label: 'TO SUMMARISE', title: 'Summary', bed: true,
    text: "{sum}To summarise everything. {p1}Apply doesn't start anything. It writes the want into the API server, the shared notebook. {p2}Controllers compare want with have, and fix the difference, forever. {p3}The scheduler fills in a server name, and that server's kube-let makes it real. {p4}Delete a pod, and you've filed a bug report to a loop. Change the want instead. {aha}Kubernetes isn't a launcher. It's a room full of stubborn thermostats.",
    visual: [
      'Heading "to summarise everything"; the outro music bed fades in',
      'Point 01 "kubectl apply only writes the want"',
      'Point 02 "controllers: want vs have, forever"',
      'Point 03 "scheduler fills in a node; kubelet makes it real"',
      'Point 04 "delete a pod = a bug report to a loop"',
      'Aha line in accent: "Not a launcher. A room full of stubborn thermostats."',
    ],
    handsOff: 'the end card (scene 20)'},

  {id: 'scene20', label: 'END', title: 'End card', endCard: true,
    text: "{like}If you liked the video, drop a like {sub}and subscribe, {next}and tell me what topics you want to see next.",
    visual: ['like() chip', 'subscribe() chip; cursor clicks → subscribed() ✓', 'suggest(next_topic) chip with blinking caret; hold for the YouTube end screen'],
  },
];
