#!/usr/bin/env python3
# ABOUTME: Phase 6 — derives REPORT.md, FINDINGS-DETAIL.md and NEEDS-VALIDATION.md from final records,
# the coverage ledger and retained hardening notes. Never changes a verdict, severity or blocker.
import collections
import json
import sys

O = sys.argv[1]
meta = json.load(open(f"{O}/run-metadata.json"))
F = json.load(open(f"{O}/findings.json"))
L = json.load(open(f"{O}/coverage-ledger.json"))
conf = [f for f in F if f["verdict"] == "confirmed"]
nv = [f for f in F if f["verdict"] == "needs_validation"]
rej = [f for f in F if f["verdict"] == "rejected"]
cnt = collections.Counter(u["status"] for u in L)
hard = []
for u in L:
    for h in u.get("hardening", []):
        if h not in hard:
            hard.append(h)
loc = lambda t: f"`{t['file']}:{t['line']}`"

r = [f"# Security audit report — {meta['repo']}", "",
     "## 1. Run", "",
     f"- **Profile:** `{meta['profile']}`. This is a partial pass: a quick run gets one hunter wave and one final coverage critic, and it does not establish that the rest of the code is clean.",
     f"- **Source ref:** `{meta['source_ref']['commit'] if isinstance(meta['source_ref'], dict) else meta['source_ref']}`, scoped to the whole repository.",
     f"- **Budget:** {meta['budget']} agent invocations, {meta.get('agents_spent', 'n/a')} spent: 4 reconnaissance, 5 hunters, 1 final critic and 4 verifiers.",
     "- **Execution:** sandboxed, source and local only. Target code ran only inside an OS sandbox with no external network, as an unprivileged user with no capabilities, on a read-only filesystem apart from a size-capped scratch area, with a cgroup memory and process cap and CPU and wall-clock limits. No deployed endpoint, provider API or registry was contacted.",
     "- **Prior runs:** none. This is the first run, so no prior confirmations were carried forward and no earlier findings were revalidated.",
     f"- **Deferred / out of scope:** {cnt.get('deferred', 0)} deferred and {cnt.get('out_of_scope', 0)} out of scope. They are listed in section 7.", "",
     "## 2. Posture", "",
     f"No anonymous-visitor vulnerability was confirmed. {len(conf)} low-severity issue was confirmed: a Sanity editor can inject HTML through JSON-LD. {len(nv)} leads depend on deployment facts (nginx, firewall, IPv6) that are not visible in the repository. Secrets handling, the CMS read path (published perspective only), the contact-mail escaping and the CI trigger model held up under review. The biggest unverified areas are the VPS network exposure and the shared `maxrantil/.github` workflows.", "",
     "## 3. Confirmed findings", "", "| Severity | Title | Boundary | Observed |", "|---|---|---|---|"]
for f in conf:
    r.append(f"| {f['severity']['overall_severity']} | {f['title']} | CMS editor → visitor HTML | {f['execution']['observed_result'][:160]}… |")
r += ["", "## 4. Confirmed finding detail", ""]
for f in conf:
    r += [f"### {f['title']}", "",
          f"- **Fingerprint:** `{f['fingerprint']}`",
          f"- **Source:** " + ", ".join(loc(t) for t in f["trace"]),
          f"- **Lower-trust principal:** {f['execution']['attacker_perspective']}",
          f"- **Reproduction (bounded, local):**"] + [f"  {i+1}. {s}" for i, s in enumerate(f["execution"]["instructions"])] + [
          f"- **Payload:** `{f['execution']['payloads'][0]}`",
          "- **Conditions:** " + "; ".join(c["description"] for c in f["conditions"]),
          f"- **Actual result:** {f['execution']['observed_result']}",
          f"- **Impact:** {f['severity']['impact']['reason']}",
          f"- **Priority:** likelihood {f['severity']['likelihood']['score']} ({f['severity']['likelihood']['reason']}). The fix is small and contained.",
          f"- **Smallest fix:** {f['remediation']['strategy']}", ""]
r += ["## 5. Needs validation (no severity assigned, not a confirmed vulnerability)", "",
      "| Lead | Trace | Blocker | Local next step | Owner check |", "|---|---|---|---|---|"]
for f in nv:
    vp = f["validation_plan"]
    r.append(f"| {f['title']} | {' → '.join(loc(t) for t in f['trace'])} | {f['blockers'][0]} | {vp.get('local', '—')[:200]} | {vp.get('deployment', '—')[:240]} |")
r += ["", "## 6. Hardening notes (not findings)", ""] + [f"- {h}" for h in hard] + ["",
      "### Positive patterns", "",
      "- All CMS reads go through one client with `perspective: 'published'`, and GROQ is always parameterised.",
      "- Contact mail HTML is escaped, the subject has control characters stripped, and the body has a 16 KB cap plus a Zod length schema.",
      "- The IndexNow secret is compared with `timingSafeEqual` and fails closed when unset.",
      "- CSP uses a per-request nonce with `strict-dynamic`, and anti-framing is applied twice.",
      "- CI uses only `pull_request` triggers, and fork PRs get no secrets.",
      "- The lockfile is complete and every entry has sha512 integrity from the npm registry.", "",
      "## 7. Coverage", "",
      f"- **Units:** {len(L)} in total: {cnt.get('covered', 0)} covered, {cnt.get('candidate', 0)} candidate, {cnt.get('blocked', 0)} blocked, {cnt.get('deferred', 0)} deferred and {cnt.get('out_of_scope', 0)} out of scope.",
      "- **Final critic:** accepted 3 missing units (sitemap `<loc>` escaping, same-origin Studio auth, proxy body buffering). Per the quick profile, all 3 were recorded as `deferred` (`quick_profile_final_critic`) and not hunted. It proposed no reassignments.",
      "- **Excluded companions:** AI/LLM, memory safety, desktop/IPC, protocols/RPC and data isolation. None of these surfaces exist here.", "",
      "| Status | Unit | Reason |", "|---|---|---|"]
for u in L:
    if u["status"] in ("deferred", "out_of_scope", "blocked"):
        r.append(f"| {u['status']} | {u['surface']} — {u['attack_class']} | {u['unresolved'][0][:200]} |")
if rej:
    r += ["", "Rejected fingerprints: " + ", ".join(f"`{f['fingerprint']}`" for f in rej)]
open(f"{O}/REPORT.md", "w").write("\n".join(r) + "\n")

d = ["# Findings detail", "", "This run confirmed no `medium`, `high` or `critical` record. The one confirmed record is `low` and is described in REPORT.md section 4."]
for f in conf:
    if f["severity"]["overall_severity"] in ("medium", "high", "critical"):
        d += ["", f"## {f['title']}"] + [f"- {t['kind']}: {loc(t)} {t['scope']} — {t['description']}" for t in f["trace"]]
open(f"{O}/FINDINGS-DETAIL.md", "w").write("\n".join(d) + "\n")

n = ["# Needs validation", "", "These are prioritized leads with no severity. Each needs one fact the repository cannot show. Do not send audit traffic to the live site to resolve them.", ""]
for i, f in enumerate(nv, 1):
    n += [f"## {i}. {f['title']}", "", f"`{f['fingerprint']}`", "", f"**Claimed root cause:** {f['claimed_root_cause']}", "", "**Trace**", ""] + \
         [f"- {t['kind']} {loc(t)} `{t['scope']}` — {t['description']}" for t in f["trace"]] + ["", "**Evidence**", ""] + \
         [f"- {loc(e)} — {e['description']}" for e in f["evidence"]] + ["", "**Blockers**", ""] + [f"- {b}" for b in f["blockers"]] + ["",
         f"**Local plan:** {f['validation_plan'].get('local', '—')}", "", f"**Owner-observed check:** {f['validation_plan'].get('deployment', '—')}", ""]
open(f"{O}/NEEDS-VALIDATION.md", "w").write("\n".join(n) + "\n")
print("reports written", len(conf), len(nv))
