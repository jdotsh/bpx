# **OPERATIONAL RUNBOOK**
## **BPMN Studio Web - Production Operations Guide**

---

## **🚨 INCIDENT RESPONSE**

### **Critical Incident Checklist**
1. [ ] Identify incident severity (P1-P4)
2. [ ] Create incident channel in Slack
3. [ ] Assign incident commander
4. [ ] Begin incident timeline documentation
5. [ ] Notify stakeholders based on severity
6. [ ] Execute relevant runbook procedure
7. [ ] Post-mortem after resolution

### **Severity Levels**
- **P1 (Critical)**: Complete service outage
- **P2 (High)**: Major feature unavailable
- **P3 (Medium)**: Performance degradation
- **P4 (Low)**: Minor issues, cosmetic bugs

---

## **📊 MONITORING & ALERTS**

### **Key Metrics to Monitor**

```yaml
Application Metrics:
  - Response Time: < 200ms (p95)
  - Error Rate: < 0.1%
  - Uptime: > 99.9%
  
Infrastructure Metrics:
  - CPU Usage: < 70%
  - Memory Usage: < 80%
  - Disk Usage: < 85%
  
Database Metrics:
  - Connection Pool: < 80% utilized
  - Query Time: < 100ms (p95)
  - Deadlocks: 0
```

### **Alert Configuration**

```javascript
// Sentry alerts
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: 'production',
  beforeSend(event, hint) {
    if (event.level === 'error') {
      // Send to PagerDuty for P1/P2
      notifyPagerDuty(event)
    }
    return event
  }
})
```

---

## **🔥 COMMON ISSUES & SOLUTIONS**

### **1. High Memory Usage**

**Symptoms:**
- Memory usage > 90%
- Slow response times
- Pod restarts

**Diagnosis:**
```bash
# Check memory usage
kubectl top pods -n production

# Check for memory leaks
npm run profile:memory

# Review heap dump
node --inspect-brk app.js
```

**Resolution:**
```bash
# Immediate: Restart affected pods
kubectl rollout restart deployment/bpmn-studio -n production

# Long-term: Scale horizontally
kubectl scale deployment/bpmn-studio --replicas=5 -n production
```

### **2. Database Connection Issues**

**Symptoms:**
- "Too many connections" errors
- Slow queries
- Timeouts

**Diagnosis:**
```sql
-- Check active connections
SELECT count(*) FROM pg_stat_activity;

-- Find slow queries
SELECT query, mean_exec_time 
FROM pg_stat_statements 
WHERE mean_exec_time > 100
ORDER BY mean_exec_time DESC;

-- Check for locks
SELECT * FROM pg_locks WHERE granted = false;
```

**Resolution:**
```bash
# Reset connection pool
npm run db:reset-pool

# Kill long-running queries
SELECT pg_terminate_backend(pid) 
FROM pg_stat_activity 
WHERE query_start < now() - interval '5 minutes';
```

### **3. API Rate Limiting Issues**

**Symptoms:**
- 429 errors
- Users reporting "Too many requests"

**Diagnosis:**
```bash
# Check Redis rate limit keys
redis-cli --scan --pattern "rate:*"

# Monitor current rates
redis-cli MONITOR | grep rate
```

**Resolution:**
```bash
# Clear rate limits for specific user
redis-cli DEL "rate:user:123"

# Temporarily increase limits
redis-cli SET "rate:limit:global" 100
```

### **4. BPMN Canvas Not Loading**

**Symptoms:**
- Blank canvas
- JavaScript errors
- "Failed to initialize" messages

**Diagnosis:**
```javascript
// Check browser console
console.log(window.__BPMN_ERROR__)

// Verify bundle loading
fetch('/static/js/bpmn.bundle.js')
  .then(r => console.log('Bundle status:', r.status))
```

**Resolution:**
```bash
# Clear CDN cache
curl -X PURGE https://cdn.bpmn-studio.com/static/js/bpmn.bundle.js

# Rebuild and redeploy
npm run build
npm run deploy
```

---

## **🚀 DEPLOYMENT PROCEDURES**

### **Production Deployment Checklist**

```bash
# Pre-deployment
□ Run tests: npm test
□ Check TypeScript: npm run type-check
□ Build locally: npm run build
□ Review changes: git diff main
□ Update changelog

# Deployment
□ Tag release: git tag v2.0.1
□ Push to main: git push origin main --tags
□ Monitor CI/CD pipeline
□ Verify deployment: curl https://api.bpmn-studio.com/health

# Post-deployment
□ Run smoke tests
□ Monitor error rates (30 mins)
□ Update status page
□ Notify team
```

### **Rollback Procedure**

```bash
# Immediate rollback (< 5 mins)
kubectl rollout undo deployment/bpmn-studio -n production

# Version-specific rollback
kubectl rollout undo deployment/bpmn-studio --to-revision=42 -n production

# Database rollback
npm run db:migrate:rollback --version=20240101
```

---

## **🔧 MAINTENANCE TASKS**

### **Daily Tasks**
```bash
# Check application health
curl https://api.bpmn-studio.com/health

# Review error logs
npm run logs:errors --since="24h ago"

# Check disk usage
df -h | grep -E "postgres|uploads"
```

### **Weekly Tasks**
```bash
# Database maintenance
npm run db:vacuum
npm run db:analyze

# Clear old sessions
npm run sessions:cleanup --older-than=7d

# Update dependencies
npm audit
npm update --dry-run
```

### **Monthly Tasks**
```bash
# Full backup
npm run backup:full

# Performance analysis
npm run performance:report

# Security audit
npm audit fix
npm run security:scan

# Clean up old logs
find /var/log/bpmn-studio -mtime +30 -delete
```

---

## **💾 BACKUP & RESTORE**

### **Backup Procedures**

```bash
# Database backup
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql

# File storage backup
aws s3 sync /uploads s3://bpmn-studio-backups/uploads/$(date +%Y%m%d)/

# Redis backup
redis-cli BGSAVE
cp /var/lib/redis/dump.rdb backups/redis_$(date +%Y%m%d).rdb
```

### **Restore Procedures**

```bash
# Database restore
psql $DATABASE_URL < backup_20240101.sql

# File storage restore
aws s3 sync s3://bpmn-studio-backups/uploads/20240101/ /uploads

# Redis restore
systemctl stop redis
cp backups/redis_20240101.rdb /var/lib/redis/dump.rdb
systemctl start redis
```

---

## **🔐 SECURITY PROCEDURES**

### **Security Incident Response**

1. **Contain**: Isolate affected systems
2. **Assess**: Determine scope and impact
3. **Eradicate**: Remove threat
4. **Recover**: Restore normal operations
5. **Document**: Create incident report

### **Regular Security Tasks**

```bash
# Check for vulnerabilities
npm audit
snyk test

# Review access logs
grep "401\|403" /var/log/nginx/access.log | tail -100

# Check for suspicious activity
fail2ban-client status

# Rotate secrets
npm run secrets:rotate
```

---

## **📞 ESCALATION MATRIX**

| Issue Type | L1 Support | L2 Engineering | L3 Management |
|------------|------------|----------------|---------------|
| Service Down | Immediate | 5 mins | 15 mins |
| Data Loss | Immediate | Immediate | Immediate |
| Security Breach | Immediate | Immediate | Immediate |
| Performance | 15 mins | 30 mins | 2 hours |
| Feature Bug | 1 hour | 4 hours | Next day |

### **Contact List**

```yaml
On-Call Engineer: 
  Primary: +1-xxx-xxx-xxxx
  Secondary: +1-xxx-xxx-xxxx
  
DevOps Team:
  Slack: #devops-oncall
  Email: devops@bpmn-studio.com
  
Management:
  CTO: cto@bpmn-studio.com
  VP Eng: vp-eng@bpmn-studio.com
```

---

## **📈 PERFORMANCE TUNING**

### **Application Optimization**

```javascript
// Enable production mode
NODE_ENV=production

// Optimize Next.js
module.exports = {
  compress: true,
  poweredByHeader: false,
  generateEtags: true,
}

// Database connection pooling
const pool = new Pool({
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
})
```

### **Database Optimization**

```sql
-- Update statistics
ANALYZE;

-- Rebuild indexes
REINDEX DATABASE bpmn_studio;

-- Configure autovacuum
ALTER TABLE diagrams SET (autovacuum_vacuum_scale_factor = 0.1);
```

---

## **🔄 DISASTER RECOVERY**

### **RTO/RPO Targets**
- **RTO (Recovery Time Objective)**: 2 hours
- **RPO (Recovery Point Objective)**: 1 hour

### **DR Procedures**

```bash
# Failover to DR region
./scripts/dr-failover.sh --region=us-west-2

# Verify DR environment
./scripts/dr-verify.sh

# Failback to primary
./scripts/dr-failback.sh --validate
```

---

## **📝 DOCUMENTATION**

### **Required Documentation Updates**

- [ ] Incident reports (within 24 hours)
- [ ] Architecture changes (before deployment)
- [ ] API changes (with version bump)
- [ ] Security patches (immediately)
- [ ] Performance improvements (weekly summary)

### **Log Locations**

```bash
Application Logs: /var/log/bpmn-studio/app.log
Error Logs: /var/log/bpmn-studio/error.log
Access Logs: /var/log/nginx/access.log
Database Logs: /var/log/postgresql/postgresql.log
Audit Logs: /var/log/bpmn-studio/audit.log
```

---

## **✅ HEALTH CHECKS**

### **Automated Health Checks**

```javascript
// Health check endpoint
app.get('/health', async (req, res) => {
  const checks = {
    app: 'ok',
    database: await checkDatabase(),
    redis: await checkRedis(),
    storage: await checkStorage(),
  }
  
  const status = Object.values(checks).every(s => s === 'ok') ? 200 : 503
  res.status(status).json(checks)
})
```

### **Manual Health Verification**

```bash
# Full system health check
./scripts/health-check.sh --verbose

# Component-specific checks
npm run health:database
npm run health:redis
npm run health:storage
```

---

**Last Updated**: 2024-01-20
**Version**: 2.0.0
**Maintained By**: DevOps Team