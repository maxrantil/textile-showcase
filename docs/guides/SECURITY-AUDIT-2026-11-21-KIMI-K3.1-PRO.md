# Defensive Security Audit — Textile Showcase

**Finalization date:** 2026-11-21  
**Audit started:** 2026-11-20  
**Model:** Kimi K3.1 Pro (free) — `moonshotai/kimi-k3.1-pro:free`  
**Reviewed source:** `62272dbc9b64d2bee7bc4c5109824c6e262d5c79` on `master`  
**Profile:** Deep, source-first defensive audit; no strict agent invocation budget was set

## 1. Executive security posture

The archive includes a public Next.js portfolio, public contact/CSP/project APIs, an authenticated IndexNow trigger, Sanity CMS reads and Studio, browser persistence, process-local caches/rate limits, npm advisory controls, GitHub Actions and a Vultr/PM2 deployment path. It is not a wallet, payment system, tenant SaaS or account store. No financial transaction, nonce-transaction, wallet-signature, wallet recovery or custom RPC surface was found. The highest-impact confirmed issue is authenticated production deployment source/artifact substitution; the principal web/API issues are bounded resource-abuse and integrity defects rather than unauthenticated account takeover.

**Outcome:** 11 confirmed findings (0 Critical, 1 High, 1 Medium, 9 Low), 8 Needs-validation leads, and 2 rejected candidates. There are no confirmed Critical findings.

### Confirmed findings by severity

| Severity | Finding | Access assumption | Demonstrated effect |

|---|---|---|---|

| **HIGH** | Deployment combines one run's artifact with the newest master source<br>`.github/workflows/production-deploy.yml:3 (entrypoint) → .github/workflows/production-deploy.yml:223 (sink)` | The attacker can push revision B directly or have it merged into master but does not otherwise possess the production environment's deployment approval or VPS credentials.; Revision B changes scripts/deploy/vps-release.sh or anot… | The newer-origin case returned release=B selected=B artifact=A, fragment_status=0, and mock calls [fetch origin][reset --hard origin/master], proving the minimum identity mismatch: B's release logic executed while A's artifact remained. With mocked fetch status 1, the same B-with-A result… |

| **MEDIUM** | Failed dependency reinstall does not restore a runnable previous release<br>`scripts/deploy/vps-release.sh:20 (entrypoint) → ecosystem.config.js:8 (sink)` | The deployment uses the supplied ecosystem.config.js application idaromme-website and its node_modules/next/dist/bin/next script path.; A previous release and dependency tree exist, but the stored lockfile/Node-version stamp diff… | The failed-install run returned release_status 1 after exactly one dummy npm ci request. It retained .next/BUILD_ID=old and .next.incoming/BUILD_ID=new, but node_modules/next/dist/bin/next was absent. Before the control, exactly one recovery start was requested and the dummy PM2 boundary… |

| **LOW** | Advisory-ID-only audit exceptions waive unreviewed dependency contexts<br>`scripts/audit-gate.js:84 (entrypoint) → .github/workflows/production-deploy.yml:129 (sink)` | No runtime application account or production credential is involved. Influence must come through dependency/advisory data or an ordinary reviewed dependency-lock change, not through editing the exception or workflow outside the n… | Using the checked-in GHSA-fc5q-39xc-vjpf exception, the reviewed picomatch/<4.0.8 context returned ok=true as expected. The unreviewed runtime-fixture/<9.0.0/Next.js-path record alone also returned ok=true with that runtime-fixture in excepted and no blocking records. The synthetic picoma… |

| **LOW** | Sandbox launches target code after required cgroup setup fails<br>`scripts/security-audit/run-sandboxed.sh:7 (entrypoint) → scripts/security-audit/run-sandboxed.sh:42 (sink)` | A root audit operator or scheduled audit job invokes this script for code supplied by a repository contributor or dependency publisher; the attacker controls audited target code, not the parent shell.; At least one required memor… | The unchanged script reported failures for both cgroup mkdir operations and every required limit and membership redirection on lines 16 and 18-20. It nevertheless emitted UNSHARE_REACHED, then INNER_EXEC_REACHED, then TARGET_RAN, created /work/scratch/marker, and finished with OBSERVED_TA… |

| **LOW** | Candidate import and verifier evidence are not bound to accepted producer-owned units<br>`scripts/security-audit/consolidate.py:14 (entrypoint) → scripts/security-audit/build-verifiers.py:41 (sink)` | The actor must be a lower-trust audit hunter whose structured result is submitted by the parent to consolidate.py for one or more assigned in-progress units; no web access, credentials, or external service is involved.; For unacc… | Both consolidation commands and prompt building returned 0. The first command logged 'ERROR: malformed result for dummy-unit-unaccepted; left planned', and the unit became planned with agent_id null, but dummy-unaccepted was nevertheless imported with _source_agent hunter-unaccepted. Its… |

| **LOW** | Coverage views omit unfinished review states and consolidation erases covered-result unresolved facts<br>`scripts/security-audit/consolidate.py:20 (entrypoint) → scripts/security-audit/build-dashboard-data.py:72 (sink)` | The result producer must be the canonical agent assigned to the affected in_progress units; the reproduction used dummy-hunter with a valid owned source check and did not bypass unit ownership.; Either an assigned unit is absent… | The sandbox returned 0 with no stderr or truncation. Consolidation returned 0, applied one unit, and printed a missing-result ERROR for fixture-0. The persisted ledger was schema-valid (PASS: 3 coverage units valid) with fixture-0 planned/agent_id null/unresolved [], fixture-1 covered wit… |

| **LOW** | Report generator emits hard-coded security conclusions that contradict final records<br>`scripts/security-audit/write-reports.py:10 (entrypoint) → scripts/security-audit/write-reports.py:78 (sink)` | The generator processes a schema-valid final record set or ledger that differs from the hard-coded assumed run, including an empty set, a non-CMS high-severity record, or an unrelated needs-validation blocker.; An auditor or main… | The combined harness returned 0, with no timeout or truncated streams, and every assertion passed. With zero records, REPORT.md stated '0 low-severity issue was confirmed: a Sanity editor can inject HTML through JSON-LD', while FINDINGS-DETAIL.md still said 'The one confirmed record is `l… |

| **LOW** | Authorized CMS editors can inject sitemap XML through manually edited slugs<br>`src/sanity/schemas/textileDesign.ts:76 (entrypoint) → node_modules/next/dist/build/webpack/loaders/metadata/resolve-route-data.js:112 (sink)` | The actor must already have Sanity permissions to edit and publish textileDesign documents or equivalent programmatic write access; no unauthenticated request reaches this path.; A published document must have a manually edited o… | The single mocked Sanity fetch produced four sitemap entries: three static entries and one project. The project URL retained the delimiter payload verbatim. Next 16.4.6 serialization produced five <url> elements and contained the literal structural fragment <url><loc>https://example.inval… |

| **LOW** | Rate-limit capacity eviction can reset the global contact-send quota<br>`src/app/api/contact/route.ts:88 (entrypoint) → src/app/api/contact/route.ts:165 (sink)` | The contact endpoint and its per-client accounting are reachable without authentication.; The attack assumes access to requests that the trusted ingress derives as genuinely distinct client IPs. Forged leftmost forwarding values… | The approved sandbox exited 0 with no truncation. At fixed fake time 1700000000000, 30 global checks were admitted and the next check was blocked with count 30 before churn. After exactly 10,000 fresh dummy-IP insertions, __contact_global__ was absent even though fake time remained before… |

| **LOW** | Nonexistent project slugs create uncapped navigation-cache entries<br>`src/app/api/projects/[slug]/route.ts:16 (entrypoint) → src/sanity/dataFetcher.ts:20 (sink)` | The caller needs no authentication or authorization. Accepted slugs must satisfy the route's 1-200 character Unicode letter/number/underscore/dot/hyphen pattern.; Each selected slug must be absent from published textileDesign doc… | With frozen time and the mocked client, 101 distinct missing slugs produced exactly 101 retained live entries and exactly 101 client.fetch calls. lazyCleanup ran after the Map reached 100 entries but removed none because all were fresh. Repeating missing-0 returned the identical object re… |

| **LOW** | Sanity timeouts retry without cancelling the prior operation<br>`src/app/api/projects/[slug]/route.ts:16 (entrypoint) → src/sanity/dataFetcher.ts:156 (sink)` | No authentication is required for GET /api/projects/[slug].; The request must miss the in-memory result cache, as occurs for a new valid slug or while all attempts are stalled; successful cache hits avoid the downstream path.; Th… | The parent artifact returned code 0 without timeout or truncation. firstPendingAtSecondCall=true, attemptCountAtOverlap=2, both options entries were type undefined with hasSignal=false, and wrapperResult=null while the first underlying promise remained unsettled. Cleanup set bothResolvedF… |

## 2. Scope, architecture and trust boundaries

### Protected resources and principals

- **Unauthenticated visitors:** public pages, contact and CSP POSTs, project JSON/SSR routes and health.
- **Bearer-holder:** IndexNow submission only; static secret comparison and HTTPS-fixed providers.
- **Sanity editors/provider:** published-content and Studio mutation boundary; actual provider membership/ACL is external.
- **Repository contributors/dependency publishers:** PR and lockfile inputs to CI, dependency execution and production artifacts.
- **Master writers / environment approvers / VPS deploy user:** separate identities whose permissions must not silently compose across source and artifact revisions.
- **Protected resources:** VPS deploy authority and runtime availability; RESEND_API_KEY, IndexNow secret, Sanity token, GitHub/VPS secrets; public sitemap/CMS/audit-report integrity; visitor process memory, outbound mail/query quota and browser/rendering state.

### Review approach and execution controls

The audit mapped source, trust boundaries, entry surfaces and deployment models before hunting. Four coverage-led hunting waves addressed HTTP/API, browser, Sanity/cache, CI/release, local audit tooling and final validator acceptance. Independent hunters were followed by separate candidate verifiers and final-record verifiers. No production, deployed endpoint, provider API, registry, shared infrastructure or real credential was used. Dynamic checks ran only in the parent-approved local sandbox with dummy data: user/mount/network/PID namespaces and chroot, read-only tracked source and toolchain, empty allowlisted environment, zero effective capabilities, and explicit CPU, address-space, process, descriptor, file-size, inode, disk and wall-clock limits. Command doubles/mock PM2/npm/Git operations are labeled as such and are not observations of a real deployment. No application or deployment source files were modified.

### Validation and correction gates

- Both `findings.json` and `coverage-ledger.json` pass the repository validators.
- All 21 candidates have an independent Phase 3 decision.
- All 19 retained confirmed/needs-validation records completed separate Phase 5 review.
- The deployment-rollback record was demoted when its first restoration control failed, then restored to Medium only after an independent two-direction fixture observed both missing-marker recovery refusal and successful restored-marker recovery, followed by another fresh final verifier.
- The CSP-buffering harness correction remains Needs validation and is not inflated to DoS.
- No prior compatible machine-readable coverage ledger/findings run existed. The older prose audit was not imported as current evidence.

## 3. HIGH and MEDIUM confirmed findings

### HIGH — Deployment combines one run's artifact with the newest master source



**Severity / confidence:** High (likelihood: medium; impact: high) / independent confidence: high.

**Affected boundary:** .github/workflows/production-deploy.yml:3 (entrypoint) → .github/workflows/production-deploy.yml:223 (sink)

**Description:** Each master push builds and tests its triggering revision, and deploy downloads and rsyncs that run's .next artifact. The subsequent VPS step nevertheless resets its checkout to the mutable origin/master tip and executes scripts/deploy/vps-release.sh from that checkout. If revision B reaches master before an earlier revision A's reset, B supplies the release script, lockfile, public files, and PM2 configuration while A remains in .next.incoming. B's release script therefore runs inside A's already-authorized SSH deployment, after A writes the production environment file, without waiting for B's own test, security-scan, build, and deploy gates. A sandboxed non-Git rehearsal independently observed the harmless B release marker executing while the artifact marker remained A. This requires the ability to land B on master; an untrusted pull request does not directly receive deployment access.

**Root cause:** The deploy job binds the build artifact to the current workflow run but binds remote source and executed release logic to origin/master instead of the immutable github.sha that was tested and built.

**Intended invariant:** The source used for release logic, dependency installation, public files, and PM2 configuration must be exactly the triggering commit whose tests, security scan, build, and downloaded artifact belong to the same workflow run. Fetch, commit-resolution, reset, and HEAD-identity failures must abort before production secrets are written or release logic is invoked.

**Ordered source trace:**

| Step | Location | Scope | Evidence |
|---|---|---|---|
| entrypoint | `.github/workflows/production-deploy.yml:3` | on.push | Every push to master starts a revision-specific workflow, allowing a later revision to enter origin/master while an earlier run is still deploying. |
| propagation | `.github/workflows/production-deploy.yml:119` | Upload build artifacts | The build job uploads .next as the build-files artifact for its triggering revision. |
| propagation | `.github/workflows/production-deploy.yml:137` | Download build artifact | The deploy job downloads the current run's named build-files artifact without selecting another run. |
| propagation | `.github/workflows/production-deploy.yml:174` | Rsync build artifact to VPS staging area | That run's artifact is copied to the remote .next.incoming directory before remote source selection occurs. |
| propagation | `.github/workflows/production-deploy.yml:204` | Pull latest source | git reset --hard origin/master resolves whichever master revision is newest at deployment time rather than the triggering github.sha. |
| sink | `.github/workflows/production-deploy.yml:223` | vps-release.sh invocation | The workflow executes the release script from the newly reset source tree with the earlier run's .next.incoming artifact and production configuration present. |

**Source evidence:**

- `.github/workflows/production-deploy.yml:11` — Workflow-level concurrency queues overlapping runs without cancelling them; it does not prevent a newer commit from becoming origin/master while an earlier run remains active.
- `.github/workflows/production-deploy.yml:129` — Deploy waits for the current run's test, security-scan, and build jobs, establishing that these gates are revision-specific.
- `.github/workflows/production-deploy.yml:133` — The secret-bearing deploy job is attached to the production environment, so executing different source within this run crosses the environment's run-scoped authorization boundary.
- `.github/workflows/production-deploy.yml:215` — The earlier run writes its RESEND_API_KEY to .env.local before invoking whichever release script the mutable reset selected; the demonstrated finding does not require or claim secret exfiltration.
- `scripts/deploy/vps-release.sh:18` — The release script derives its dependency stamp from the reset checkout's package-lock.json, independently of metadata identifying the downloaded build artifact.
- `scripts/deploy/vps-release.sh:54` — PM2 is started from ecosystem.config.js in the reset checkout, providing another source-controlled runtime input that can differ from the built revision.
- `.github/workflows/production-deploy.yml:222` — The workflow explicitly states that the release script runs from the source just pulled so script changes apply immediately, confirming that the post-reset script—not a run-pinned copy—is the executed consumer.

**Access assumptions and containment:**

- **authorization_role** — The attacker can push revision B directly or have it merged into master but does not otherwise possess the production environment's deployment approval or VPS credentials.
- **data_state** — Revision B changes scripts/deploy/vps-release.sh or another consumed deployment input, while revision A has already produced the artifact being deployed.
- **timing_dependency** — B is visible as origin/master when A executes git fetch and git reset. B's own workflow may still be queued or running its required checks.
- **system_configuration** — A has obtained its production deployment credentials, rsync has delivered A's artifact, and the remote fetch and reset complete successfully.

**Realistic attack scenario / impact:**

A repository contributor who can get a later master revision B merged while an earlier run A is deploying, but who cannot independently open a production VPS deployment session. A later master revision's arbitrary shell release logic can run as the VPS deploy user under the earlier run's production deployment authority before its own required gates complete. The bounded check demonstrated only harmless marker execution; secret theft or persistent host compromise was not attempted.

**Proof of concept / actual bounded reproduction:**

**Attacker perspective/access:** A repository contributor who can get a later master revision B merged while an earlier run A is deploying, but who cannot independently open a production VPS deployment session.

**Payloads / exact dummy inputs:**

```text
Dummy artifact identity A: .next.incoming/BUILD_ID contains only A.
```

```text
Dummy source identity B: a mocked origin/master reset installs a harmless release script that prints its source and artifact markers.
```

```text
The git executable is a fixture stub, not a real Git binary. Cases use fetch/reset statuses 0/0, 1/0, and 0/1 respectively; no real repository, network, credentials, PM2, npm, or deployment is used.
```

**Target-neutral reproduction actually used:**

1. The exact approved wrapper invocation used was python3 /tmp/opencode/security-audit-skill/textile-showcase/run-1/sandbox_exec_parent.py verifier-07 --artifact primary -- /bin/sh -c followed, as its final argv element, by the complete newline-containing program preserved verbatim in command[2] of agents/verifier-07/artifacts/primary.json. Use that command[2] string byte-for-byte; the retained machine-readable command array is the authoritative unabridged invocation.

2. The program creates separate A-artifact fixtures under /work, places a mock git earlier in PATH, and executes the source-derived sequence git fetch origin; git reset --hard origin/master; bash scripts/deploy/vps-release.sh. A successful mocked reset selects the harmless B script. Separate cases model a newer origin/master, an unavailable fetch with stale origin/master, and a failed reset. It stops after printing release identity, artifact identity, exit status, and mock call order.

3. The parent wrapper supplied isolated user, mount, network, and PID namespaces; an empty isolated network; a read-only tracked source and toolchain; an allowlisted environment; no capabilities; a 64 MiB scratch-only tmpfs; and explicit CPU, memory, process, descriptor, file-size, inode, and wall-clock limits. No real Git mutation or external/shared service was used.

4. Artifact: agents/verifier-07/artifacts/primary.json

**Observed result:**

The newer-origin case returned release=B selected=B artifact=A, fragment_status=0, and mock calls [fetch origin][reset --hard origin/master], proving the minimum identity mismatch: B's release logic executed while A's artifact remained. With mocked fetch status 1, the same B-with-A result and zero final status occurred. With mocked reset status 1, the pre-existing A release script still executed and the fragment returned zero. These observations establish only the command-ordering and source/artifact identity defect; no real deployment, secret access, or persistent effect was attempted.

**Why this priority is justified (and not inflated):**

- Likelihood: Exploitation requires master-write or merge influence and a later revision arriving before an earlier run's reset. That is not available to an unauthenticated web attacker, but the window includes the earlier run's entire test, build, approval, and deployment period, and workflow concurrency legitimately leaves later runs pending.
- Impact: A later master revision's arbitrary shell release logic can run as the VPS deploy user under the earlier run's production deployment authority before its own required gates complete. The bounded check demonstrated only harmless marker execution; secret theft or persistent host compromise was not attempted.
- Confidence: All cited lines are present and form a direct source-visible path from run-pinned artifact delivery through mutable reset to execution of the selected release script. The parent-sandboxed non-Git rehearsal independently reproduced the minimum B-script/A-artifact result. Real-time hosted timing is a condition of exploitation, not a fact needed to establish the defective control flow.

**Smallest effective fix:** Bind the VPS checkout to github.sha and make every source-resolution step fail closed before writing production configuration or invoking the release script. After fetching, require the triggering commit object to exist, reset to that exact SHA, and verify HEAD. Update the existing deployment workflow regression test to reject origin/master resets and require the immutable reset and HEAD verification before the release invocation.

**Proposed change in `.github/workflows/production-deploy.yml`:**

```yaml
# Pull the exact source revision that produced .next.incoming.
EXPECTED_SHA='${{ github.sha }}'
echo "📥 Pulling source $EXPECTED_SHA..."
if ! git fetch origin; then
  echo "❌ Could not fetch source"
  exit 1
fi
if ! git cat-file -e "$EXPECTED_SHA^{commit}" 2>/dev/null; then
  echo "❌ Triggering commit is unavailable"
  exit 1
fi
if ! git reset --hard "$EXPECTED_SHA"; then
  echo "❌ Could not select triggering commit"
  exit 1
fi
if [ "$(git rev-parse HEAD)" != "$EXPECTED_SHA" ]; then
  echo "❌ Deployed source does not match triggering commit"
  exit 1
fi
```

**Proposed change in `tests/unit/deploy-vps-release.test.ts`:**

```typescript
it('runs release logic only from the immutable triggering revision', () => {
  const resetAt = sshScript.indexOf('git reset --hard "$EXPECTED_SHA"')
  const verifyAt = sshScript.indexOf('git rev-parse HEAD')
  const releaseAt = sshScript.indexOf('bash scripts/deploy/vps-release.sh')
  expect(sshScript).toContain("EXPECTED_SHA='${{ github.sha }}'")
  expect(sshScript).not.toContain('git reset --hard origin/master')
  expect(sshScript).toContain('if ! git fetch origin; then')
  expect(resetAt).toBeGreaterThan(-1)
  expect(verifyAt).toBeGreaterThan(resetAt)
  expect(releaseAt).toBeGreaterThan(verifyAt)
})
```


### MEDIUM — Failed dependency reinstall does not restore a runnable previous release



**Severity / confidence:** Medium (likelihood: low; impact: medium) / independent confidence: high.

**Affected boundary:** scripts/deploy/vps-release.sh:20 (entrypoint) → ecosystem.config.js:8 (sink)

**Description:** When a package-lock or Node-version change selects dependency reinstallation, the release script stops PM2 and deletes node_modules before npm ci has succeeded. If the registry, package retrieval, or an installation lifecycle step fails, recovery neither restores the previous dependencies nor verifies the Next.js entrypoint; it only requests PM2 to start an application whose configured script is beneath the deleted tree. A bounded dummy rehearsal observed the old .next build survive while the old Next.js marker was absent and recovery was refused. Restoring only that marker made the otherwise identical PM2 control succeed.

**Root cause:** Dependency replacement is destructive and non-transactional: the previous node_modules tree is removed before its replacement is known to be usable, while rollback preserves only .next and does not restore or validate the other state required to run that release.

**Intended invariant:** A failed dependency installation must leave the previous build and every dependency required to run it intact, or restore that complete state before requesting PM2 recovery; the incoming build must remain unpromoted.

**Ordered source trace:**

| Step | Location | Scope | Evidence |
|---|---|---|---|
| entrypoint | `scripts/deploy/vps-release.sh:20` | Dependency refresh gate | A mismatched dependency stamp selects the destructive reinstall path when the lockfile or Node version changes. |
| propagation | `scripts/deploy/vps-release.sh:25` | Stop PM2 | The currently working application is stopped before the replacement dependency set is known to be complete. |
| propagation | `scripts/deploy/vps-release.sh:29` | Delete dependency tree | rm -rf node_modules destroys the previous runtime dependencies without preserving a backup. |
| propagation | `scripts/deploy/vps-release.sh:30` | Install production dependencies | A registry, package, or lifecycle failure enters the failure branch after the old dependency tree has been removed and only a partial replacement may exist. |
| propagation | `scripts/deploy/vps-release.sh:32` | Installation failure recovery | Recovery requests only pm2 start for the old application; it performs no dependency restoration or runnable-state assertion before exiting with failure. |
| sink | `ecosystem.config.js:8` | PM2 application script | The configured application requires node_modules/next/dist/bin/next, so retaining .next alone does not retain a runnable previous release. |

**Source evidence:**

- `scripts/deploy/vps-release.sh:29` — The previous dependency tree is deleted immediately before npm ci, with no preceding dependency backup.
- `scripts/deploy/vps-release.sh:32` — The failed-install branch attempts PM2 recovery without restoring node_modules or checking that its configured script exists.
- `scripts/deploy/vps-release.sh:33` — The script exits unsuccessfully immediately after the recovery request and provides no further dependency rollback.
- `scripts/deploy/vps-release.sh:44` — The later build-promotion rollback backs up .next only; this code is not reached on npm ci failure and has no node_modules counterpart.
- `ecosystem.config.js:8` — PM2 starts the application through the Next.js executable inside node_modules, the tree deleted by the reinstall path.
- `tests/unit/deploy-vps-release.test.ts:161` — The existing npm-failure test checks retention of old .next and a PM2 start request, but not successful recovery of a runnable dependency state.
- `tests/unit/deploy-vps-release.test.ts:20` — The existing npm stub exits on failure without modeling loss of the previous Next.js executable, and its PM2 stub does not require that executable.
- `agents/verifier-06-final/artifacts/primary.json:41` — The fresh isolated rehearsal recorded release_status 1, old_build old, an absent Next.js marker, one missing-marker recovery refusal, and a restored-marker control with status 0 and exactly one pm2_recovery_script_present record.

**Access assumptions and containment:**

- **system_configuration** — The deployment uses the supplied ecosystem.config.js application idaromme-website and its node_modules/next/dist/bin/next script path.
- **data_state** — A previous release and dependency tree exist, but the stored lockfile/Node-version stamp differs from the desired deployment state.
- **third_party_dependency** — npm ci --omit=dev fails after node_modules removal because of a registry outage, package retrieval error, or installation lifecycle failure.

**Realistic attack scenario / impact:**

A lower-trust dependency source or lifecycle publisher can induce the npm failure during an operator-initiated dependency-changing deployment; an ordinary registry outage reaches the same failure branch without requiring application-user access. The affected resource is availability of the previously working portfolio service: its old build remains, but the configured runtime entrypoint is destroyed and recovery cannot restore a runnable dependency state without external repair.

**Proof of concept / actual bounded reproduction:**

**Attacker perspective/access:** A lower-trust dependency source or lifecycle publisher can induce the npm failure during an operator-initiated dependency-changing deployment; an ordinary registry outage reaches the same failure branch without requiring application-user access.

**Payloads / exact dummy inputs:**

```text
Dummy dependency state: package-lock.json=lock-v2, node_modules/.deploy-lock-hash=mismatched-old-stamp, dummy Node version=v24.0.0.
```

```text
Dummy old release: .next/BUILD_ID=old; dummy incoming release: .next.incoming/BUILD_ID=new; old Next.js marker=node_modules/next/dist/bin/next.
```

```text
Dummy npm behavior: log npm ci --omit=dev and exit 1 without recreating node_modules.
```

```text
Dummy PM2 behavior: refuse start idaromme-website with status 42 and log pm2_recovery_script_missing when the marker is absent; otherwise log pm2_recovery_script_present and exit 0.
```

**Target-neutral reproduction actually used:**

1. Run this exact approved wrapper invocation from the trusted host: python3 /tmp/opencode/security-audit-skill/textile-showcase/run-1/sandbox_exec_parent.py verifier-06-final --artifact primary -- /bin/sh -c '
mkdir -p /work/bin /work/home /work/tmp /work/site/.next /work/site/.next.incoming /work/site/node_modules/next/dist/bin
cat > /work/bin/node <<"EOF"
#!/bin/sh
if [ "$1" = "--version" ]; then
  echo v24.0.0
  exit 0
fi
exit 1
EOF
cat > /work/bin/npm <<"EOF"
#!/bin/sh
echo "npm $*" >> /work/calls
exit 1
EOF
cat > /work/bin/pm2 <<"EOF"
#!/bin/sh
echo "pm2 $*" >> /work/calls
if [ "$1" = "start" ] && [ "$2" = "idaromme-website" ]; then
  if [ -f node_modules/next/dist/bin/next ]; then
    echo pm2_recovery_script_present >> /work/calls
    exit 0
  fi
  echo pm2_recovery_script_missing >> /work/calls
  exit 42
fi
exit 0
EOF
chmod 755 /work/bin/node /work/bin/npm /work/bin/pm2
printf old > /work/site/.next/BUILD_ID
printf new > /work/site/.next.incoming/BUILD_ID
printf lock-v2 > /work/site/package-lock.json
printf mismatched-old-stamp > /work/site/node_modules/.deploy-lock-hash
printf dummy-next > /work/site/node_modules/next/dist/bin/next
: > /work/calls
cd /work/site || exit 90
/usr/bin/env -i PATH=/work/bin:/usr/local/bin:/usr/bin:/bin HOME=/work/home TMPDIR=/work/tmp /bin/bash /app/scripts/deploy/vps-release.sh > /work/release-output 2>&1
release_status=$?
old_build=$(cat .next/BUILD_ID)
if [ ! -e node_modules/next/dist/bin/next ]; then next_absent=true; else next_absent=false; fi
if [ -f .next.incoming/BUILD_ID ] && [ "$(cat .next.incoming/BUILD_ID)" = new ]; then incoming_unchanged=true; else incoming_unchanged=false; fi
npm_ci_requests=$(grep -c "^npm ci --omit=dev$" /work/calls || true)
recovery_start_requests=$(grep -c "^pm2 start idaromme-website$" /work/calls || true)
missing_next_results=$(grep -c "^pm2_recovery_script_missing$" /work/calls || true)
mkdir -p node_modules/next/dist/bin
printf dummy-next > node_modules/next/dist/bin/next
/work/bin/pm2 start idaromme-website >/dev/null 2>&1
control_start_status=$?
present_next_results=$(grep -c "^pm2_recovery_script_present$" /work/calls || true)
cat /work/release-output
printf "{\n  \"release_status\": %s,\n  \"old_build\": \"%s\",\n  \"next_marker_absent_after_failure\": %s,\n  \"incoming_build_unchanged\": %s,\n  \"npm_ci_requests\": %s,\n  \"recovery_start_requests_before_control\": %s,\n  \"missing_next_start_results\": %s,\n  \"control_start_status_after_restoring_marker\": %s,\n  \"present_next_control_results\": %s\n}\n" "$release_status" "$old_build" "$next_absent" "$incoming_unchanged" "$npm_ci_requests" "$recovery_start_requests" "$missing_next_results" "$control_start_status" "$present_next_results"
printf "%s\n" "--- pm2/npm calls ---"
cat /work/calls
exit 0
'

2. Confirm that the failed-install run exits 1, leaves old .next and the incoming build untouched, loses the previous Next.js marker, and records one missing-marker recovery refusal.

3. Confirm that the explicit restored-marker control exits 0 and that /work/calls contains exactly one pm2_recovery_script_present entry; the calls are emitted on stdout.

4. Artifact: agents/verifier-06-final/artifacts/primary.json

**Observed result:**

The failed-install run returned release_status 1 after exactly one dummy npm ci request. It retained .next/BUILD_ID=old and .next.incoming/BUILD_ID=new, but node_modules/next/dist/bin/next was absent. Before the control, exactly one recovery start was requested and the dummy PM2 boundary recorded pm2_recovery_script_missing and refused it. After restoring only the dummy Next.js marker, /work/bin/pm2 start idaromme-website returned 0 and /work/calls contained exactly one pm2_recovery_script_present entry. The promoted artifact has wrapper return code 0, no timeout, empty stderr, and untruncated output.

**Why this priority is justified (and not inflated):**

- Likelihood: The defect requires both a dependency-changing deployment and an npm registry, package, or lifecycle failure; it is not triggered by ordinary requests or every deployment.
- Impact: The affected resource is availability of the previously working portfolio service: its old build remains, but the configured runtime entrypoint is destroyed and recovery cannot restore a runnable dependency state without external repair.
- Confidence: The destructive source path and configured missing entrypoint are explicit, and the isolated failed-install rehearsal plus restored-marker control establish both the missing-marker failure and successful recovery directions without contacting real npm, PM2, or deployment infrastructure.

**Smallest effective fix:** Make dependency replacement transactional. Preserve the prior node_modules tree before installation, remove any partial replacement and restore that backup on every installation failure, and verify node_modules/next/dist/bin/next exists before requesting PM2 recovery. Extend the npm-failure regression test so the PM2 stub requires the configured Next.js marker and assert successful recovery with the restored previous dependency tree, in addition to retention of old .next and non-promotion of the incoming build.


## 4. LOW confirmed findings

These are real boundary/control failures with limited demonstrated impact. Full traces, exact dummy fixtures and artifacts remain in `findings.json` and the referenced verifier artifacts.

| Finding and location | Access assumption | Observed result and impact | Fix |

|---|---|---|---|

|**Advisory-ID-only audit exceptions waive unreviewed dependency contexts**<br>`scripts/audit-gate.js:84 → .github/workflows/production-deploy.yml:129`|No runtime application account or production credential is involved. Influence must come through dependency/advisory data or an ordinary reviewed dependency-lock change, not through editing the exception or workflow outside the normal repo…|Using the checked-in GHSA-fc5q-39xc-vjpf exception, the reviewed picomatch/<4.0.8 context returned ok=true as expected. The unreviewed runtime-fixture/<9.0.0/Next.js-path record alone also returned ok=true with that runtime-fixture in excepted and no blocking records. The synthetic picomatch range >=4.0.8 <9.0.0 at version 8.1.0 and a Next.js-server path li…<br><br>Artifact: agents/verifier-01/artifacts/primary.json|Encode reviewed scope as structured exception data rather than relying on prose. Require at least advisory, package, and vulnerable range for every exception, and include approved dependency-node/path and resolved-version scope where the rationale depends on them. Preserve each via object's outer vulnerability nodes and correlate any required lockfile version; deduplicate only exact duplicate occurrences with a composite identity, never globally by GHSA/source ID. An unmatched high/critical occurrence must remain in blocking even when another occurrence is excepted. Migrate the current exception to an explicit picomatch/<4.0.8 Studio-CLI scope or remove it until that scope can be enforced. Add regression tests showing that (1) runtime-fixture with the same GHSA remains blocking, (2) a different picomatch range/path/version remains blocking, (3) reviewed and unreviewed same-ID contexts produce one exception and one blocker rather than collapsing, and (4) exact in-scope, missing-exception, malformed, and expired controls retain their existing behavior.|

|**Sandbox launches target code after required cgroup setup fails**<br>`scripts/security-audit/run-sandboxed.sh:7 → scripts/security-audit/run-sandboxed.sh:42`|A root audit operator or scheduled audit job invokes this script for code supplied by a repository contributor or dependency publisher; the attacker controls audited target code, not the parent shell.; At least one required memory or pids…|The unchanged script reported failures for both cgroup mkdir operations and every required limit and membership redirection on lines 16 and 18-20. It nevertheless emitted UNSHARE_REACHED, then INNER_EXEC_REACHED, then TARGET_RAN, created /work/scratch/marker, and finished with OBSERVED_TARGET_RAN_AFTER_CGROUP_FAILURE rc=0 marker=yes. The line 36 writable-mo…<br><br>Artifact: agents/verifier-02/artifacts/primary.json|Fail closed on every required cgroup setup operation before unshare while preserving the explicit exception only for optional memsw configuration. Use a short-circuiting conditional so any failure produces a nonzero exit and no target execution. Add a regression test that makes each required operation fail in turn and asserts that the unshare/target marker is never reached; retain an all-setup-success control case. No memory stress test is needed.|

|**Candidate import and verifier evidence are not bound to accepted producer-owned units**<br>`scripts/security-audit/consolidate.py:14 → scripts/security-audit/build-verifiers.py:41`|The actor must be a lower-trust audit hunter whose structured result is submitted by the parent to consolidate.py for one or more assigned in-progress units; no web access, credentials, or external service is involved.; For unaccepted-cand…|Both consolidation commands and prompt building returned 0. The first command logged 'ERROR: malformed result for dummy-unit-unaccepted; left planned', and the unit became planned with agent_id null, but dummy-unaccepted was nevertheless imported with _source_agent hunter-unaccepted. Its generated prompt contained DUMMY-UNACCEPTED-CANDIDATE and an empty lin…<br><br>Artifact: agents/verifier-13/artifacts/primary.json|Make candidate linkage transactional in consolidate.py: require every accepted candidate unit to name a nonempty set of fingerprints declared by that same result, reject producer-inconsistent links to pre-existing candidates, and import only candidates referenced by at least one successfully accepted unit owned by that producer; on violation, leave the affected unit planned and do not import or associate the candidate. Persist the validated producer/unit association and make build-verifiers.py fail closed on a missing, empty, or inconsistent association rather than constructing a prompt from a one-way fingerprint match. Preserve the fresh independent-verifier gate. Add two regression fixtures matching the demonstrated cases: a malformed candidate unit must produce neither an imported candidate nor a verifier prompt, and a valid unit that names another producer's pre-existing fingerprint without a valid candidate declaration must be rejected without adding its check to that candidate's prompt.|

|**Coverage views omit unfinished review states and consolidation erases covered-result unresolved facts**<br>`scripts/security-audit/consolidate.py:20 → scripts/security-audit/build-dashboard-data.py:72`|The result producer must be the canonical agent assigned to the affected in_progress units; the reproduction used dummy-hunter with a valid owned source check and did not bypass unit ownership.; Either an assigned unit is absent from the h…|The sandbox returned 0 with no stderr or truncation. Consolidation returned 0, applied one unit, and printed a missing-result ERROR for fixture-0. The persisted ledger was schema-valid (PASS: 3 coverage units valid) with fixture-0 planned/agent_id null/unresolved [], fixture-1 covered with the supplied sentinel replaced by [], and fixture-2 in_progress. REP…<br><br>Artifact: agents/verifier-14-retry/artifacts/primary.json|In consolidate.py, reject a covered result with nonempty unresolved facts, or preferably retain an otherwise valid owned attempt as blocked with its checks and unresolved facts, and log the correction; never write covered with supplied facts erased. In write-reports.py and build-dashboard-data.py, derive planned and in_progress counts alongside the five terminal states. Add report rows for planned and in_progress with unit identity and an explicit derived reason such as "review incomplete; reassignment required" when the ledger state contract requires unresolved to be empty. Add a regression using the dummy omitted-unit and covered-with-unresolved fixtures: assert that unresolved evidence survives as blocked (or the result is rejected), aggregate counts account for all three fixture units, incomplete identities/reasons are visible, and raw row statuses remain intact.|

|**Report generator emits hard-coded security conclusions that contradict final records**<br>`scripts/security-audit/write-reports.py:10 → scripts/security-audit/write-reports.py:78`|The generator processes a schema-valid final record set or ledger that differs from the hard-coded assumed run, including an empty set, a non-CMS high-severity record, or an unrelated needs-validation blocker.; An auditor or maintainer rel…|The combined harness returned 0, with no timeout or truncated streams, and every assertion passed. With zero records, REPORT.md stated '0 low-severity issue was confirmed: a Sanity editor can inject HTML through JSON-LD', while FINDINGS-DETAIL.md still said 'The one confirmed record is `low`'; the empty deep-profile ledger was nevertheless accompanied by th…<br><br>Artifact: agents/verifier-15-retry/artifacts/primary.json|In scripts/security-audit/write-reports.py, replace the fixed posture at line 32, fixed boundary at line 35, fixed critic narrative at line 64 and fixed detail preamble at line 74 with values derived from the current findings, ledger and metadata. Use each record's actual description/execution context where the schema has no dedicated boundary field rather than inventing one; emit explicit zero-record and zero-lead text; omit or mark unavailable any critic/control fact not represented by current inputs. Keep dynamic record details, but make their headings and summaries consistent with those same records. Add regression tests using the three validated dummy fixtures—empty, high-severity non-CMS and unrelated needs-validation—and assert that no Sanity/CMS/nginx/quick-profile statement appears unless supported by the supplied inputs.|

|**Authorized CMS editors can inject sitemap XML through manually edited slugs**<br>`src/sanity/schemas/textileDesign.ts:76 → node_modules/next/dist/build/webpack/loaders/metadata/resolve-route-data.js:112`|The actor must already have Sanity permissions to edit and publish textileDesign documents or equivalent programmatic write access; no unauthenticated request reaches this path.; A published document must have a manually edited or programm…|The single mocked Sanity fetch produced four sitemap entries: three static entries and one project. The project URL retained the delimiter payload verbatim. Next 16.4.6 serialization produced five <url> elements and contained the literal structural fragment <url><loc>https://example.invalid/</loc>. The original project URL became https://idaromme.dk/project…<br><br>Artifact: agents/verifier-16/artifacts/primary.json|Enforce the path-segment boundary at the last application-owned decision point by applying encodeURIComponent to project.slug before URL interpolation. Add a regression that passes the same dummy delimiter record through sitemap and the pinned Next resolveRouteData serializer, asserting that the XML has one <url> per returned entry, contains no raw delimiter payload or injected origin, and preserves an ordinary slug as /project/ordinary-slug. Optional Sanity Rule.regex validation can provide earlier editor feedback but must not replace sink-side encoding.|

|**Rate-limit capacity eviction can reset the global contact-send quota**<br>`src/app/api/contact/route.ts:88 → src/app/api/contact/route.ts:165`|The contact endpoint and its per-client accounting are reachable without authentication.; The attack assumes access to requests that the trusted ingress derives as genuinely distinct client IPs. Forged leftmost forwarding values are not su…|The approved sandbox exited 0 with no truncation. At fixed fake time 1700000000000, 30 global checks were admitted and the next check was blocked with count 30 before churn. After exactly 10,000 fresh dummy-IP insertions, __contact_global__ was absent even though fake time remained before its original resetTime 1700003600000. The next global check returned…<br><br>Artifact: agents/verifier-19/artifacts/primary.json|Prevent per-client capacity management from evicting an unexpired global contact counter, either by exempting __contact_global__ from oldest-entry eviction or by storing that fixed-window counter separately while retaining the bounded per-client Map. Continue deleting the global counter when its own window expires. Add a regression test that exhausts the global limit, fills the store with unexpired dummy per-client keys, verifies that subsequent global checks remain denied with the original resetTime, and separately verifies normal reset after that resetTime.|

|**Nonexistent project slugs create uncapped navigation-cache entries**<br>`src/app/api/projects/[slug]/route.ts:16 → src/sanity/dataFetcher.ts:20`|The caller needs no authentication or authorization. Accepted slugs must satisfy the route's 1-200 character Unicode letter/number/underscore/dot/hyphen pattern.; Each selected slug must be absent from published textileDesign documents, ca…|With frozen time and the mocked client, 101 distinct missing slugs produced exactly 101 retained live entries and exactly 101 client.fetch calls. lazyCleanup ran after the Map reached 100 entries but removed none because all were fresh. Repeating missing-0 returned the identical object reference from the first request, left cacheUtils.size() at 101, and lef…<br><br>Artifact: agents/verifier-20-retry/artifacts/primary.json|Add a small hard aggregate maximum to QueryCache and evict the oldest insertion before adding a new key at capacity, while retaining TTL cleanup. A fixed bound of 1000 is illustrative and can be operationally tuned; FIFO eviction is sufficient to correct cardinality without disabling negative navigation caching. Add a regression test with a mocked client that inserts 1001 fresh distinct keys and asserts the size never exceeds 1000 and the oldest key was evicted, verifies overwriting an existing key does not increase cardinality, and verifies an exact repeat of a surviving key is served without another fetch.|

|**Sanity timeouts retry without cancelling the prior operation**<br>`src/app/api/projects/[slug]/route.ts:16 → src/sanity/dataFetcher.ts:156`|No authentication is required for GET /api/projects/[slug].; The request must miss the in-memory result cache, as occurs for a new valid slug or while all attempts are stalled; successful cache hits avoid the downstream path.; The first un…|The parent artifact returned code 0 without timeout or truncation. firstPendingAtSecondCall=true, attemptCountAtOverlap=2, both options entries were type undefined with hasSignal=false, and wrapperResult=null while the first underlying promise remained unsettled. Cleanup set bothResolvedForCleanup=true, finalAttemptCount stayed 2, and no stronger service ef…<br><br>Artifact: agents/verifier-21/artifacts/primary-retry.json|Bind each application timeout to an AbortController and pass its signal plus an aligned per-request timeout to client.fetch, so the timer actively aborts the SDK request before backoff. Disable the SDK's independent maxRetries on this shared client because resilientFetch already owns retries; this prevents nested retry amplification. Add a regression test with two controlled deferred promises and signal-aware mocks that asserts attempt one's signal aborts before attempt two and that both promises are resolved during cleanup.|

## 5. Needs validation (unrated)

These are source-grounded leads with a concrete possible boundary result, not confirmed vulnerabilities and not assigned severity. Ordered traces, full source evidence and exact blockers are in `NEEDS-VALIDATION.md`.

| Lead | Boundary under review | Decisive blocker | Required safe next step |

|---|---|---|---|

| Unlocked Lighthouse CI resolution may execute in a GitHub App-token-bearing step | `.github/workflows/lighthouse-ci.yml:98 (entrypoint) → .github/workflows/lighthouse-ci.yml:108 (sink)` | The real @lhci/cli@0.12.0 dependency metadata, selected global dependency graph, dependency ranges, and artifact integrity values are not in the reviewed repository. Source therefore does not identify any actual transitive package whose publisher can cause a newly selected release to enter this workflow. No parent-approved local evidence contains a real resolution or package-loading trace for @lhci/cli@0.12.0. Registry contac… | Local: Have the owner supply non-secret, time-stamped registry metadata snapshots for @lhci/cli@0.12.0 and every dependency selected by its clean global resolution. In an offline isolated fixture with empty caches and lifecycl…<br>Deployment: Without revealing the secret value, the repository owner should verify whether LHCI_GITHUB_APP_TOKEN is configured for push-to-master and relevant pull-request runs, inspect the associated GitHub App installation's perm… |

| The Lighthouse PR-comment step executes event-checkout helper code before its GitHub API call | `.github/workflows/lighthouse-ci.yml:7 (entrypoint) → .github/workflows/lighthouse-ci.yml:294 (sink)` | The repository does not establish whether any lower-trust PR origin that can replace the helper receives a usable write-capable GITHUB_TOKEN. Fork origin, first-time/contributor approval, repository settings for sending write tokens to fork workflows, and platform permission downgrading are not source-visible. Same-repository collaborators who already possess equivalent comment authority must not be treated as demonstrated pr… | Local: Obtain a trusted exact snapshot of actions/github-script at commit 3a2844b7e9c422d3c10d287c895573f7108da1b3 and verify that snapshot identity before use. In the parent-approved no-network sandbox, supply only a non-secr…<br>Deployment: For later owner observation only, use an owner-controlled disposable repository containing no production secrets or GitHub App credentials and only an ephemeral platform-issued test GITHUB_TOKEN. Record repository token… |

| Pull-request Lighthouse configuration can execute in a step carrying the LHCI GitHub App token | `.github/workflows/lighthouse-ci.yml:7 (entrypoint) → lighthouserc.js:146 (sink)` | GitHub's release of LHCI_GITHUB_APP_TOKEN to same-repository, fork, and other pull-request runs is not established by repository source and must be rehearsed with a non-secret sentinel; no real secret exposure is inferable from the local require. The workflow's exact @lhci/cli@0.12.0 implementation is not vendored or installed in the approved local target, so lhci autorun's configuration discovery, startServerCommand lifecycl… | Local: Completed through the approved parent wrapper with LHCI_GITHUB_APP_TOKEN set to verifier-05-dummy-sentinel, CI=true, and NODE_ENV=production: requiring /app/lighthouserc.js returned configLoaded=true, uploadTokenPresent…<br>Deployment: In an owner-controlled disposable repository or equivalent rehearsal, store a non-secret sentinel as LHCI_GITHUB_APP_TOKEN and run the unchanged workflow logic for separate same-repository and fork pull requests. In eac… |

| Direct-origin access could forge the contact per-IP rate-limit identity | `src/app/api/contact/route.ts:88 (entrypoint) → src/app/api/contact/route.ts:92 (sink)` | The isolated listener result is not an observation of the deployed VPS. The effective production listener address for TCP/3001 has not been owner-observed and must not be inferred to be either `::` or `0.0.0.0` solely from the local namespace. No repository or local evidence establishes whether lower-trust network traffic can reach TCP/3001 directly without nginx. Effective nginx forwarding configuration, host UFW/nftables po… | Local: Completed through the approved parent wrapper `python3 /tmp/opencode/security-audit-skill/textile-showcase/run-1/sandbox_exec_parent.py verifier-09 --artifact primary --` followed by the exact command array and combined…<br>Deployment: Have the owner perform read-only inspection only, with no public probing or rule changes: on the VPS record `ss -lntp 'sport = :3001'`; inspect the effective nginx configuration for the port-3001 proxy_pass and whether… |

| Broad Sanity image allowlist may permit anonymous cold-cache optimizer work across arbitrary source URLs | `next.config.ts:20 (entrypoint) → ecosystem.config.js:11 (sink)` | The approved OS sandbox was used for one bounded local harness with a tracked PNG fixture and no external I/O, but it terminated before producing observations with return code 134 and '../glib/gprintf.c:351: failed to allocate memory'. The retained artifact agents/verifier-10/artifacts/primary.json therefore does not establish cold-versus-repeat fetch/transform counts, runtime coalescing, or memory behavior. Installed source… | Local: Diagnose and rerun the sandbox fixture without changing target source or adding load. Bound native Sharp worker concurrency to one inside the fixture before initializing the Next image pipeline to avoid host-CPU-depende…<br>Deployment: Have the owner inspect, without generating traffic, the effective Nginx/CDN rules for /_next/image, including limit_req, limit_conn, cache behavior, burst, and concurrency values, plus firewall exposure of the Next list… |

| Maintainer hooks are resolved from mutable remote tags | `.pre-commit-config.yaml:11 (entrypoint) → CONTRIBUTING.md:70 (sink)` | Current tag-to-commit mappings, whether each remote tag resolves to maintainer-reviewed hook content, who can retarget it, and any hosted tag-update or immutability protection are external facts absent from the target source and were not checked. Maintainers' installed pre-commit versions and cache states are not declared or observable. Exact fresh-resolution and populated-cache behavior, and which hook implementations mainta… | Local: Keep this review read-only and do not run pre-commit, create commits, or move tags. On each maintainer host, inspect the exact installed pre-commit package and existing cache metadata without executing hooks to determin…<br>Deployment: Outside this review, an owner should use read-only provider/ref inspection for the exact three repository-and-tag pairs, record their current full commit IDs, and compare the corresponding hook definitions with content… |

| Contact actual-size check occurs only after request.text() buffers the body | `src/app/api/contact/route.ts:88 (entrypoint) → src/app/api/contact/route.ts:107 (sink)` | The effective nginx/front-proxy configuration is absent. Its request-body limit, handling of omitted or understated Content-Length, buffering behavior, and enforcement stage are decisive to whether anonymous clients can impose meaningful memory growth or affect other visitors. The single bounded sandbox attempt did not reach target code because its /work CommonJS fixture could not resolve next/server; the failed artifact supp… | Local: Repeat the small network-disabled NextRequest stream fixture with NextRequest imported through /app/node_modules/next/server.js or an /app-anchored createRequire so dependencies resolve from /work. Supply only dummy 16,…<br>Deployment: By non-destructive configuration review only, the owner should inspect the effective nginx/front-proxy configuration for POST /api/contact, including the exact client_max_body_size or equivalent limit, chunked/understat… |

| CSP report cap is enforced only after body buffering | `src/app/api/csp-report/route.ts:104 (entrypoint) → src/app/api/csp-report/route.ts:123 (sink)` | The retained local artifact agents/verifier-18/artifacts/primary.json failed before loading the route: its /work harness used require("next/server"), Node reported MODULE_NOT_FOUND, returncode was 1, and stdout was empty. Neither the two 8,193-code-unit cases nor the declared-over-limit negative control executed, so a fresh successful bounded run is required before claiming dynamic confirmation of route ordering. The effectiv… | Local: In the approved sandbox with a fresh parent-predeclared artifact, use a single bounded route harness with an 8,193-code-unit ASCII dummy body, Content-Type application/csp-report, and first no Content-Length then Conten…<br>Deployment: By configuration and existing-log review only, owner should record effective nginx -T client_max_body_size inheritance, proxy_request_buffering, connection/request limits and whether port3001 is externally reachable; ve… |

## 6. Rejected claims (not findings)

- **Dependency lifecycle capability alone does not establish a new Resend credential boundary violation** — Reject as a defense-in-depth concern rather than a demonstrated vulnerability. The candidate has no current lower-trust actor who can alter the integrity-pinned package bytes on push-to-master deployment and no evidence of malicious or credential-reading behavior in the selected dependency. A dummy postinstall fixture would establish only the ordinary fact that a child process with the same OS identity can read that identity's files; it would not supply the missing attacker control, actual disclosure, or incremental authority. Unknown npm configuration, outbound policy, and platform-specific hook selection therefore are not decisive blockers worth retaining. Moving secret creation later or disabling scripts may reduce exposure, but lifecycle code already runs as the release identity before artifact promotion and application startup, so the proposed ordering change alone would not enforce a meaningful privilege boundary against malicious installation code.

- **Bounded public-content caching is not a publication-revocation bypass** — An independent sandboxed run using only dummy CMS records confirmed the cache mechanics but refuted the security classification (agents/verifier-12/artifacts/primary.json). Warm detailed, list, slug, and sitemap results remained available within their process-cache TTLs without additional provider calls. After advancing time by 600001 ms for detail and sitemap, and 300001 ms for list and slugs, the next reads fetched the mocked current publication state: detail returned 404, list and slugs became empty, and the sitemap removed the dummy project URL. Thus staleness is bounded and self-correcting. Every object involved was intentionally public; no unauthorized principal obtained draft/private data or another identity's response. The published-perspective provider filter is not a zero-staleness guarantee, while explicit TTLs and public Cache-Control policies demonstrate intended cached delivery. Deployed CDN behavior therefore is not decisive: absent a separate immediate-revocation guarantee or protected-data boundary, this is ordinary eventual consistency rather than a security revocation violation.

## 7. Coverage and important limitations

- **Coverage ledger:** 30 units; {'covered': 10, 'candidate': 17, 'out_of_scope': 2, 'blocked': 1}. No units are deferred; 2 external/provider units are explicitly out of scope and 1 is blocked by hosted settings. Two prior attempts were archived and superseded by fresh evidence; later reviewer-empty attempts were discarded and reassigned.
- **Critics:** wave-4 critic and a separate final-clean critic returned `stop: true`, with no missing units or reassignments. This is not a claim that one pass exhaustively proves security.
- **Validation coverage:** 21 unique candidates -> 11 confirmed, 8 needs-validation, 2 rejected; duplicate cache-lifecycle variants share the same root cause rather than being double-counted.
- **Out of scope due missing exact source:** external `maxrantil/.github` reusable-workflow implementations at the pinned commit (expression/shell/checkout behavior) and hosted Resend key/sender-domain/revocation policy. These need owner-supplied source/config observations.
- **Blocked deployment fact:** effective GitHub repository branch/environment review and secret-attachment policy. Sanity dataset/member/token/CORS policy, nginx/firewall/public reachability, deployed runtime settings and shared-cache topology are also not assumed.
- **Generated/third-party content:** generated build/test outputs and untracked reports from other runs were not treated as audited source. Targeted installed Next/Sanity dependencies were used only to verify decisive framework behavior such as XML serialization and SDK deadlines.

## 8. Hardening notes and positive controls

### Hardening, not elevated without a demonstrated boundary result

- .github/workflows/performance-budget.yml:169 and lighthouse-ci.yml:57 should minimize persisted credentials and isolate reporting from code execution defense in depth. No additional lower-trust principal gaining authority beyond reported Lighthouse secrets established solely from write scopes.
- .github/workflows/performance-budget.yml:188 and lighthouse-ci.yml:98 should use reviewed lockfile for Lighthouse tooling rather than repeated global installation. Credential-bearing execution tracked separately as ci:global-lhci-resolution-secret; reproducibility alone not proof compromise.
- .github/workflows/secret-scan.yml:18 passes gitleaks-version:latest into otherwise SHA-pinned reusable workflow. Pin reviewed Gitleaks version and verify artifact digest inside reusable workflow; local caller exposes only contents:read and no subsequent release-artifact or secret-bearing consumer visible, so not elevated.
- Both contact and CSP handlers compare raw.length, a UTF-16 code-unit count, against constants named as byte limits. Multi-byte UTF-8 input can therefore exceed the nominal byte caps while passing the post-read comparison; this remains bounded and is not a separate availability finding from the pre-buffer candidates.
- Bundle-size-check comment step contents:read despite PR comments so intended reporting fails closed. Restore write only with provenance review not security fix by itself.
- Exception expiry values should parse as real dates and have maximum lifespan: regex/lexical comparison accepts impossible/arbitrary far-future dates. Repository change authorization makes this hardening not separate finding.
- Fixed-parameter home and projects-list Sanity calls do not expose attacker-controlled cache-key cardinality; preserve that fixed-key property and add regression coverage so future parameterized callers cannot bypass an aggregate QueryCache bound.
- Hosted Sanity dataset visibility, token roles, project membership, CORS origins, and provider credential policy should be documented as owner-reviewed deployment controls; repository source does not justify assuming them either secure or insecure.
- IndexNow has no JSON-byte or per-URL-string length cap after bearer authentication. Parsing is post-auth, the credential holder is authorized to trigger the same submissions, and each accepted request fans out only to two fixed providers with per-request abort signals, so no cross-principal availability finding is established. An upstream body-limit check and explicit URL lengths would be defense in depth.
- IndexNow validateUrl() checks the parsed host but does not require the https: scheme. Non-HTTPS same-host strings can therefore be submitted to the providers, but the application never fetches them; this is not application SSRF. Requiring https: would nevertheless align accepted submissions with the site's canonical transport.
- MobileErrorBoundary is not mounted in production. If it is adopted, classify and scrub error.message, error.stack and componentStack before analytics submission rather than relying only on the 500-character truncation.
- No direct draft-read or GROQ-injection path was found: slugs use $slug parameters and provider reads use published perspective. The stale process-cache lead is separate.
- No executable browser or Markdown sink is present, so unescaped report strings are not promoted to injection findings.
- Performance-budget lighthouse-budget-check job requests pull-requests:write despite visible steps only build collect upload parse results; remove unused write scope. No reachable GitHub mutation established no candidate.
- Pre-commit config comments instruct both installs while CONTRIBUTING documents only pre-commit install. Align setup; no cross-boundary impact.
- Production writes SECURITY_ENABLED=false and proxy.ts treats every value except the exact string'true' as demo mode. This is not a current authorization bypass because no /security or /api/security handler exists, but any future security handler should first replace the demo/static-token design with production authentication and add token, role, revocation, and matcher-variant tests.
- Retry loops have finite per-call ceilings and exponential backoff with jitter; missing cancellation is not reclassified as an infinite retry storm.
- The contact withTimeout helper does not cancel the underlying Resend promise, so provider work may continue after the route returns an error. This was not raised separately because every created send attempt is synchronously charged to the global budget first and no independent unbounded send-creation path was established.
- The proxy matcher excludes image-suffixed paths, so those paths do not receive its CSP, COOP, Permissions-Policy, or HSTS handling. next.config.ts still supplies X-Frame-Options DENY, nosniff, and Referrer-Policy, and no sensitive image-suffixed handler was found. Reassess full security-header coverage before adding dynamic extension-bearing routes.
- Use absolute-end matching or explicit line-terminator rejection for findings fingerprint and coverage agent-ID regexes, with trailing LF, CR, U+2028 and U+2029 regressions. Separate visible-text checks and arbitrary-identifier freedom prevented a concrete additional trust-boundary capability.
- build-dashboard-data.py labels rejected records needs validation unless remediation overrides; use a distinct rejected status while retaining the accurate rejected verdict/count.
- consolidate.py should reject unknown check methods, require source checks to use invoking hunter agent_id and constrain paths to assigned units; parent-owned artifacts/lstat checks prevent established artifact-file forgery.
- public/sw.js is dormant because nothing registers it. Before enabling it, or while cleaning up a separately verified legacy installation, make HTML caching respect request credentials/mode and response Cache-Control/Vary, exclude Studio and API routes, constrain WARM_CACHE destinations, and limit activation cleanup to caches owned by this worker.
- src/pages/api/health.js:40-48 races client.fetch against a five-second timer without propagating an AbortSignal. Passing an AbortController signal into client.fetch and choosing an explicit short provider timeout/retry policy would stop detached work closer to the health deadline. This was not elevated because singleton pending-work coalescing, 30-second result caching, and the locked client's source-visible timeout/retry controls prevent a source-grounded claim of unbounded shared impact.

### Positive security patterns verified during review

- Contact input has independent server-side Zod bounds, HTML-context escaping and subject control-character removal; recipient/from are server-selected.
- IndexNow fails closed without a secret and uses length-checked constant-time comparison, fixed HTTPS provider destinations and timeout bounds.
- CMS reads use parameterized GROQ and published perspective; CMS text uses React escaping and JSON-LD special-character escaping.
- `safeJsonLd` prevents script-element breakout; review found no active service-worker registration, so dormant worker-cache problems were not converted into production findings.
- Proxy-generated CSP nonces override client values and use strict-dynamic, framing protection and source-specific Studio connections.
- Actions are commit-SHA pinned, production deploy token is read-only, production secrets are environment-scoped, and SSH host verification is explicitly configured.
- Bounded public-content caching is eventual consistency, not an authorization bypass: dummy records disappeared correctly after TTL refresh.
- Findings and coverage validators were themselves source-reviewed, including canonical identities, state/lifecycle rules, artifact ownership, stale-evidence exclusion and strict verdict/severity checks.

## 9. Evidence map

- `findings.json` — final schema-valid verdicts, traces, blockers, actual reproduction and remediation for all 21 decided candidates.
- `coverage-ledger.json` — 30-unit validated coverage/evidence ledger and archived attempts.
- `FINDINGS-DETAIL.md` — complete High/Medium traces, exact dummy invocations, observed outputs and fixes.
- `NEEDS-VALIDATION.md` — exact blockers and safe local/owner-observed next steps for every unresolved lead.
- `agents/<verifier>/artifacts/primary.json` (and `primary-retry.json` for the detached-retry proof) — exact commands, dummy payloads, outputs and sandbox controls.
- `final-verification-status.json` — final independent verification decisions and replacements.

The standalone report uses the same content as this file and is named with the final date and auditor model: `SECURITY-AUDIT-2026-11-21-KIMI-K3.1-PRO.md`.
