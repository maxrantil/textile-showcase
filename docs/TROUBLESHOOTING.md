# Troubleshooting Guide

Common issues and solutions for the Textile Showcase portfolio.

## Development Issues

### Build Fails with "Module not found"

**Symptom**: `npm run build` fails with module resolution errors.

**Solutions**:
1. Clear node_modules and reinstall:
   ```bash
   rm -rf node_modules .next
   npm install
   ```
2. Clear npm cache:
   ```bash
   npm cache clean --force
   npm install
   ```

### TypeScript Errors After Updates

**Symptom**: Type errors appear after pulling changes or updating dependencies.

**Solutions**:
1. Restart TypeScript server in your editor
2. Run type check to see all errors:
   ```bash
   npm run type-check
   ```
3. Clear the Next.js cache:
   ```bash
   rm -rf .next
   npm run dev
   ```

### Pre-commit Hooks Fail

**Symptom**: Commits are rejected by pre-commit hooks.

**Solutions**:
1. Run linting manually to see errors:
   ```bash
   npm run lint
   ```
2. Auto-fix formatting issues:
   ```bash
   npx prettier --write .
   ```
3. Reinstall hooks if corrupted:
   ```bash
   pre-commit install --force
   ```

**Note**: Never bypass hooks with `--no-verify`.

## Sanity CMS Issues

### "Unable to fetch projects" Error

**Symptom**: Projects page shows error or is empty.

**Causes & Solutions**:

1. **Missing environment variables**
   ```bash
   # Check .env.local has these:
   NEXT_PUBLIC_SANITY_PROJECT_ID=your_project_id
   NEXT_PUBLIC_SANITY_DATASET=production
   ```

2. **Invalid API token**
   - Log into [sanity.io/manage](https://sanity.io/manage)
   - Check project settings > API > Tokens
   - Generate new token if needed

3. **CORS issues**
   - In Sanity dashboard, go to Settings > API > CORS Origins
   - Add `http://localhost:3000` for development
   - Add your production domain

### Sanity Studio Not Loading

**Symptom**: `/studio` route shows blank page or errors.

**Solutions**:
1. Check browser console for specific errors
2. Verify Sanity environment variables are set
3. Clear browser cache and try incognito mode
4. Rebuild the project:
   ```bash
   rm -rf .next
   npm run build
   npm run dev
   ```

## Contact Form Issues

### "Contact form is temporarily unavailable"

**Symptom**: Form shows 503 error.

**Cause**: Resend API key not configured.

**Solution**:
```bash
# Add to .env.local:
RESEND_API_KEY=re_your_api_key_here
CONTACT_EMAIL=recipient@example.com
```

### "Too many requests" Error

**Symptom**: Form shows 429 rate limit error.

**Cause**: More than 5 requests in 60 seconds from same IP.

**Solution**: Wait 60 seconds and try again. Rate limits are per-IP and reset automatically.

### Emails Not Arriving

**Causes & Solutions**:

1. **Check spam folder** - Automated emails often go to spam
2. **Verify CONTACT_EMAIL** - Ensure correct recipient email
3. **Check Resend dashboard** - Log into [resend.com](https://resend.com) to see email status
4. **Domain verification** - Ensure `contact@idaromme.dk` domain is verified in Resend

## Performance Issues

### Slow Page Load

**Symptom**: Pages take >3 seconds to load.

**Solutions**:
1. Check image sizes - Large images slow everything down
2. Run Lighthouse audit:
   ```bash
   npm run build
   npx lighthouse http://localhost:3000
   ```
3. Check network tab for slow requests
4. Verify Sanity CDN is being used for images

### High Memory Usage During Build

**Symptom**: Build fails with "JavaScript heap out of memory".

**Solution**: The build is already configured with increased heap size (1536MB). If still failing:
```bash
NODE_OPTIONS="--max-old-space-size=2048" npm run build
```

## E2E Test Issues

### Tests Fail with "Connection Refused"

**Symptom**: Playwright tests can't connect to localhost.

**Solutions**:
1. Check if dev server is running:
   ```bash
   npm run dev
   ```
2. Or let Playwright auto-start it (configured in `playwright.config.ts`)
3. Check nothing else is using port 3000:
   ```bash
   lsof -i :3000
   ```

### Safari Tests Timeout

**Symptom**: Safari E2E tests take 40+ minutes and timeout.

**Context**: This is a known issue (Issue #209). Safari/WebKit is inherently slower (~8x Chrome).

**Solution**:
- CI runs Safari Smoke tests only (minimal subset)
- Run full Safari suite locally if needed:
  ```bash
  npx playwright test --project="Desktop Safari"
  ```

### Tests Fail Intermittently

**Symptom**: Tests pass locally but fail in CI, or vice versa.

**Solutions**:
1. Add explicit waits for dynamic content:
   ```typescript
   await page.waitForSelector('[data-testid="gallery-item"]')
   ```
2. Increase timeout for slow operations
3. Check for race conditions in test setup

## Production Issues

### 502 Bad Gateway

**Symptom**: Site shows 502 error on VPS.

**Solutions**:
1. Check if PM2 process is running:
   ```bash
   pm2 status
   ```
2. Restart the application:
   ```bash
   pm2 restart textile-showcase
   ```
3. Check PM2 logs:
   ```bash
   pm2 logs textile-showcase --lines 100
   ```
4. Verify nginx is running:
   ```bash
   sudo systemctl status nginx
   ```

### SSL Certificate Issues

**Symptom**: Browser shows "connection not secure" warning.

**Solutions**:
1. Check certificate expiry:
   ```bash
   echo | openssl s_client -connect idaromme.dk:443 2>/dev/null | openssl x509 -noout -dates
   ```
2. Renew with Certbot:
   ```bash
   sudo certbot renew
   ```

### Changes Not Appearing After Deploy

**Symptom**: Deployed changes don't show on site.

**Solutions**:
1. Clear CDN/browser cache
2. Verify deployment completed successfully
3. Restart PM2 process:
   ```bash
   pm2 restart textile-showcase
   ```
4. Check for build errors in deploy logs

## Getting More Help

If your issue isn't covered here:

1. Check existing [GitHub Issues](https://github.com/maxrantil/textile-showcase/issues)
2. Search the codebase for related error messages
3. Check component tests for expected behavior
4. Open a new GitHub issue with:
   - Clear description of the problem
   - Steps to reproduce
   - Expected vs actual behavior
   - Environment details (Node version, OS, browser)
