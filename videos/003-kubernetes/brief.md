# Brief: Kubernetes will finally make sense after this video

> VIDEO_BRIEF.md §0 for this video. Claude reads this together with
> `docs/VIDEO_BRIEF.md` at every stage. Fill in what you know; Claude fills the rest
> when it writes the script and you can correct it during review.

- **Topic:** Kubernetes
- **Target length (minutes):** 7–9
- **Target audience level:** beginner + intermediate
- **The ONE "aha" insight viewers should leave with:** Kubernetes is not a launcher, it's a set of loops that keep comparing what you asked for with what exists and fixing the difference.
- **The real-world pain that opens the video:** You kill a pod to fix it and it instantly comes back, and you have no idea who brought it back or why.
- **What viewers probably already know:**
- **3–5 things they probably don't know yet:**
- **My take (the opinion this video argues):**
- **Title format:** finally-make-sense
- **Notes / things to include or avoid:** Didn't-know candidates: kubectl apply doesn't start anything: it just writes your YAML into a database (etcd) | The scheduler's whole job is writing a node name into one field of the pod | Every component only talks to the API server; they never talk to each other directly | A Service usually isn't a running proxy: kube-proxy writes kernel packet rules (iptables/IPVS) on every node | Deleting a pod owned by a Deployment is a bug report to a loop, which immediately 'fixes' it  
Core visual: A WANT column and a HAVE column with a diff arrow; each controller is a small box running the same loop: read, compare, act  
Device: Reconcile loop stamp: WANT 3 / HAVE 2 / ACT +1, reappearing for each component
