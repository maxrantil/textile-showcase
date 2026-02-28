# Session Handoff: CRITICAL Performance Regression - Project Pages Timeout

**Date**: 2026-01-18
**Status**: 🚨 CRITICAL PRODUCTION ISSUE - Requires immediate debugging
**Current State**: VPS at commit 9338adc (testing old code), Next.js running on PORT 3001

---

## 🚨 CRITICAL ISSUE SUMMARY

**Problem**: Project pages experience progressive performance degradation leading to complete timeout.

**Pattern Observed:**
- ✅ **1st project page**: Loads successfully
- ⚠️ **2nd project page**: Slow (2-3 minutes)
- ❌ **3rd+ project pages**: Complete timeout (NS_ERROR_TIMING in browser)

**Key Finding**: This issue occurs on **BOTH** current code (796e891) AND old code (9338adc - before Issue #266 work), proving **Issue #266 crossOrigin fix is NOT the cause**.

---

## 📊 Current VPS State

**Git Status:**
```bash
HEAD detached at 9338adc
Commit: 9338adc test: Skip analytics tests while analytics is disabled (#265)
Date: 2026-01-02 (before crossOrigin work)
```

**Running Process:**
```bash
Next.js 15.5.7
PORT: 3001
Started: Direct npm start (not PM2)
Status: Running but experiencing progressive slowdown
```

**System Resources:**
```bash
Total Memory: 964Mi
Available Memory: 173Mi
Swap: 2.3Gi (262Mi used)
Next.js Memory: ~65mb (not memory exhaustion)
```

**PM2 Status:** Not currently running (testing with direct npm start)

---

## 🔍 Debugging Steps Completed

### 1. Issue #266 Resolution (COMPLETED ✅)
- PR #268 merged successfully
- crossOrigin attributes correctly applied to:
  - `<img>` elements ✅
  - `<link rel="preload">` elements ✅
  - Removed from `<source>` elements (HTML5 compliance) ✅
- TypeScript errors fixed ✅
- Production deployed ✅

### 2. Performance Regression Investigation (IN PROGRESS 🔄)

**Tests Performed:**

**A. PM2 Environment Testing**
- Multiple PM2 configurations tried (ecosystem.config.js, memory limits, node args)
- Result: Same issue persists
- Error logs: No crashes, just "sh: next: not found" (environment issue, resolved)
- Restart count: 0-1 (not crashing repeatedly)

**B. Direct npm start Testing**
- Bypassed PM2 completely
- Result: **Same progressive slowdown occurs**
- Conclusion: Not a PM2-specific issue

**C. Memory Analysis**
- Available memory: 173Mi (adequate)
- Next.js process: 65mb (reasonable)
- No memory exhaustion detected
- Conclusion: Not a memory issue

**D. Git Bisect (CRITICAL)**
- Reverted to commit 9338adc (before PR #267)
- Deleted node_modules, .next
- Fresh npm ci && npm run build
- Started with direct npm start
- Result: **SAME ISSUE PERSISTS**
- **CONCLUSION: Our Issue #266 code DID NOT cause this problem**

**E. Browser Diagnostics**
- Network tab: Shows NS_ERROR_TIMING on 3rd+ request
- Console: Font preload warnings (harmless)
- No specific requests shown as "pending" (connection dies)
- Pattern: First request works, subsequent requests progressively slower

**F. Server-Side Diagnostics**
- PM2 logs during failures: No output (request never reaches Next.js)
- Next.js starts successfully: "Ready in 807ms - 1896ms"
- No error logs during slowdown
- Process remains alive (not crashing)

---

## 💡 Leading Hypotheses

### Hypothesis 1: Next.js 15.5.7 SSR Bug ⭐ MOST LIKELY
**Evidence:**
- Issue persists across different commits
- Progressive degradation pattern (works once, fails after)
- SSR-specific (static assets load fine)
- Next.js 15.5.7 is recent version (might have regression)

**Next Steps:**
- Check Next.js 15.5.7 release notes for known SSR issues
- Test downgrading to Next.js 15.5.4 or 15.4.x
- Check if experimental features in next.config.ts are causing issues

### Hypothesis 2: Nginx/Reverse Proxy Timeout
**Evidence:**
- Browser shows connection timeout (NS_ERROR_TIMING)
- Request never reaches Next.js logs
- Could be nginx timing out connections

**Next Steps:**
- Check nginx configuration at /etc/nginx/sites-available/
- Verify proxy_timeout settings
- Check nginx error logs: /var/log/nginx/error.log

### Hypothesis 3: Sanity CMS API Rate Limiting
**Evidence:**
- Only affects project pages (which fetch from Sanity)
- Progressive degradation matches rate limit behavior
- One project ("Embracing Light...") loads fast, others slow

**Next Steps:**
- Check Sanity dashboard for rate limit warnings
- Monitor Sanity API response times during failures
- Test with cached/static data

### Hypothesis 4: Resource Leak in Next.js App Code
**Evidence:**
- Progressive degradation (not immediate)
- Works initially, degrades over time
- Affects all recent commits

**Next Steps:**
- Review app code for unclosed connections
- Check for memory leaks in components
- Profile Next.js with --inspect flag

---

## 🛠️ Recommended Debugging Approach for Next Session

### Phase 1: Eliminate External Factors (30 min)

**1. Check Nginx Configuration**
```bash
# On VPS
sudo nginx -t
sudo cat /etc/nginx/sites-available/idaromme.dk
sudo tail -100 /var/log/nginx/error.log
```

**2. Test Sanity API Directly**
```bash
# Check if Sanity API is slow from VPS
time curl -s "https://2y05n6hf.apicdn.sanity.io/v2021-10-21/data/query/production?query=*[_type==%22design%22]"
```

**3. Check for Next.js Known Issues**
- Search: "Next.js 15.5.7 SSR timeout"
- Check: https://github.com/vercel/next.js/issues?q=is%3Aissue+15.5.7+SSR

### Phase 2: Next.js Version Testing (45 min)

**1. Downgrade to Next.js 15.5.4**
```bash
cd /var/www/idaromme.dk
git checkout master
npm install next@15.5.4
npm run build
PORT=3001 npm start
# Test: Load 4-5 projects in a row
```

**2. If that works, downgrade to Next.js 15.4.x**
```bash
npm install next@15.4.3
npm run build
PORT=3001 npm start
```

### Phase 3: App Code Review (30 min)

**Files to investigate:**
```
src/app/project/[slug]/page.tsx - Project page SSR
src/lib/sanity/client.ts - Sanity client configuration
middleware.ts - Request middleware
```

**Look for:**
- Unclosed database/API connections
- Missing error boundaries
- Infinite loops in getStaticProps/generateMetadata
- Resource-intensive operations

### Phase 4: Enable Debug Logging (15 min)

**Start Next.js with debug flags:**
```bash
NODE_OPTIONS='--trace-warnings --trace-deprecation' PORT=3001 npm start
```

**Add logging to project page:**
```typescript
// In src/app/project/[slug]/page.tsx
export default async function Page({ params }) {
  console.log('[SSR START]', new Date(), params.slug)
  // ... existing code
  console.log('[SSR END]', new Date(), params.slug)
}
```

---

## 📋 VPS Quick Reference

**SSH Access:**
```bash
ssh max@idaromme.dk
cd /var/www/idaromme.dk
```

**Node.js Setup:**
```bash
source ~/.nvm/nvm.sh
nvm use 22
node --version  # Should show v22.16.0
```

**Useful Commands:**
```bash
# Check what's running on port 3001
netstat -tlnp | grep 3001

# Kill all Node processes
pkill -f next

# Check memory
free -h

# Monitor in real-time
htop  # (if installed)

# Check nginx
sudo systemctl status nginx
sudo nginx -t

# PM2 commands
pm2 list
pm2 logs idaromme-website --lines 50
pm2 delete idaromme-website
```

**Current Process:**
- Next.js running directly (not PM2)
- PORT 3001
- Press Ctrl+C to stop

---

## 📚 Key Files

**Configuration:**
- `next.config.ts` - Next.js config (experimental features enabled)
- `ecosystem.config.js` - PM2 config (if using PM2)
- `/etc/nginx/sites-available/idaromme.dk` - Nginx config

**App Code:**
- `src/app/project/[slug]/page.tsx` - Project page SSR
- `src/lib/sanity/client.ts` - Sanity API client
- `middleware.ts` - Request middleware

**Logs:**
- `/home/max/.pm2/logs/idaromme-website-*.log` - PM2 logs
- `/var/log/nginx/error.log` - Nginx errors
- `/var/log/nginx/access.log` - Nginx access

---

## 🎯 Success Criteria

**Issue resolved when:**
- ✅ Can load 10+ different project pages consecutively
- ✅ Each page loads in < 5 seconds
- ✅ No timeouts or NS_ERROR_TIMING errors
- ✅ Performance remains consistent over time
- ✅ Works with both PM2 and direct npm start

---

## 📝 Startup Prompt for Next Session

```
Read CLAUDE.md to understand our workflow, then debug critical production performance issue.

**CRITICAL**: Project pages experience progressive timeout (1st works, 2nd slow, 3rd+ timeout).

**Context**: Issue #266 (crossOrigin) is COMPLETE and NOT the cause. This is a separate issue that exists even on old commits (9338adc). Next.js 15.5.7 SSR appears to be hanging after 1-2 requests.

**Current VPS state**:
- Detached HEAD at 9338adc (testing old code)
- Next.js running directly on PORT 3001 (not PM2)
- Pattern: NS_ERROR_TIMING in browser, no logs in Next.js

**Immediate priorities**:
1. Check nginx timeout configuration
2. Test Next.js 15.5.4 (downgrade from 15.5.7)
3. Review Sanity API rate limiting
4. Enable debug logging in app code

**Reference**: SESSION_HANDOVER.md sections "Leading Hypotheses" and "Recommended Debugging Approach"

**Expected scope**: Identify root cause (Next.js bug, nginx config, or app code issue) and implement fix to restore normal performance.
```

---

**Session paused**: 2026-01-18T18:30:00Z
**Status**: Performance regression identified, NOT related to Issue #266, debugging in progress
**Next session owner**: Continue debugging with fresh perspective
