#!/usr/bin/env python3
# ABOUTME: Builds one fresh verifier prompt per candidate (quick profile: Phase 3 + Phase 5 merged).
import json, re, sys
K, O = sys.argv[1:3]
V = open(f"{K}/VALIDATION-AND-REPORTING.md", encoding="utf-8").read().splitlines()
def between(a, b):
    s = next(i for i, l in enumerate(V) if l.startswith(a)); e = next(j for j in range(s + 1, len(V)) if V[j].startswith(b))
    return "\n".join(V[s:e]).rstrip()
def comp(f, name):
    L = open(f"{K}/{f}", encoding="utf-8").read().splitlines()
    s = next(i for i, l in enumerate(L) if l.startswith(f"## {name}")); e = next((j for j in range(s + 1, len(L)) if L[j].startswith("## ")), len(L))
    return "\n".join(L[s:e]).rstrip()
schema = json.load(open(f"{K}/report-schema.json"))["items"]["oneOf"]
cands = json.load(open(f"{O}/candidates.json")); ledger = json.load(open(f"{O}/coverage-ledger.json"))
arch = open(f"{O}/architecture.md", encoding="utf-8").read()
plan = {}
for i, fp in enumerate(sorted(cands), 1):
    linked = [u for u in ledger if fp in u["result_fingerprints"]]
    comps = sorted({b.split("#", 1)[0] for u in linked for b in u["selected_companion_blocks"]})
    plan[fp] = (f"v{i}-verify", comps)
import glob
SBX = open(sorted(glob.glob(f"{O}/prompts/h*.md"))[0], encoding="utf-8").read()
sb = SBX[SBX.index("## Sandbox and scratch"):SBX.index("## Structured hunter result")]
for fp, (vid, comps) in plan.items():
    c = {k: v for k, v in cands[fp].items() if not k.startswith("_")}
    units = [ {k: u[k] for k in ("coverage_id", "local_checks", "result_fingerprints")} for u in ledger if fp in u["result_fingerprints"]]
    parts = ["You are independent verifier `%s` for one security-audit candidate in /home/user/audit-target (read-only checkout of a Next.js portfolio site)." % vid,
             between("#### Candidate-verifier prompt", "Copy this promotion procedure"),
             between("Copy this promotion procedure", "A verifier can promote"),
             "\n".join(V[86:87]),
             "## Quick profile: you also perform the final record verification (Phase 3 and Phase 5 merged)\n\n" + between("For `confirmed`, require it to check:", "Each verifier returns exactly one JSON object") +
             "\n\nYour single JSON output (`{\"decision\": ..., \"record\": ...}`) is the final record. Do not include line numbers you have not re-read. Records use only schema fields (no proposed_verdict or wrapper fields).",
             "# Architecture facts (architecture.md)\n\n" + arch,
             "# Candidate under test (hunter's proposal)\n\n```json\n" + json.dumps(c, indent=2, ensure_ascii=False) + "\n```",
             "# Linked coverage-unit checks and artifacts (paths relative to %s)" % O + "\n\n```json\n" + json.dumps(units, indent=2, ensure_ascii=False) + "\n```",
             "# Relevant companion validation blocks (verbatim)\n\n" + "\n\n".join(comp(f, n) for f in comps for n in ("Core discipline", "Validation rules")),
             "# Prior records with the same fingerprint\n\nNone (first run).",
             sb.replace(re.search(r"Agent ID: `([a-z0-9_-]+)`", sb).group(1), vid).replace("hardening`-free field", "top-level"),
             "Add a top-level `promotion_requests` array beside `decision` and `record` listing scratch-relative files to promote (may be empty); a local check you rely on is only evidence once promoted to agents/%s/artifacts/<path>.\n" % vid,
             "## report-schema.json — confirmed branch (verbatim)\n```json\n" + json.dumps(schema[0], indent=2) + "\n```\n## needs_validation branch (verbatim)\n```json\n" + json.dumps(schema[1], indent=2) + "\n```\n## rejected branch (verbatim)\n```json\n" + json.dumps(schema[2], indent=2) + "\n```"]
    open(f"{O}/prompts/{vid}.md", "w", encoding="utf-8").write("\n\n".join(parts) + "\n")
    print(vid, sum(map(len, parts)))
