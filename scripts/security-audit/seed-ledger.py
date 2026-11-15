#!/usr/bin/env python3
# ABOUTME: Seeds coverage-ledger.json for the quick-profile textile-showcase run (parent-only writer).
# Units are surface x boundary x attack class with the fixed quick subsystem identity.
import json
import sys
import unicodedata
from urllib.parse import quote

OUT = sys.argv[1]
SUB = "profile/quick/all-in-scope-subsystems"
WEB, CLI, SUP, CLD, RES = (
    "WEB-PROTOCOL-AND-AUTH.md",
    "CLIENT-SIDE.md",
    "SUPPLY-CHAIN-AND-RELEASE.md",
    "CLOUD-AND-DEPLOYMENT.md",
    "RESOURCE-EXHAUSTION-AND-AVAILABILITY.md",
)


def enc(s):
    s = unicodedata.normalize("NFC", s)
    return quote(s.encode("utf-8"), safe="-._~")


def comp(f, *classes):
    return [f"{f}#{c}" for c in classes] + [f"{f}#Core discipline", f"{f}#Universal moves", f"{f}#Validation rules"]


# (surface, surface label, boundary, boundary label, attack ref, ordinary block|None, companions, excluded, paths, status, reason)
U = [
    ("src/app/api/contact/route.ts#POST", "POST /api/contact (anonymous visitor)",
     "src/app/api/contact/route.ts#escapeHtml", "Visitor input -> owner mailbox via Resend (escaping, Zod)",
     "ATTACK-CLASSES.md#Injection", "ATTACK-CLASSES.md#Injection", [],
     [(f"{WEB}#Response-header injection", "Resend SDK builds headers from JSON fields; no raw HTTP header assembly in source")],
     ["src/app/api/contact/route.ts", "tests/api/contact.test.ts"]),
    ("src/app/api/contact/route.ts#POST", "POST /api/contact (anonymous visitor)",
     "src/lib/clientIp.ts#getClientIp", "Per-IP and global rate limits keyed on forwarded IP",
     "ATTACK-CLASSES.md#Business logic", "ATTACK-CLASSES.md#Business logic",
     comp(RES, "Quota-accounting scope and reset gaps") + comp(WEB, "Host and forwarded-header trust"), [],
     ["src/app/api/contact/route.ts", "src/lib/clientIp.ts", "src/lib/rateLimit.ts", "ecosystem.config.js"]),
    ("src/app/api/csp-report/route.ts#POST", "POST /api/csp-report (anonymous browser reports)",
     "src/app/api/csp-report/route.ts#limits", "Size cap, report count cap, per-IP limit before logging",
     "ATTACK-CLASSES.md#Injection", "ATTACK-CLASSES.md#Injection", comp(RES, "Unbounded buffering and cardinality"), [],
     ["src/app/api/csp-report/route.ts", "src/lib/rateLimit.ts"]),
    ("src/app/api/projects/[slug]/route.ts#GET", "GET /api/projects/[slug] (anonymous)",
     "src/sanity/queries.ts#getProjectBySlug", "Public reader -> Sanity dataset (published perspective, token client)",
     "ATTACK-CLASSES.md#Access control", "ATTACK-CLASSES.md#Access control", [], [],
     ["src/app/api/projects/[slug]/route.ts", "src/sanity/queries.ts", "src/sanity/client.ts", "src/sanity/config.ts"]),
    ("src/app/api/projects/route.ts#GET", "GET /api/projects and /api/projects/slugs (anonymous)",
     "src/sanity/client.ts#perspective", "Published-only content exposure and caching headers",
     "ATTACK-CLASSES.md#Feature abuse and data leakage", "ATTACK-CLASSES.md#Feature abuse and data leakage",
     comp(WEB, "Cache deception and private-response caching"), [],
     ["src/app/api/projects/route.ts", "src/app/api/projects/slugs/route.ts", "src/sanity/client.ts", "src/sanity/dataFetcher.ts"]),
    ("src/app/project/[slug]/page.tsx#ProjectPage", "/project/[slug] SSR page and JSON-LD",
     "src/app/project/[slug]/page.tsx#JSON-LD", "CMS editor content and URL slug -> raw script element",
     "ATTACK-CLASSES.md#Chained vulnerabilities and trust boundaries",
     "ATTACK-CLASSES.md#Chained vulnerabilities and trust boundaries", comp(CLI, "DOM-based XSS"), [],
     ["src/app/project/[slug]/page.tsx", "src/app/project/[slug]/components/project-content.tsx",
      "src/app/project/[slug]/utils/project-helpers.ts", "src/app/page.tsx", "src/app/projects/page.tsx"]),
    ("src/app/api/indexnow/route.ts#POST", "POST/GET /api/indexnow (bearer secret)",
     "src/app/api/indexnow/route.ts#bearer", "Shared-secret bearer gate before outbound IndexNow fetch",
     "ATTACK-CLASSES.md#Cryptography and secrets", "ATTACK-CLASSES.md#Cryptography and secrets",
     comp(RES, "Pre-authentication work imbalance"), [],
     ["src/app/api/indexnow/route.ts", "public/indexnow-idaromme.txt"]),
    ("src/pages/api/health.js#GET", "GET /api/health (anonymous)",
     "src/pages/api/health.js#handler", "Unauthenticated health check using server token",
     "ATTACK-CLASSES.md#Feature abuse and data leakage", "ATTACK-CLASSES.md#Feature abuse and data leakage", [], [],
     ["src/pages/api/health.js", "tests/api/health.test.ts"]),
    ("src/proxy.ts#security-routes", "/security* and /api/security* gate",
     "src/proxy.ts#VALID_AUTH_TOKEN", "Static token and role gate (SECURITY_ENABLED)",
     "ATTACK-CLASSES.md#Access control", "ATTACK-CLASSES.md#Access control",
     comp(WEB, "API-key exposure and unsafe transport"), [],
     ["src/proxy.ts", ".github/workflows/production-deploy.yml"]),
    ("src/proxy.ts#proxy", "Edge proxy for all page responses",
     "src/proxy.ts#security-headers", "CSP nonce, HSTS, frame and referrer headers",
     "ATTACK-CLASSES.md#Obvious things", "ATTACK-CLASSES.md#Obvious things",
     comp(WEB, "Host and forwarded-header trust") + comp(CLI, "Clickjacking"), [],
     ["src/proxy.ts", "next.config.ts", "src/app/layout.tsx"]),
    ("public/sw.js#handlers", "Service worker fetch/message handlers",
     "public/sw.js#registration", "Registration state and same-origin cache filter",
     f"{CLI}#Service-worker cache and identity confusion", None,
     comp(CLI, "Service-worker cache and identity confusion", "Service-worker registration and scope takeover"),
     [], ["public/sw.js", "src"]),
    ("next.config.ts#images", "/_next/image optimizer",
     "next.config.ts#images.remotePatterns", "Remote image allowlist and SVG policy",
     "ATTACK-CLASSES.md#Resource and file handling", "ATTACK-CLASSES.md#Resource and file handling",
     comp(RES, "Decompression and representation amplification"), [],
     ["next.config.ts", "src/utils/image-helpers.ts"]),
    (".github/workflows#pull_request", "GitHub Actions on pull_request/push/issues",
     ".github/workflows#permissions", "Workflow token permissions and untrusted event data",
     f"{SUP}#Untrusted code in a privileged workflow", None,
     comp(SUP, "Untrusted code in a privileged workflow", "Workflow command and expression confusion", "Automation identity overreach"),
     [], [".github/workflows"]),
    (".github/workflows/production-deploy.yml#deploy", "Production deploy to VPS",
     ".github/workflows/production-deploy.yml#ssh", "SSH host verification, secrets and promoted artifact",
     f"{SUP}#Build-to-promotion substitution", None,
     comp(SUP, "Build-to-promotion substitution") + comp(CLD, "Secret exposure across workload boundaries"),
     [], [".github/workflows/production-deploy.yml", "ecosystem.config.js"]),
    ("package-lock.json#dependencies", "Resolved npm dependency tree",
     "package.json#pins", "Dependency pins, lockfile integrity and CI install",
     f"{SUP}#Mutable and unbound build inputs", None,
     comp(SUP, "Mutable and unbound build inputs", "Dependency source and namespace confusion"), [],
     ["package.json", "package-lock.json", ".github/workflows"]),
    ("src/sanity/dataFetcher.ts#cache", "Server-side CMS query cache",
     "src/sanity/dataFetcher.ts#eviction", "Cache keying and eviction under attacker-chosen params",
     f"{RES}#Unbounded buffering and cardinality", None,
     comp(RES, "Unbounded buffering and cardinality", "Database and downstream query amplification"), [],
     ["src/sanity/dataFetcher.ts", "src/app/project/[slug]/page.tsx", "src/lib/rateLimit.ts"]),
]

DEFERRED = [
    ("deployment/vps#nginx-and-firewall", "VPS nginx, firewall and PM2 host", "deployment/vps#network-exposure",
     "Whether port 3001 is reachable only through nginx; X-Forwarded-For overwrite", f"{CLD}#Unexpected service or management-plane reachability",
     "not_source_visible: nginx/firewall config is not in the repository; needs deployment access"),
    ("sanity/project#dataset-and-cors", "Sanity project settings (hosted)", "sanity/project#token-role-and-cors",
     "Token role, dataset visibility, CORS origins, Studio members", "ATTACK-CLASSES.md#Access control",
     "not_source_visible: Sanity project configuration is held by the provider; live provider calls are prohibited"),
    ("github/repository#settings", "GitHub repository settings", "github/repository#branch-protection-and-secrets",
     "Branch protection, required reviews, environment secrets", f"{SUP}#Release authorization and signing-policy gaps",
     "not_source_visible: repository settings are not in source; reusable workflows live in maxrantil/.github"),
]

DPATHS = {"deployment/vps#nginx-and-firewall": ["ecosystem.config.js", ".github/workflows/production-deploy.yml", "src/lib/clientIp.ts"],
          "sanity/project#dataset-and-cors": ["src/sanity/config.ts", "src/sanity/client.ts", "sanity.config.ts"],
          "github/repository#settings": [".github/workflows"]}
units = []
for (s, sl, b, bl, a, ordb, compb, excl, paths) in U:
    refs = {"surface": s, "boundary": b, "subsystem": SUB, "attack_class": a}
    units.append({
        "coverage_id": "::".join(enc(refs[k]) for k in ("surface", "boundary", "subsystem", "attack_class")),
        "canonical_refs": refs, "surface": sl, "boundary": bl, "subsystem": "All in-scope subsystems (quick profile)",
        "attack_class": a.split("#", 1)[1], "starting_paths": paths, "ordinary_attack_class_block": ordb,
        "selected_companion_blocks": sorted(set(compb)),
        "excluded_blocks": [{"block": x, "reason": r} for x, r in excl],
        "prior_status": "none", "attempts": [], "wave": 1, "status": "planned", "agent_id": None,
        "reviewed_paths": [], "local_checks": [], "result_fingerprints": [], "unresolved": [],
    })
for (s, sl, b, bl, a, reason) in DEFERRED:
    refs = {"surface": s, "boundary": b, "subsystem": SUB, "attack_class": a}
    units.append({
        "coverage_id": "::".join(enc(refs[k]) for k in ("surface", "boundary", "subsystem", "attack_class")),
        "canonical_refs": refs, "surface": sl, "boundary": bl, "subsystem": "All in-scope subsystems (quick profile)",
        "attack_class": a.split("#", 1)[1], "starting_paths": DPATHS[s], "ordinary_attack_class_block": a if a.startswith("ATTACK") else None,
        "selected_companion_blocks": [] if a.startswith("ATTACK") else [a],
        "excluded_blocks": [], "prior_status": "none", "attempts": [], "wave": 1, "status": "deferred",
        "agent_id": None, "reviewed_paths": [], "local_checks": [], "result_fingerprints": [], "unresolved": [reason],
    })
units.sort(key=lambda u: u["coverage_id"])
json.dump(units, open(OUT, "w"), indent=2, ensure_ascii=False)
print(len(units), "units")
