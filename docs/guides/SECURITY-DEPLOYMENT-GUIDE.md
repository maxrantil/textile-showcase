# 🔒 Security Dashboard - Production Deployment Guide

## 🚨 CRITICAL: Never Deploy GPG Keys to Web Servers

**❌ NEVER DO THIS:**

- Upload GPG private keys to web hosting platforms
- Put real credentials in `.env.local` on public servers
- Expose the `/security` endpoint publicly without authentication

## ✅ PRODUCTION-READY DEPLOYMENT OPTIONS

### **Option 1: Internal/Local Network Only (Recommended)**

**Best for:** Internal company monitoring, local network security

```bash
# Deploy on internal server/VPS only
# Restrict access via IP whitelist
# Only accessible from your office/VPN network
```

**Setup:**

1. Deploy on internal server (not public web host)
2. Configure firewall to only allow your IP addresses
3. Use VPN to access from remote locations
4. Keep GPG keys and credentials on secure internal server

### **Option 2: Authentication-Protected Public Deployment**

**Best for:** Remote access with proper authentication

```typescript
// Add to src/middleware.ts
export function middleware(request: NextRequest) {
  // Protect /security routes
  if (request.nextUrl.pathname.startsWith('/security')) {
    const token = request.headers.get('authorization')

    if (!isValidSecurityToken(token)) {
      return NextResponse.redirect('/login')
    }
  }
}
```

### **Option 3: Environment-Based Configuration (Hybrid)**

**Best for:** Mixed environments (public site + private security)\*\*

```bash
# .env.production (on secure server only)
SECURITY_ENABLED=true
GPG_KEY_ID=your-key-here
CREDENTIAL_PATH=/secure/path/encrypted.gpg

# .env.vercel (public hosting - demo mode)
SECURITY_ENABLED=false
# No GPG keys - shows demo data only
```

**Code modification:**

```typescript
// In SecurityDashboard component
const isDemoMode = !process.env.SECURITY_ENABLED

if (isDemoMode) {
  // Show demo data only
  return <DemoSecurityDashboard />
} else {
  // Show real security data (internal deployment only)
  return <RealSecurityDashboard />
}
```

### **Option 4: Separate Security Service (Enterprise)**

**Best for:** Large organizations with dedicated security infrastructure

```yaml
# docker-compose.yml
services:
  public-website:
    image: textile-showcase
    environment:
      - SECURITY_DASHBOARD=false
    ports:
      - '3000:3000'

  security-dashboard:
    image: textile-showcase-security
    environment:
      - SECURITY_DASHBOARD=true
      - GPG_KEY_ID=${SECURE_GPG_KEY}
    ports:
      - '3001:3000' # Internal port only
    networks:
      - internal-security
```

## 🎯 RECOMMENDED APPROACH FOR YOU

Given your setup, I recommend **Option 1 + Option 3 Hybrid**:

### **For Your Current Website (Public):**

```bash
# Deploy without GPG keys - demo mode only
SECURITY_ENABLED=false
```

### **For Internal Security Monitoring:**

```bash
# Deploy on separate internal server/VPS
SECURITY_ENABLED=true
GPG_KEY_ID=F56A39322E4C0B344629481D75E79ABA2214B9BC
CREDENTIAL_PATH=/secure/credentials/encrypted.gpg
AUDIT_SIGNING_KEY=your-secure-key
```

## 🔧 IMPLEMENTATION STEPS

### Step 1: Modify Component for Demo Mode

```typescript
// In SecurityDashboard/index.tsx
const isDemoMode = process.env.SECURITY_ENABLED !== 'true'

if (isDemoMode) {
  // Use static demo data
  const demoData = {
    totalEvents: 150,
    threatCount: 3,
    successRate: 0.94,
    // ... demo values
  }
  // Skip API calls, show demo data
}
```

### Step 2: Add Environment Detection

```typescript
// In dashboard-data API route
export async function GET() {
  if (process.env.SECURITY_ENABLED !== 'true') {
    return NextResponse.json({
      success: true,
      data: getDemoSecurityData(),
      demo: true,
    })
  }

  // Real security logic only if enabled
  return getRealSecurityData()
}
```

### Step 3: Deploy Configuration

```bash
# Public hosting (Vercel/Netlify)
SECURITY_ENABLED=false

# Internal server only
SECURITY_ENABLED=true
GPG_KEY_ID=your-key
# ... other secure configs
```

## 🛡️ SECURITY BENEFITS

1. **Public Site:** Shows impressive demo of security dashboard capabilities
2. **Internal Use:** Real security monitoring on secure infrastructure
3. **No Risk:** GPG keys never exposed publicly
4. **Flexible:** Can switch modes based on environment

## 🎭 DEMO MODE FEATURES

- Static impressive metrics that showcase capabilities
- Realistic-looking security events (fake data)
- All dashboard features work (export, filtering, etc.)
- Perfect for showcasing to potential clients
- Zero security risk

Would you like me to implement the demo mode detection so you can safely deploy the public version without any real credentials?
