# Security audit harness

These are the parent-side tools for running the vendored `.claude/skills/security-audit` skill on this repository. They are used by the nightly quick audit and by manual runs.

Everything here runs on the audit host as root. Target code never runs outside `run-sandboxed.sh`.

| File                                                                                   | Role                                                                                                |
| -------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `prepare-scratch.sh <out> <agent-id> [size]`                                           | Creates an agent's size-capped tmpfs `scratch/` (owned by `nobody`) and a parent-owned `artifacts/` |
| `run-sandboxed.sh <scratch> <workdir> <cmd…>`                                          | OS sandbox. See the list below                                                                      |
| `lo-up.py`                                                                             | Brings up loopback inside the sandbox's network namespace                                           |
| `escape-probe.sh`                                                                      | Run it inside the sandbox on a new host. Every line should show a refusal                           |
| `promote.py <scratch> <artifacts> <max-file> <max-total> <rel…>`                       | Race-safe, no-follow promotion of allowlisted scratch files into `artifacts/`                       |
| `seed-ledger.py <out>/coverage-ledger.json`                                            | Seeds the quick-profile coverage units for this repository                                          |
| `build-prompts.py <skill> <out> <plan.json>`                                           | Builds each hunter prompt, with every skill block copied verbatim                                   |
| `consolidate.py <out> <agent-id> <result.json>`                                        | Applies one hunter result to the ledger and the candidate set                                       |
| `build-verifiers.py <skill> <out>`                                                     | Builds one fresh verifier prompt per candidate (Phase 3 and Phase 5 merged for quick)               |
| `write-reports.py <out>`                                                               | Writes `REPORT.md`, `FINDINGS-DETAIL.md` and `NEEDS-VALIDATION.md` from the final records           |
| `build-dashboard-data.py <out> <remediation.json> <history.json\|-> <audit-data.json>` | Builds the data file the security dashboard reads                                                   |

`run-sandboxed.sh` gives target code:

- new network (loopback only), mount and PID namespaces;
- every mount read-only, except the scratch tmpfs bound at `/tmp`;
- the user `nobody`, with all capabilities dropped and `no_new_privs`;
- an empty environment;
- a per-run cgroup capping memory at 3 GiB and processes at 512;
- CPU, file-size, file-descriptor and wall-clock limits.

It refuses to run if any writable mount remains.

## Conventions

- Prompts expect the audited commit as a detached worktree at `/home/user/audit-target`, with `node_modules` symlinked from the main checkout.
- Copy these scripts into the run's output directory before building prompts. Prompts point agents at `<out>/run-sandboxed.sh`.
- Never run `npm install`, `npm ci` or `npm audit`, and never contact the deployed site or provider APIs, during an audit.
