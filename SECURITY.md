# Security Policy

## Supported Versions

We actively maintain and provide security updates for the following versions:

| Version | Supported          |
| ------- | ------------------ |
| Latest  | :white_check_mark: |
| < Latest| :x:                |

This is an actively developed portfolio site. We recommend using the latest version from the `master` branch for the most up-to-date security patches.

---

## Reporting a Vulnerability

We take security vulnerabilities seriously. If you discover a security issue in this repository, please report it responsibly.

### How to Report

1. **Do NOT** create a public GitHub issue for security vulnerabilities
2. Report via GitHub Security Advisories: https://github.com/maxrantil/textile-showcase/security/advisories/new
3. Include the following information:
   - Description of the vulnerability
   - Steps to reproduce the issue
   - Potential impact
   - Suggested fix (if you have one)

### Response Timeline

- **Initial Response**: Within 48 hours
- **Status Update**: Within 7 days
- **Resolution**: Depends on severity and complexity

### What to Expect

1. We will acknowledge receipt of your vulnerability report
2. We will investigate and assess the severity
3. We will work on a fix and coordinate disclosure
4. We will credit you in the security advisory (unless you prefer anonymity)

---

## Security Best Practices

This repository follows security best practices including:

- **Credential Management**: All API keys and secrets stored in GitHub Secrets
- **Pre-commit Hooks**: Automated checks prevent credential commits
- **Dependency Updates**: Regular updates to address known vulnerabilities
- **Input Validation**: Sanitization of user inputs (contact forms, etc.)
- **Rate Limiting**: API endpoint protection against abuse
- **CSP Headers**: Content Security Policy headers configured
- **HTTPS Only**: All production traffic served over HTTPS

### For Developers

If you're contributing to this project:

1. Never commit credentials or API keys
2. Use `.env.local` for local development (gitignored)
3. Follow the security guidelines in `docs/guides/SECURITY-GUIDE.md`
4. Run pre-commit hooks before pushing code
5. Keep dependencies up to date

---

## Security Documentation

For detailed security implementation and deployment guidelines:

- **Security Guide**: [`docs/guides/SECURITY-GUIDE.md`](docs/guides/SECURITY-GUIDE.md)
- **Deployment Security**: [`docs/guides/SECURITY-DEPLOYMENT-GUIDE.md`](docs/guides/SECURITY-DEPLOYMENT-GUIDE.md)
- **Contributing Guidelines**: [`CONTRIBUTING.md`](CONTRIBUTING.md)

---

## Known Security Measures

### Authentication & Authorization
- Sanity API tokens with minimal read-only permissions
- Rate limiting on contact form submissions
- CORS configuration for API endpoints

### Data Protection
- Environment variables for sensitive data
- No hardcoded credentials in source code
- Secure transmission of form data via HTTPS

### Infrastructure Security
- Cloudflare CDN with DDoS protection
- Automated vulnerability scanning via GitHub
- Regular security updates for dependencies

### Content Security Policy (CSP)

**Implementation:** Nonce-based strict CSP for scripts, permissive CSP for styles
**Location:** `middleware.ts:203-230`
**Security Risk Score:** 7.5/10 (Good - Industry Standard)

#### CSP Directives

**script-src (STRICT - XSS Protection):**
- Nonce-based strict CSP prevents all inline script execution without nonce
- Blocks XSS attacks (CRITICAL threat - CVSS 8.8-9.0)
- Industry best practice for Next.js App Router
- Configuration: `'self' 'nonce-${nonce}' 'strict-dynamic'`

**style-src (PERMISSIVE - Framework Compatibility):**
- Allows inline styles for Next.js framework compatibility
- CSS injection risk is LOW-MEDIUM (CVSS 5.3-6.1)
- Acceptable trade-off because:
  - No user-generated content (admin-curated portfolio only)
  - No sensitive data in HTML attributes
  - No authentication or transactional flows
- Configuration: `'self' 'unsafe-inline' https://fonts.googleapis.com`

**Other Directives:**
- `default-src 'self'` - Restrict all other resources to same-origin
- `img-src` - Allow images from Sanity CDN and analytics
- `font-src` - Allow fonts from Google Fonts CDN
- `connect-src` - Allow API connections to Sanity and analytics
- `object-src 'none'` - Block plugins (Flash, Java, etc.)
- `frame-ancestors 'none'` - Prevent clickjacking

#### Security Trade-off Rationale

This CSP approach follows **OWASP CSP guidelines** and **2025 Next.js best practices**: prioritize critical threats (XSS via script injection) with strict controls, accept low-risk trade-offs (CSS visual manipulation) for framework compatibility.

**Why permissive style-src is acceptable:**
1. ✅ **No user-generated content** - Admin-curated portfolio eliminates injection attack surface
2. ✅ **No sensitive data exposure** - No CSRF tokens, session IDs, or credentials in HTML
3. ✅ **Framework requirements** - Next.js critical CSS optimization requires inline styles
4. ✅ **CSP specification** - Nonces cannot be applied to @font-face rules
5. ✅ **Compensating controls** - Strict script-src prevents JavaScript execution (primary threat)

**Decision Record:** Full security analysis and alternative evaluation documented in [`docs/guides/SECURITY-CSP-DECISION-2025-11-19.md`](docs/guides/SECURITY-CSP-DECISION-2025-11-19.md)

#### CSP Monitoring

- CSP violations logged via `CSP_REPORT_URI` environment variable (if configured)
- Framework-generated violations are expected and allowed by policy
- Unexpected violations may indicate potential attacks or framework changes

#### Security Review Schedule

- **Annual Review:** 2026-11-19 (1 year from decision date)
- **Immediate Review Triggers:**
  - User-generated content added (comments, forums)
  - Authentication system implemented
  - Payment processing or sensitive data collection
  - Regulatory compliance requirements (PCI-DSS, HIPAA, SOC2)

**References:**
- [OWASP CSP Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Content_Security_Policy_Cheat_Sheet.html)
- [Next.js CSP Guide](https://nextjs.org/docs/pages/guides/content-security-policy)
- Security Decision Record: `docs/guides/SECURITY-CSP-DECISION-2025-11-19.md`

---

## Vulnerability Disclosure Policy

We follow the principle of **coordinated disclosure**:

1. Researcher reports vulnerability privately
2. We work together to understand and fix the issue
3. We release a patch
4. We publicly disclose the vulnerability (with researcher credit)

We request a **90-day** disclosure timeline to allow adequate time for investigation, fix development, testing, and deployment.

---

## Security Hall of Fame

We appreciate responsible disclosure. Security researchers who report valid vulnerabilities will be acknowledged here (with their permission):

- *Currently none - be the first!*

---

## Contact

For security-related questions or concerns:
- **GitHub Security Advisories**: https://github.com/maxrantil/textile-showcase/security/advisories/new

Thank you for helping keep this project secure!
