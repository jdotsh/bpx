# Technical Debt Tracker

## 🔴 Priority 1: Production Critical

### 1. Email Service Configuration
**Status:** ⚠️ Using Supabase default email (rate-limited)
**Added:** 2025-08-19
**Impact:** Production email delivery

**Current State:**
- Using Supabase's built-in email service
- Rate limits: ~3-4 emails per hour (free tier)
- Not suitable for production applications
- Emails may be delayed or marked as spam

**Required Actions:**
1. **Short Term (Before Launch):**
   - Configure custom SMTP provider (SendGrid, Postmark, or Resend)
   - Update Supabase Auth settings with SMTP credentials
   - Test email deliverability and speed

2. **Configuration Needed:**
   ```env
   # Add to .env.production
   SMTP_HOST=smtp.sendgrid.net
   SMTP_PORT=587
   SMTP_USER=apikey
   SMTP_PASS=SG.xxxxxxxxxxxxxx
   SMTP_FROM=noreply@yourdomain.com
   ```

3. **Supabase Dashboard Settings:**
   - Go to Authentication > Settings > SMTP Settings
   - Enable "Custom SMTP"
   - Add SMTP credentials
   - Configure sender name and email

**Recommended Providers:**
- **SendGrid**: 100 emails/day free, good deliverability
- **Postmark**: 100 emails/month free, excellent transactional email
- **Resend**: 3000 emails/month free, developer-friendly
- **Amazon SES**: $0.10 per 1000 emails, requires domain verification

**Note:** This is acceptable for development and testing, but MUST be fixed before production launch.

---

## 🟡 Priority 2: Performance & Scalability

### 2. Database Connection Pooling
**Status:** Using pgbouncer with default settings
**Impact:** Connection limits under load

**Actions:**
- Monitor connection pool usage
- Optimize query patterns
- Consider connection pool sizing

### 3. Rate Limiting Implementation
**Status:** Basic rate limiting configured, no Redis
**Impact:** Rate limits not persistent across restarts

**Actions:**
- Set up Upstash Redis for production
- Implement distributed rate limiting
- Add rate limit headers to responses

---

## 🟢 Priority 3: Nice to Have

### 4. BPMN Export Formats
**Status:** Basic YAML/JSON export structure
**Impact:** Limited export options

**Actions:**
- Implement full YAML conversion
- Add JSON with proper schema
- Support SVG/PNG export

### 5. Collaborative Editing
**Status:** Single-user editing only
**Impact:** No real-time collaboration

**Actions:**
- Implement WebSocket support
- Add presence indicators
- Handle conflict resolution

---

## 📝 Notes

### Email Service Details (2025-08-19)
Supabase free tier email limitations:
- **Rate Limits:** 3-4 emails per hour
- **Daily Limits:** ~30 emails per day
- **Delivery:** Can be slow (1-5 minutes)
- **Spam Risk:** Higher without custom domain
- **No Templates:** Basic email templates only

**Why Custom SMTP is Critical:**
1. **Reliability:** Guaranteed delivery with proper SMTP
2. **Speed:** Instant email delivery
3. **Reputation:** Better inbox placement with custom domain
4. **Analytics:** Track opens, clicks, bounces
5. **Templates:** Rich HTML email templates
6. **Scale:** Handle thousands of emails per hour

**Implementation Priority:**
- Development: Current setup is fine
- Staging: Should have custom SMTP
- Production: MUST have custom SMTP

---

## 🔄 Review Schedule

- Weekly: Review Priority 1 items
- Monthly: Review all items
- Before Launch: All Priority 1 must be resolved

## 📊 Debt Metrics

| Priority | Items | Resolved | Remaining |
|----------|-------|----------|-----------|
| P1       | 1     | 0        | 1         |
| P2       | 2     | 0        | 2         |
| P3       | 2     | 0        | 2         |
| **Total**| **5** | **0**    | **5**     |

---

Last Updated: 2025-08-19