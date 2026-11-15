#!/usr/bin/env python3
# ABOUTME: Builds each hunter's full prompt file from verbatim skill blocks and the parent ledger.
# Usage: build-prompts.py <skill-dir> <output-dir> <plan.json>
import json
import re
import sys

K, O, PLAN = sys.argv[1:4]
read = lambda f: open(f"{K}/{f}", encoding="utf-8").read().splitlines()
ledger = {u["coverage_id"]: u for u in json.load(open(f"{O}/coverage-ledger.json"))}
arch = open(f"{O}/architecture.md", encoding="utf-8").read()
H = read("HUNTING.md")
schema = json.load(open(f"{K}/report-schema.json"))


def ordinary(name):
    lines = read("ATTACK-CLASSES.md")
    start = next(i for i, l in enumerate(lines) if l.startswith(f"**{name}** (subagent_type"))
    end = next((j for j in range(start + 1, len(lines)) if re.match(r"^\*\*[^*]+\*\* \(subagent_type", lines[j])), len(lines))
    return "\n".join(lines[start:end]).rstrip()


def companion(f, name):
    lines = read(f)
    if name in ("Core discipline", "Universal moves", "Validation rules"):
        start = next(i for i, l in enumerate(lines) if l.startswith(f"## {name}"))
        end = next((j for j in range(start + 1, len(lines)) if lines[j].startswith("## ")), len(lines))
    else:
        start = next(i for i, l in enumerate(lines) if l.strip() == f"**{name}**")
        end = next((j for j in range(start + 1, len(lines)) if lines[j].startswith("**") or lines[j].startswith("## ")), len(lines))
    return "\n".join(lines[start:end]).rstrip()


def block(ref):
    f, name = ref.split("#", 1)
    return ordinary(name) if f == "ATTACK-CLASSES.md" else companion(f, name)


def section(start_pat, end_pat):
    s = next(i for i, l in enumerate(H) if l.startswith(start_pat))
    e = next(j for j in range(s + 1, len(H)) if H[j].startswith(end_pat))
    return "\n".join(H[s:e]).rstrip()


SANDBOX = """## Sandbox and scratch for bounded local checks (parent-provided)

- Agent ID: `{aid}`. Scratch (host path): `{out}/agents/{aid}/scratch` — a size-capped tmpfs owned by `nobody`.
  Inside the sandbox the same scratch is mounted at `/tmp`. Parent-owned artifacts root: `{out}/agents/{aid}/artifacts` (you never write it).
- Target checkout (read-only inside the sandbox): `/home/user/audit-target`. Never edit target source.
- Run every target-controlled command ONLY through the OS sandbox:
  `{out}/run-sandboxed.sh {out}/agents/{aid}/scratch /home/user/audit-target <command> [args...]`
  It gives a new net namespace (loopback only, no DNS), PID and mount namespaces, every mount read-only except scratch at /tmp,
  runs as `nobody` with all capabilities dropped and no_new_privs, empty env (PATH, HOME=/tmp, TMPDIR=/tmp, NODE_ENV=test, CI=true),
  a 3 GiB memory cgroup, 512-process cgroup, 300 s CPU and wall clock, 50 MB file-size limit.
- Before a run, place PoC files in scratch from the host (e.g. write to `{out}/agents/{aid}/scratch/poc/x.poc.test.ts` then `chown -R nobody` that directory).
- Working Jest recipe (verified): `{out}/run-sandboxed.sh {out}/agents/{aid}/scratch /home/user/audit-target node node_modules/.bin/jest --cacheDirectory /tmp/jest --ci --roots /tmp/poc --testMatch '**/*.poc.test.ts'`
  (`@/` imports resolve to `src/`; existing repo tests can also be run by path.) Capture output to a file in scratch with `--json --outputFile /tmp/<name>.json` or shell redirection inside scratch.
- Never run npm install/ci/audit, network commands, the dev server against the internet, deploy scripts, or anything outside the sandbox that executes target code.
- Predeclared promotion allowlist: at most 4 files, each under `results/` in scratch (e.g. `results/<fingerprint-slug>.txt`), per-file limit 65536 bytes, cumulative limit 262144 bytes.
  List each file you want promoted in a top-level `promotion_requests` array (scratch-relative paths). The parent promotes them with
  race-safe code; a `local` check's `artifact` must then be `agents/{aid}/artifacts/<same relative path>`. If you report a local check, assume promotion succeeds
  for an allowlisted regular file; the parent will downgrade it if promotion fails.
"""


def main():
    plan = json.load(open(PLAN))
    for h in plan["hunters"]:
        aid, ids = h["agent_id"], h["units"]
        peers = sorted(i for g in plan["hunters"] if g["agent_id"] != aid for i in g["units"])
        parts = [
            "You are a security hunter whose goal is to find source-grounded security invariant failures in your assigned coverage units of the textile-showcase repository. "
            "You must return exactly one JSON object matching the structured-result contract at the end of this prompt.",
            "# architecture.md (verbatim)\n\n" + arch,
            "# Assigned units (from coverage-ledger.json)\n",
        ]
        sel, excl = [], []
        for cid in ids:
            u = ledger[cid]
            m = {k: u[k] for k in ("coverage_id", "surface", "boundary", "subsystem", "attack_class", "starting_paths",
                                   "ordinary_attack_class_block", "selected_companion_blocks", "excluded_blocks")}
            parts.append("```json\n" + json.dumps(m, indent=2, ensure_ascii=False) + "\n```")
            for r in ([u["ordinary_attack_class_block"]] if u["ordinary_attack_class_block"] else []) + u["selected_companion_blocks"]:
                if r not in sel:
                    sel.append(r)
            excl += u["excluded_blocks"]
        parts.append("# Selected attack-class blocks (verbatim)\n")
        for r in sel:
            parts.append(f"<!-- {r} -->\n" + block(r))
        parts.append("# Excluded blocks\n\n" + "\n".join(
            [f"- {e['block']}: {e['reason']}" for e in excl] + [f"- {x}: {why}" for x, why in plan["global_exclusions"]]))
        parts.append(section("#### Core hunting method", "#### Promotion procedure"))
        parts.append(section("#### Promotion procedure", "#### Core validation rules"))
        parts.append(section("#### Core validation rules", "## Structured hunter result"))
        parts.append("# Prior exclusions and peer-owned units\n\nNo prior confirmed records (first run). Peer-owned coverage IDs you must not duplicate:\n"
                     + "\n".join(f"- `{p}`" for p in peers))
        parts.append(SANDBOX.format(aid=aid, out=O))
        parts.append(section("## Structured hunter result", "## Parent consolidation"))
        parts.append("Additionally include a top-level `promotion_requests` array (scratch-relative paths, may be empty).\n\n"
                     "## report-schema.json — `confirmed` branch (verbatim)\n\n```json\n" + json.dumps(schema["items"]["oneOf"][0], indent=2)
                     + "\n```\n\n## report-schema.json — `needs_validation` branch (verbatim)\n\n```json\n" + json.dumps(schema["items"]["oneOf"][1], indent=2) + "\n```")
        open(f"{O}/prompts/{aid}.md", "w", encoding="utf-8").write("\n\n".join(parts) + "\n")
        print(aid, len(ids), "units", sum(len(p) for p in parts), "chars")


main()
