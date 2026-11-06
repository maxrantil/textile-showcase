#!/usr/bin/env python3
# ABOUTME: Parent-side consolidation of one hunter's structured result into coverage-ledger.json and
# candidates.json. Rejects unassigned/duplicate IDs and local checks lacking a promoted artifact.
# Usage: consolidate.py <output-dir> <agent-id> <result.json>
import json
import os
import re
import stat
import sys

O, AID, RES = sys.argv[1:4]
ID_RE = re.compile(r"^[a-z0-9][a-z0-9_-]{0,63}$")
ledger = json.load(open(f"{O}/coverage-ledger.json"))
res = json.load(open(RES))
cpath = f"{O}/candidates.json"
cands = json.load(open(cpath)) if os.path.exists(cpath) else {}
byid = {u["coverage_id"]: u for u in ledger}
seen, errors = set(), []

for r in res["units"]:
    cid = r["coverage_id"]
    u = byid.get(cid)
    if not u or u["agent_id"] != AID or u["status"] != "in_progress" or cid in seen:
        errors.append(f"unassigned or duplicate unit {cid}")
        continue
    seen.add(cid)
    ok = True
    for c in r["checks"]:
        if not ID_RE.match(c["agent_id"]) or not c["reviewed_paths"]:
            ok = False
        if c["method"] == "source" and c["artifact"] is not None:
            ok = False
        if c["method"] == "local":
            a = c["artifact"] or ""
            p = os.path.join(O, a)
            if not a.startswith(f"agents/{c['agent_id']}/artifacts/") or ".." in a.split("/"):
                ok = False
            else:
                try:
                    st = os.lstat(p)
                    ok = ok and stat.S_ISREG(st.st_mode) and st.st_nlink == 1
                except FileNotFoundError:
                    ok = False
    disp = r["disposition"]
    if not ok or disp not in ("covered", "candidate", "blocked") or not r["checks"]:
        errors.append(f"malformed result for {cid}; left planned")
        u.update(status="planned", agent_id=None)
        continue
    paths = sorted({p for c in r["checks"] for p in c["reviewed_paths"]})
    u.update(status=disp, reviewed_paths=paths, local_checks=r["checks"],
             result_fingerprints=sorted(set(r.get("candidate_fingerprints", []))) if disp == "candidate" else [],
             unresolved=r.get("unresolved", []) if disp != "covered" else [])
    u["hardening"] = res.get("hardening", [])

for cid, u in byid.items():
    if u["agent_id"] == AID and u["status"] == "in_progress" and cid not in seen:
        errors.append(f"missing result for {cid}; left planned")
        u.update(status="planned", agent_id=None)

for c in res.get("candidates", []):
    fp = c["fingerprint"]
    c["_source_agent"] = AID
    if fp in cands:
        cands[fp].setdefault("_duplicates", []).append(AID)
    else:
        cands[fp] = c

ledger.sort(key=lambda u: u["coverage_id"])
json.dump(ledger, open(f"{O}/coverage-ledger.json", "w"), indent=2, ensure_ascii=False)
json.dump(cands, open(cpath, "w"), indent=2, ensure_ascii=False)
un = res.get("uncovered", [])
if un:
    json.dump(un, open(f"{O}/results/{AID}.uncovered.json", "w"), indent=2)
print(f"{AID}: {len(seen)} units applied, {len(res.get('candidates', []))} candidates, {len(un)} uncovered")
for e in errors:
    print("ERROR:", e)
