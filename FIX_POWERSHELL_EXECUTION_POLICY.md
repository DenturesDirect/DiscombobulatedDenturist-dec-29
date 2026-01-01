# 🔧 Fix PowerShell Execution Policy Error

## The Problem

Windows is blocking Railway CLI from running because of security settings.

## Quick Fix: Use npx Instead

Instead of using `railway` directly, use `npx` which doesn't require changing security settings:

```powershell
npx @railway/cli login
```

This works the same way but doesn't need permission changes!

---

## Alternative: Fix Execution Policy (If You Want)

If you want to use `railway` directly, you need to allow scripts to run:

### Option 1: Allow for Current Session Only (Safest)

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope Process
```

Then try `railway login` again.

### Option 2: Allow for Current User (Permanent)

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

---

## Recommended: Use npx (Easiest!)

Just use `npx` - it works without changing any settings:

```powershell
npx @railway/cli login
npx @railway/cli link
npx @railway/cli run --service Postgres psql $DATABASE_URL -f create_tables.sql
```

---

## Quick Commands with npx

```powershell
# 1. Login
npx @railway/cli login

# 2. Link
npx @railway/cli link

# 3. Create tables
npx @railway/cli run --service Postgres psql $DATABASE_URL -f create_tables.sql
```

---

**Try the npx method first - it's the easiest!** 😊
