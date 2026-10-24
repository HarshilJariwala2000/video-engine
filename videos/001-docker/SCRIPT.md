# Docker will finally make sense after this video

**Aha:** A container isn't a tiny computer. It's an ordinary process the kernel is lying to.  
**Audience:** beginner + intermediate  
**Length:** 1153 words, 7:23 (measured from ElevenLabs audio)

> Generated from `narration/script.mjs`. Edit that file, not this one, then run `npm run voice && npm run script`.

---

### SCENE 01: Works on my machine
LABEL: THE PROBLEM
NARRATION:
"Your app works perfectly on your laptop. You put it on a server, and it crashes. The server has a different Node version. A library is missing. A setting is different. Docker's promise is simple: pack the app together with everything it needs, so it runs the same everywhere."
VISUAL:
- LAPTOP frame with my-app and a green check
- Arrow to SERVER frame; my-app inside, red cross
- Three red chips under the server: node 18 ≠ 22, libssl missing, PORT unset
- Dashed accent package wraps my-app + "node 22 + libs + config"; it moves to the server; both green
EST. DURATION: 18.4 s

### SCENE 02: The mystery
LABEL: THE PROBLEM
NARRATION:
"Docker calls that package a container. And here's the strange part. A container acts like its own little computer, with its own files and its own network. Yet it starts in about a second, and your laptop can run dozens of them. How can something act like a whole computer and cost almost nothing? By the end of this video, you'll know exactly how."
VISUAL:
- Dashed box titled CONTAINER
- A file tree and a network chip appear inside
- "starts in ~1 s" in accent
- Box multiplies into a 6×4 grid inside a LAPTOP frame
- Big "?" over the dimmed grid
EST. DURATION: 21.9 s

### SCENE 03: The checklist
LABEL: WHAT AN APP NEEDS
NEW TERM: none (introduces the checklist device)
NARRATION:
"Let's pretend we're building Docker ourselves. To run safely next to other apps, our app needs four things. One: its own files, in the exact versions it was built with. Two: it can't see or bump into other apps. Three: it can't hog the whole machine. And four: it has to be cheap and quick to start."
VISUAL:
- "let's build Docker ourselves" appears
- Checklist panel center; four empty rows appear one per item
- Panel shrinks into the top-right corner and stays
EST. DURATION: 22.8 s

### SCENE 04: Attempt one: a virtual machine
LABEL: ATTEMPT 1: VIRTUAL MACHINES
NEW TERM: virtual machine = a pretend computer made of software
NARRATION:
"The obvious answer is a virtual machine. That's a pretend computer, made out of software, running inside your real one. Give every app its own pretend computer, with a full operating system inside, and the apps can't get in each other's way."
VISUAL:
- REAL COMPUTER frame
- Dashed VM 1 appears inside; then VM 2, VM 3
- APP + OPERATING SYSTEM boxes inside each VM
- VM outlines turn accent
EST. DURATION: 15.7 s

### SCENE 05: What a kernel is
LABEL: ATTEMPT 1: VIRTUAL MACHINES
NEW TERM: kernel = the computer's manager; process = a running program
NARRATION:
"One word matters for the rest of this video, so let's zoom in. At the center of every operating system is a program called the kernel. Think of it as the computer's manager. It starts every program, hands out memory, and decides who can touch which files. And a program that's running has a name too: a process."
VISUAL:
- Zoom into VM 1's OPERATING SYSTEM box
- KERNEL box in accent at its center
- Term card "kernel = the computer's manager"
- Arrows from KERNEL to my-app, MEMORY, FILES as each job is spoken
- my-app gets "running = process"
EST. DURATION: 20.4 s

### SCENE 06: Why VMs are heavy
LABEL: ATTEMPT 1: VIRTUAL MACHINES
NARRATION:
"So with virtual machines, every app gets its own operating system and its own kernel. That checks the first three boxes. But three apps means three full operating systems, each one booting from scratch, each one using gigabytes of memory. Box four, cheap and quick, fails."
VISUAL:
- Zoom back out to the three VMs
- KERNEL appears in each VM
- Checklist boxes 1–3 green
- Boot bars fill above each VM; "GBs of RAM" under each
- Checklist box 4 red cross
EST. DURATION: 19.8 s

### SCENE 07: A better question
LABEL: ATTEMPT 2: THE TRICK
NARRATION:
"So let's ask a better question. Does our app really need its own computer? Or does it only need to believe it has one? Remember: the kernel is the manager. It already decides what every process gets. So what if the kernel simply showed our app a smaller world?"
VISUAL:
- Checklist resets; VMs fade, one KERNEL bar remains with my-app on top
- "needs its own computer?" (dim) then "believes it has one?" (accent)
- Kernel labeled "the manager"; arrow up to my-app
- Dashed accent outline previews around my-app
EST. DURATION: 17.4 s

### SCENE 08: What a process sees
LABEL: ATTEMPT 2: THE TRICK
NEW TERM: PID = process ID
NARRATION:
"Here's what a normal process sees today. Every other program on the machine, each one with an ID number the kernel gave it. That number is called a PID, short for process ID. It also sees every file on the disk, and every network connection. Nothing is hidden."
VISUAL:
- my-app / PID 48213 center
- Left: list of other processes; their ID numbers highlight
- Term card "PID = process ID"
- File tree top-right; network bottom-right; arrows to all three
EST. DURATION: 17.6 s

### SCENE 09: Blinders: namespaces
LABEL: NAMESPACES
NEW TERM: namespace = blinders
NARRATION:
"Linux has a feature for exactly this, called namespaces. Think of a namespace as blinders. It changes what a process can see, and nothing else. Put blinders on our app, and the other programs vanish. It even believes it's process number one, the very first program on the machine. That's a lie. From the outside, it's still process 48213."
VISUAL:
- Term card "namespace = blinders"
- Dashed accent wall draws around my-app
- Process list fades almost to nothing
- PID 48213 → PID 1
- "from outside: PID 48213"
EST. DURATION: 25.2 s

### SCENE 10: Its own files
LABEL: NAMESPACES
NARRATION:
"The same blinders work for files. Point the app at one ordinary folder on the server, and that folder becomes its whole world. When the app looks at the top of its file system, all it finds is what's inside that folder. Everything else on the disk is invisible."
VISUAL:
- Host tree highlights /containers/app1
- Wall widens; the folder slides inside and becomes "/"
- "$ ls /" → "bin etc app"
- Rest of the host tree fades away
EST. DURATION: 16.3 s

### SCENE 11: Its own network
LABEL: NAMESPACES
NEW TERM: port 80 = the standard port for websites
NARRATION:
"And the same for the network. The app gets its own network address. So two apps can both use port 80, the standard port for websites, and they never collide. Each one thinks it's the only one. That's box two: our app can't see or bump into anything else."
VISUAL:
- Network chip with its own address inside the wall
- Second wall with other-app
- :80 badges on both; "no collision" in green
- Checklist box 2 green
EST. DURATION: 17.5 s

### SCENE 12: A budget: cgroups
LABEL: CONTROL GROUPS
NEW TERM: cgroup = a budget
NARRATION:
"But blinders only hide things. A hidden app can still eat all the memory and slow everyone down. So Linux has a second feature, called control groups, or cgroups. A cgroup is a budget. Half of one CPU core. 512 megabytes of memory. If the app goes over its memory budget, the kernel shuts it down. That's box three."
VISUAL:
- Shared memory bar: my-app grows and squeezes other-app
- Term card "cgroup = a budget"
- CPU meter to 0.5 core; MEMORY meter with 512 MB limit
- Memory overflows, red; my-app "shut down"
- Checklist box 3 green
EST. DURATION: 23.6 s

### SCENE 13: Why it's fast
LABEL: ONE SHARED KERNEL
NARRATION:
"Now look at what we've built. One machine. One kernel. And a few ordinary processes, each with blinders and a budget. There's no second operating system to boot. Starting a container is just starting a process, and that's why it takes about a second. Box four. Three boxes done, and they all came from the same trick: the kernel showing a process a smaller world."
VISUAL:
- Dimmed three-VM figure on the left
- Right: HARDWARE, ONE KERNEL, three walled processes
- "0 extra operating systems", then "starts in ~1 s"
- Checklist box 4 green; box 1 pulses as still open
EST. DURATION: 26.4 s

### SCENE 14: What about Mac and Windows?
LABEL: ONE SHARED KERNEL
NARRATION:
"One catch. These blinders and budgets are Linux kernel features. So on a Mac or Windows, Docker Desktop quietly runs one small Linux virtual machine in the background. Just one, shared by all your containers."
VISUAL:
- Kernel becomes LINUX KERNEL
- Bottom bar becomes MAC / WINDOWS
- Dashed "1 small Linux VM" box wraps kernel + containers
EST. DURATION: 15.0 s

### SCENE 15: Images: the last box
LABEL: IMAGES
NEW TERM: image = the bundle of files shipped with the app
NARRATION:
"That leaves box one: the files. Remember the crash from the beginning? The server had the wrong files. So the fix is to ship the files with the app. That bundle is called an image. It holds a small set of Linux tools, the right Node version, your libraries, and your code. When the container starts, the image's files fill that private folder. Box one."
VISUAL:
- Checklist box 1 pulses
- Callback: the red SERVER from scene 01 with its chips
- IMAGE box; linux tools, node 22, libraries, your code stack inside
- Arrow into the walled "/" folder; files fill it
- Checklist box 1 green: all four done
EST. DURATION: 24.7 s

### SCENE 16: No kernel inside
LABEL: IMAGES
NARRATION:
"Now notice what an image does not contain: a kernel. The image brings the files. The server brings the kernel. That's why an image is often tens of megabytes, while a virtual machine's disk is usually gigabytes."
VISUAL:
- Dashed "kernel?" slot in the IMAGE, then a red cross
- IMAGE = files + SERVER = kernel
- Size bars: image tens of MB vs VM disk GBs
EST. DURATION: 15.8 s

### SCENE 17: A recipe: the Dockerfile
LABEL: IMAGES
NEW TERM: Dockerfile = a recipe; layer = one step's files
NARRATION:
"You describe an image with a short recipe called a Dockerfile. Each step adds a layer: a set of files stacked on top of the step before. Start from a base with Linux tools and Node. Copy in your list of dependencies. Install them. Then copy in your code. Four steps, four layers."
VISUAL:
- Dockerfile panel left
- Each line highlights and its layer stacks up on the right
- "4 steps → 4 layers"
EST. DURATION: 20.3 s

### SCENE 18: Layers never change
LABEL: LAYERS
NEW TERM: copy-on-write
NARRATION:
"Here's what most people don't know. Image layers are read-only. They never change. When a container runs, Docker adds one thin layer on top, just for that container. Any file the app changes is copied up into that top layer first. This trick is called copy-on-write. It's why ten containers can share one image, and why a fresh container always starts perfectly clean."
VISUAL:
- read-only tags beside each layer
- Thin dashed accent "container's own layer" on top
- config.json copies up and gets edited
- Top bar splits into container 1/2/3 on one image
- One top bar is deleted and replaced by a fresh one
EST. DURATION: 25.9 s

### SCENE 19: Why step order matters
LABEL: BUILD CACHE
NARRATION:
"Layers also make rebuilds fast. Docker keeps every layer it has built. Change one line of your code, and every step before copying your code is reused as-is. Only the last steps run again. That's why good Dockerfiles install dependencies before copying the code. Do it the other way around, and every tiny edit reinstalls everything."
VISUAL:
- Dockerfile panel; "server.js: 1 line changed" points at COPY . .
- REUSED tags on earlier lines; RUN on the last
- Bracket "dependencies first"
- Swapped order in red; "any edit → reinstall everything"
EST. DURATION: 23.5 s

### SCENE 20: The big idea
LABEL: THE BIG IDEA
NARRATION:
"So let's put it all together. A container is a normal process. Namespaces decide what it can see. Cgroups decide how much it can use. And an image gives it its own files. It isn't a tiny computer. It's an ordinary process that the kernel is lying to."
VISUAL:
- "container =" top-left
- Rows appear; matching checklist box pulses
- "not a tiny computer" struck through
- "an ordinary process the kernel is lying to." big in accent
EST. DURATION: 17.9 s

### SCENE 21: docker run, revisited
LABEL: DOCKER RUN, REVISITED
NARRATION:
"Now watch docker run again. Docker downloads any image layers you don't have yet. It stacks them and adds a thin writable layer. It puts on the blinders and sets the budget. Then it starts your app as one ordinary process. The same files on your laptop and on the server, so no more works on my machine. And no extra operating system, so it starts in about a second."
VISUAL:
- Terminal types "docker run my-app"
- Layers slide in from REGISTRY; writable layer on top
- Wall draws; budget tag
- my-app / PID 1 inside
- Callback: laptop + server, same container in both, both green
- "starts in ~1 s"
EST. DURATION: 23.9 s

### SCENE 22: Proof
LABEL: DOCKER RUN, REVISITED
NEW TERM: ps = lists running programs
NARRATION:
"Want proof? On a Linux server, run ps, the command that lists every running program. Your container is right there in the list. Just a normal process, with a very convincing view."
VISUAL:
- Host terminal types "ps -e"; process list appears
- 48213 my-app row highlights
- The wall un-draws; "just a process." in accent
EST. DURATION: 13.3 s

## Scene table (measured from ElevenLabs audio)

| # | Label | Seconds | Words |
|---|---|---|---|
| 01 | THE PROBLEM | 18.4 | 49 |
| 02 | THE PROBLEM | 21.9 | 64 |
| 03 | WHAT AN APP NEEDS | 22.8 | 57 |
| 04 | ATTEMPT 1: VIRTUAL MACHINES | 15.7 | 42 |
| 05 | ATTEMPT 1: VIRTUAL MACHINES | 20.4 | 58 |
| 06 | ATTEMPT 1: VIRTUAL MACHINES | 19.8 | 46 |
| 07 | ATTEMPT 2: THE TRICK | 17.4 | 49 |
| 08 | ATTEMPT 2: THE TRICK | 17.6 | 48 |
| 09 | NAMESPACES | 25.2 | 59 |
| 10 | NAMESPACES | 16.3 | 49 |
| 11 | NAMESPACES | 17.5 | 49 |
| 12 | CONTROL GROUPS | 23.6 | 59 |
| 13 | ONE SHARED KERNEL | 26.4 | 65 |
| 14 | ONE SHARED KERNEL | 15.0 | 35 |
| 15 | IMAGES | 24.7 | 65 |
| 16 | IMAGES | 15.8 | 37 |
| 17 | IMAGES | 20.3 | 53 |
| 18 | LAYERS | 25.9 | 63 |
| 19 | BUILD CACHE | 23.5 | 56 |
| 20 | THE BIG IDEA | 17.9 | 48 |
| 21 | DOCKER RUN, REVISITED | 23.9 | 70 |
| 22 | DOCKER RUN, REVISITED | 13.3 | 32 |

## Term table

| Scene | Term |
|---|---|
| 03 | none (introduces the checklist device) |
| 04 | virtual machine = a pretend computer made of software |
| 05 | kernel = the computer's manager; process = a running program |
| 08 | PID = process ID |
| 09 | namespace = blinders |
| 11 | port 80 = the standard port for websites |
| 12 | cgroup = a budget |
| 15 | image = the bundle of files shipped with the app |
| 17 | Dockerfile = a recipe; layer = one step's files |
| 18 | copy-on-write |
| 22 | ps = lists running programs |

## [VERIFY] before publishing

- [ ] Scenes 02, 13, 21: "starts in about a second" holds for small images that are already downloaded. The first download takes longer.
- [ ] Scene 06: "gigabytes of memory" per VM is typical but depends on how each VM is configured.
- [ ] Scene 12: "the kernel shuts it down". The kernel's out-of-memory killer ends a process in the group when memory over the limit can't be freed.
- [ ] Scene 14: on Windows, Docker Desktop uses WSL 2 (a lightweight Linux VM). Native Windows containers are not covered.
- [ ] Scene 16: "often tens of megabytes" is true for Alpine-based images; Debian-based images such as plain node:22 are several hundred megabytes.
- [ ] Scenes 01, 10, 22: the error chips, "/containers/app1" and PID 48213 are illustrative, not real Docker output.

## Packaging

**Titles**

1. Docker will finally make sense after this video
2. A container is NOT a lightweight VM
3. Docker under the hood: the process the kernel lies to
4. "Works on my machine" is solved by a lie. Here's how Docker works
5. What actually happens when you type docker run

**Thumbnail text** (pair #1 with title #1)

1. NOT A VM
2. IT'S JUST A PROCESS
3. THE KERNEL LIES
4. WHAT IS IT REALLY?
5. NO VM INSIDE

**Thumbnail layout:** Docker whale logo left-of-center with a soft accent (#8b7cf6) glow on #141414 with a faint grid. Right side: "NOT A VM" in heavy uppercase sans, "VM" struck through in red (#ef4444). Nothing else.

**Description**

Your app works on your laptop and crashes on the server. Docker fixes that, and it does it without a virtual machine. We design Docker ourselves from a 4-item checklist: blinders (namespaces), a budget (cgroups), and a bundle of files (images).\n\nKey terms: container, process, kernel, PID, namespaces, cgroups, image, Dockerfile, layers, copy-on-write, build cache.

**Chapters** (measured from ElevenLabs audio)

```
0:00 The Problem
0:40 What An App Needs
1:03 Attempt 1: Virtual Machines
1:58 Attempt 2: The Trick
2:34 Namespaces
3:33 Control Groups
3:56 One Shared Kernel
4:38 Images
5:38 Layers
6:04 Build Cache
6:28 The Big Idea
6:46 Docker Run, Revisited
```

**Tags:** docker, docker tutorial, docker for beginners, containers, docker explained, docker vs virtual machine, linux namespaces, cgroups, docker image layers, how docker works
