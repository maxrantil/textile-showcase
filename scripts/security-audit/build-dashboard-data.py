#!/usr/bin/env python3
# ABOUTME: Builds the dashboard's audit-data.json from a run directory (ledger, findings, remediation,
# tests, priorities). Every row is derived from run evidence; nothing is scored by hand.
# Usage: build-dashboard-data.py <run-dir> <remediation.json> <history.json|-> <out.json>
import json
import sys

RUN, REM, HIST, OUT = sys.argv[1:5]
meta = json.load(open(f"{RUN}/run-metadata.json"))
F = json.load(open(f"{RUN}/findings.json"))
L = json.load(open(f"{RUN}/coverage-ledger.json"))
rem = json.load(open(REM))
hist = json.load(open(HIST)) if HIST != "-" else []

LAYERS = ["Frontend", "APIs", "Authentication", "Data & CMS", "Infrastructure & CI", "Dependencies"]


def layer_of(text):
    t = text.lower()
    rules = [
        ("Dependencies", ["package-lock", "package.json#", "dependabot"]),
        ("Infrastructure & CI", [".github", "deployment/", "github/", "maxrantil/.github", "ecosystem", "matcher-body"]),
        ("Authentication", ["security-routes", "indexnow", "studio", "clientip", "valid_auth"]),
        ("Data & CMS", ["sanity", "projects", "datafetcher", "querycache"]),
        ("APIs", ["api/", "ratelimit", "health"]),
        ("Frontend", ["project/", "jsonld", "proxy.ts", "sw.js", "next.config", "sitemap"]),
    ]
    for name, keys in rules:
        if any(k in t for k in keys):
            return name
    return "Frontend"


OVERRIDE = rem.get("layer_overrides", {})
findings = []
for f in F:
    fp = f["fingerprint"]
    r = rem["findings"].get(fp, {})
    findings.append({
        "fingerprint": fp,
        "title": f["title"],
        "verdict": f["verdict"],
        "severity": f.get("severity", {}).get("overall_severity", "unrated"),
        "layer": OVERRIDE.get(fp, layer_of(fp)),
        "status": r.get("status", "open" if f["verdict"] == "confirmed" else "needs validation"),
        "location": f"{f['trace'][-1]['file']}:{f['trace'][-1]['line']}",
        "entry": f"{f['trace'][0]['file']}:{f['trace'][0]['line']}",
        "evidence": (f.get("execution", {}).get("observed_result") or f["evidence"][0]["description"]),
        "blocker": (f.get("blockers") or [""])[0],
        "owner_check": f.get("validation_plan", {}).get("deployment", ""),
        "fix": r.get("fix", f.get("remediation", {}).get("strategy", "")),
        "fix_pr": r.get("pr", ""),
        "fix_commit": r.get("commit", ""),
        "fix_test": r.get("test", ""),
        "first_seen": r.get("first_seen", meta["run_id"]),
    })

coverage = []
for u in L:
    coverage.append({
        "unit": u["surface"],
        "attack_class": u["attack_class"],
        "layer": OVERRIDE.get(u["coverage_id"], OVERRIDE.get(u["canonical_refs"]["surface"], layer_of(u["canonical_refs"]["surface"] + " " + u["canonical_refs"]["boundary"]))),
        "status": u["status"],
        "owner": u["agent_id"] or "—",
        "paths": len(u["reviewed_paths"]),
        "checks": len(u["local_checks"]),
        "local_checks": sum(1 for c in u["local_checks"] if c["method"] == "local"),
        "note": (u["unresolved"][0] if u["unresolved"] else (u["local_checks"][0]["result"] if u["local_checks"] else ""))[:240],
    })

counts = {s: sum(1 for u in L if u["status"] == s) for s in ("covered", "candidate", "blocked", "deferred", "out_of_scope")}
run = {"run_id": meta["run_id"], "date": rem["run_date"], "profile": meta["profile"], "source_ref": (meta["source_ref"]["commit"] if isinstance(meta["source_ref"], dict) else meta["source_ref"])[:7],
       "units": len(L), **counts,
       "confirmed": sum(1 for f in F if f["verdict"] == "confirmed"),
       "needs_validation": sum(1 for f in F if f["verdict"] == "needs_validation"),
       "rejected": sum(1 for f in F if f["verdict"] == "rejected"),
       "open_confirmed": sum(1 for x in findings if x["verdict"] == "confirmed" and x["status"] == "open"),
       "agents": meta.get("agents_spent", 0), "budget": meta["budget"]}
runs = [h for h in hist if h["run_id"] != run["run_id"]] + [run]

data = {"findings": findings, "coverage": coverage, "runs": runs, "tests": rem["tests"],
        "changes": rem["changes"], "priorities": rem["priorities"], "gaps": rem["gaps"],
        "layers": [{"layer": x, "order": i} for i, x in enumerate(LAYERS)]}
json.dump(data, open(OUT, "w"), indent=1, ensure_ascii=False)
print(OUT, {k: len(v) for k, v in data.items()})
