# Search Engine Registration Guide for idaromme.dk

This guide walks you through registering your site with Google Search Console and Bing Webmaster Tools. These are **one-time manual steps** that cannot be automated - they require logging into your Google/Microsoft accounts.

**Time Required**: ~30 minutes total
**Prerequisites**:
- Access to your domain's DNS settings (where you registered idaromme.dk)
- A Google account
- A Microsoft account (or create one free)

---

## Part 1: Google Search Console

### Step 1: Access Google Search Console
1. Go to: https://search.google.com/search-console
2. Sign in with your Google account
3. Click **"Add property"**

### Step 2: Add Your Domain
1. Choose **"Domain"** property type (recommended)
2. Enter: `idaromme.dk` (without https://)
3. Click **Continue**

### Step 3: Verify Ownership via DNS

Google will give you a TXT record to add. It looks like:
```
google-site-verification=XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

**To add this to your DNS:**

1. Log into your domain registrar (where you bought idaromme.dk)
2. Find DNS settings / DNS management
3. Add a new **TXT record**:
   - **Host/Name**: `@` or leave blank (for root domain)
   - **Type**: `TXT`
   - **Value**: The full `google-site-verification=...` string Google gave you
   - **TTL**: 3600 (or default)
4. Save the record
5. Wait 5-10 minutes for DNS propagation
6. Go back to Google Search Console and click **Verify**

### Step 4: Submit Your Sitemap
1. Once verified, you'll see your property dashboard
2. In the left sidebar, click **"Sitemaps"**
3. Enter: `sitemap.xml`
4. Click **Submit**

### Step 5: Request Indexing (Optional but Recommended)
1. In the left sidebar, click **"URL Inspection"**
2. Enter your homepage URL: `https://idaromme.dk`
3. Click **"Request Indexing"**
4. Repeat for key pages:
   - `https://idaromme.dk/about`
   - `https://idaromme.dk/contact`

### What to Expect
- Initial crawl: 1-3 days
- Full indexing: 1-2 weeks
- You'll receive email notifications about crawl status

---

## Part 2: Bing Webmaster Tools

### Step 1: Access Bing Webmaster Tools
1. Go to: https://www.bing.com/webmasters
2. Sign in with your Microsoft account (or create one)
3. Click **"Add a site"**

### Step 2: Import from Google (Easiest Method)
1. Choose **"Import from GSC"** (Google Search Console)
2. Sign in with the same Google account you used above
3. Select `idaromme.dk`
4. Click **Import**

This automatically:
- Verifies your site
- Imports your sitemap
- Syncs settings

### Alternative: Manual Setup
If you prefer not to connect accounts:

1. Enter your site URL: `https://idaromme.dk`
2. Add the sitemap: `https://idaromme.dk/sitemap.xml`
3. Verify via one of these methods:
   - **XML file**: Download and upload to your server's public folder
   - **Meta tag**: Add to your site's `<head>` (we can add this to the code)
   - **DNS**: Add a CNAME record (similar to Google)

### Step 3: Submit Sitemap (if not imported)
1. Go to **Sitemaps** in the left menu
2. Click **"Submit sitemap"**
3. Enter: `https://idaromme.dk/sitemap.xml`
4. Click **Submit**

### Why Bing Matters
- Bing powers **DuckDuckGo** search
- Bing powers **Yahoo** search
- Growing market share, especially in enterprise
- Often faster indexing than Google

---

## Part 3: Optional - IndexNow for Instant Indexing

IndexNow is a protocol for instant URL submission to Bing, Yandex, and other supporting search engines.

### How It Works
When you publish new content, you can ping the search engines immediately instead of waiting for them to crawl.

### Setup (We Can Add This to the Code Later)
1. Generate an API key (any random string works)
2. Create file: `public/{your-key}.txt` containing just the key
3. Ping: `https://api.indexnow.org/indexnow?url=https://idaromme.dk/project/new-project&key={your-key}`

This is optional and can be added in a future phase.

---

## Part 4: Verification Checklist

After completing the steps above, verify everything is working:

### Google Search Console
- [ ] Property verified (green checkmark)
- [ ] Sitemap submitted (status: "Success")
- [ ] No critical errors in Coverage report

### Bing Webmaster Tools
- [ ] Site verified
- [ ] Sitemap submitted
- [ ] No critical errors in Site Scan

### Live Site Checks
- [ ] Visit `https://idaromme.dk/sitemap.xml` - should show all pages with correct URLs
- [ ] Visit `https://idaromme.dk/robots.txt` - should allow crawling

---

## Troubleshooting

### "DNS verification failed"
- Wait 15-30 minutes and try again (DNS propagation)
- Verify the TXT record is exactly as provided (no extra spaces)
- Check with: `dig TXT idaromme.dk` or use https://dnschecker.org

### "Sitemap could not be read"
- Verify the sitemap URL works in browser
- Check for any server errors in the sitemap response
- The PR #254 fixes the sitemap bug - ensure it's deployed first

### "Crawl errors"
- Check the specific URLs that failed
- Most common: 404 errors for old/deleted pages
- Fix any broken internal links

---

## Timeline Expectations

| Milestone | Expected Time |
|-----------|---------------|
| DNS verification | 5-30 minutes |
| Sitemap processed | 1-24 hours |
| First pages indexed | 1-7 days |
| Full site indexed | 1-4 weeks |
| Appearing in search | 2-4 weeks |
| Ranking improvements | 1-3 months |

---

## Need Help?

If you get stuck on any step, let me know and I can:
1. Add meta tag verification to the code (alternative to DNS)
2. Help debug DNS configuration
3. Add IndexNow support for faster indexing

---

**Document Created**: 2025-12-07
**Related Issue**: #253
**Related PR**: #254
