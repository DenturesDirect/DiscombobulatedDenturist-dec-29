# Database URL Types Explained

Railway has **two types** of database URLs:

## 1. Private URL (`DATABASE_URL`)
- **Format:** `postgresql://...@postgres.railway.internal:5432/railway`
- **Use for:** Railway services connecting to each other (web → Postgres)
- **Cost:** ✅ **No egress fees** (internal network)
- **Access:** Only works from within Railway's network

## 2. Public URL (`DATABASE_PUBLIC_URL`)
- **Format:** `postgresql://...@something.railway.app:5432/railway`
- **Use for:** External connections (your local computer, scripts, etc.)
- **Cost:** ⚠️ **Egress fees apply** (data leaving Railway)
- **Access:** Works from anywhere on the internet

---

## Which One Should You Use?

### ✅ For Railway Services (web service connecting to Postgres):
- Use `DATABASE_URL` (private)
- Already set automatically by Railway
- No egress fees

### ✅ For Local Scripts (running on your computer):
- Use `DATABASE_PUBLIC_URL` (public)
- You need this to run `add-text-notifications.js` from your computer
- Small egress fee for the one-time column addition (negligible)

### ✅ For Railway Shell:
- Use `DATABASE_URL` (private)
- Shell runs inside Railway's network
- No egress fees

---

## The Warning You Saw

Railway warns you about `DATABASE_PUBLIC_URL` because:
- It uses a public endpoint (accessible from internet)
- This incurs egress fees (data transfer costs)
- For one-time scripts, the cost is tiny (pennies)

**For your app's normal operation**, Railway automatically uses the private `DATABASE_URL`, so you won't pay egress fees for regular database queries.

---

## Quick Reference

| Scenario | Use This URL | Where to Find It |
|----------|-------------|------------------|
| Railway web service → Postgres | `DATABASE_URL` | Auto-set by Railway |
| Local script on your computer | `DATABASE_PUBLIC_URL` | Postgres → Variables |
| Railway Shell command | `DATABASE_URL` | Auto-available as `$DATABASE_URL` |

---

**Bottom line:** For adding the column from your local computer, use `DATABASE_PUBLIC_URL`. The warning is just informational - the cost is negligible for a one-time operation.
