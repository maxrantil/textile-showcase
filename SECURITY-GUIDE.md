# 🔐 Security Dashboard & API - How-To Guide

## Quick Start

### 1. 📊 **Accessing the Security Dashboard**

**URL:** `http://localhost:3000/security`

**What you'll see:**

- Real-time security metrics
- Recent security events
- Threat analysis
- System health status

**Features:**

- ✅ Auto-refreshes every 30 seconds
- ✅ Export data (CSV, JSON, PDF)
- ✅ Filter by time range (24h, 7d, 30d)
- ✅ Filter by severity (Critical, High, Medium, Low)

---

## 2. 🔑 **Setting Up GPG Credentials (Optional)**

**For full functionality**, set these environment variables:

```bash
# Add to .env.local
GPG_KEY_ID="YOUR_GPG_KEY_ID"
CREDENTIAL_PATH="./credentials/encrypted.gpg"
AUDIT_SIGNING_KEY="your-secret-signing-key-here"
```

**Without GPG setup:** Dashboard works in **demo mode** with mock data.

---

## 3. 📡 **Using the API Endpoints**

### **Security Dashboard Data**

```bash
# Get comprehensive dashboard data
curl http://localhost:3000/api/security/dashboard-data

# Response includes:
# - metrics, recentAlerts, threatAnalysis, systemHealth, statistics
```

### **Audit Logs**

```bash
# Get recent security events
curl "http://localhost:3000/api/security/audit-logs?type=events&hours=24&limit=10"

# Get security alerts
curl "http://localhost:3000/api/security/audit-logs?type=alerts"

# Get threat patterns
curl "http://localhost:3000/api/security/audit-logs?type=threats"

# Log custom security event
curl -X POST http://localhost:3000/api/security/audit-logs \
  -H "Content-Type: application/json" \
  -d '{"event":"CUSTOM_EVENT","severity":"MEDIUM","details":"Custom security event"}'
```

### **Credential Management**

```bash
# Test encryption/decryption (PUT)
curl -X PUT http://localhost:3000/api/security/credentials

# Store encrypted credentials (POST)
curl -X POST http://localhost:3000/api/security/credentials \
  -H "Content-Type: application/json" \
  -d '{"apiKey":"your_api_key","environment":"development","rotationSchedule":"monthly"}'

# Retrieve encrypted credentials (GET)
curl http://localhost:3000/api/security/credentials
```

---

## 4. 🎛️ **Dashboard Controls**

### **Time Range Selection**

- **24 Hours:** Recent activity (default)
- **7 Days:** Weekly security overview
- **30 Days:** Monthly security trends

### **Severity Filtering**

- **All:** Show all security events
- **Critical:** Only critical threats
- **High:** High and critical events
- **Medium:** Medium and above
- **Low:** All events including low severity

### **Data Export Options**

1. **CSV:** Spreadsheet format for analysis
2. **JSON:** Raw data for developers
3. **PDF Report:** Formatted security report

---

## 5. 📈 **Understanding the Data**

### **Security Metrics Panel**

- **Total Events:** All security events in time range
- **Threats Detected:** Events marked as suspicious
- **Success Rate:** Percentage of successful operations
- **Top Threats:** Most frequent security issues

### **Recent Events List**

- **Timestamp:** When the event occurred
- **Action:** Type of security event
- **Status:** Success/failure indicator
- **Details:** Description of what happened
- **Request ID:** Unique identifier for tracking

### **System Status Indicators**

- 🟢 **HEALTHY:** All systems operational
- 🟡 **WARNING:** Minor issues detected
- 🔴 **CRITICAL:** Immediate attention required

---

## 6. 🚨 **Common Security Events**

### **Normal Events**

```json
{
  "action": "ACCESS_CREDENTIALS",
  "success": true,
  "error": "Retrieved 2 credentials"
}
```

### **Warning Events**

```json
{
  "action": "CREDENTIAL_ERROR",
  "success": false,
  "error": "Missing GPG_KEY_ID configuration"
}
```

### **Critical Events**

```json
{
  "action": "SECURITY_CRITICAL",
  "success": false,
  "error": "Unauthorized access attempt detected"
}
```

---

## 7. 🔧 **Setup & Configuration**

### **Basic Setup (No GPG)**

1. Start the development server: `npm run dev`
2. Visit: `http://localhost:3000/security`
3. ✅ Dashboard works with demo data immediately

### **Full Setup (With GPG)**

1. **Generate GPG key:**

   ```bash
   gpg --gen-key
   gpg --list-keys  # Copy your key ID
   ```

2. **Set environment variables:**

   ```bash
   echo "GPG_KEY_ID=YOUR_KEY_ID_HERE" >> .env.local
   echo "CREDENTIAL_PATH=./credentials/encrypted.gpg" >> .env.local
   echo "AUDIT_SIGNING_KEY=$(openssl rand -hex 32)" >> .env.local
   ```

3. **Create credentials directory:**

   ```bash
   mkdir -p credentials
   ```

4. **Restart the server:**
   ```bash
   npm run dev
   ```

---

## 8. 📊 **Example API Responses**

### **Dashboard Data Response**

```json
{
  "success": true,
  "data": {
    "overview": {
      "systemStatus": "HEALTHY",
      "totalEvents": 93,
      "activeAlerts": 5,
      "threatLevel": "MEDIUM"
    },
    "metrics": {
      "totalEvents": 93,
      "threatCount": 12,
      "successRate": 0.89,
      "topThreats": [
        { "type": "BRUTE_FORCE_ATTEMPT", "count": 8, "severity": "HIGH" }
      ]
    }
  }
}
```

### **Security Event Response**

```json
{
  "success": true,
  "events": [
    {
      "timestamp": "2025-09-14T09:31:51.284Z",
      "action": "ACCESS_CREDENTIALS",
      "success": true,
      "requestId": "req-12345",
      "verified": true
    }
  ]
}
```

---

## 9. 🛠️ **Troubleshooting**

### **Dashboard Not Loading**

- ✅ Check server is running: `npm run dev`
- ✅ Verify URL: `http://localhost:3000/security`
- ✅ Check browser console for errors

### **"Missing GPG_KEY_ID" Error**

- ℹ️ **Normal** - Dashboard works without GPG setup
- 🔧 **To fix:** Add GPG_KEY_ID to .env.local

### **API Returning 500 Errors**

- ✅ Check server logs in terminal
- ✅ Verify JSON formatting in POST requests
- ✅ Ensure Content-Type header is set

### **No Recent Events Showing**

- ℹ️ **Normal** - Fresh installation has no events
- 🔧 **To generate events:** Make API calls to trigger logging

---

## 10. 💡 **Pro Tips**

### **For Developers**

- Use **JSON export** to analyze security patterns
- Monitor **Request IDs** for debugging specific events
- Check **System Health** before deployments

### **For Security Teams**

- Set up **automated monitoring** with the API endpoints
- Export **daily reports** in PDF format
- Watch **threat patterns** for unusual activity

### **For System Administrators**

- Configure **GPG encryption** for production environments
- Set up **log rotation** policies
- Monitor **disk space** for audit logs

---

## 🚀 **Next Steps**

1. **Explore the Dashboard:** Visit `/security` and try different filters
2. **Test API Endpoints:** Use curl or Postman to interact with APIs
3. **Set Up GPG:** For production-ready encrypted credential storage
4. **Customize Alerts:** Modify audit logger for your specific needs
5. **Integrate Monitoring:** Connect to your existing security tools

---

**🔒 Your security infrastructure is ready to use!** Start with the dashboard and explore the API endpoints to integrate with your workflows.
