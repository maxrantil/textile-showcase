# Upstream: cloudflare/security-audit-skill

- Source: https://github.com/cloudflare/security-audit-skill (`skills/security-audit/`)
- Commit: `c1c8a8c` ("Clarify guidance and full audit modes")
- License: MIT (Cloudflare, Inc.), copied as `LICENSE`
- Vendored: 2026-11-06, files unmodified except this note and `LICENSE`

Reviewed before vendoring: `SKILL.md`, `RECONNAISSANCE.md`, `HUNTING.md`,
`VALIDATION-AND-REPORTING.md` and `ATTACK-CLASSES.md` read in full; companion files and
`report-schema.json` scanned (documentation URLs only, no install/network/exfiltration
instructions); `validate-*.cjs` use only `fs`/`path`/`util` (no network or process
execution). Upstream's own test suites: 65/65 passing.

To update: re-clone at a newer commit, review the diff, copy `skills/security-audit/`
over this directory, and update the commit above.
