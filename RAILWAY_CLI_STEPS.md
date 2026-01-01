# 🚀 Railway CLI - Step by Step Guide

## Step 1: Install Railway CLI

Open PowerShell and run:
```powershell
npm install -g @railway/cli
```

Wait for it to finish installing.

---

## Step 2: Login to Railway

Run:
```powershell
railway login
```

This will:
- Open your browser
- Ask you to authorize Railway CLI
- Click "Authorize" in the browser
- Return to PowerShell when done

---

## Step 3: Navigate to Your Project

```powershell
cd DentureFlowPro
```

---

## Step 4: Link to Your Railway Project

```powershell
railway link
```

This will:
- Show you a list of your Railway projects
- Select your project (probably "protective-ambition" or similar)
- Press Enter to confirm

---

## Step 5: Run the SQL File

Now run the SQL to create all tables:

```powershell
railway run --service Postgres psql $DATABASE_URL -f create_tables.sql
```

**OR** if that doesn't work, try:

```powershell
railway run psql $DATABASE_URL < create_tables.sql
```

**OR** if Railway CLI doesn't support file input, we'll paste the SQL directly (I'll help with that if needed).

---

## Step 6: Verify Tables Were Created

After running, you should see success messages. To verify:

```powershell
railway run --service Postgres psql $DATABASE_URL -c "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;"
```

You should see all 11 tables listed!

---

## Troubleshooting

**If `railway` command not found:**
- Make sure npm install finished successfully
- Try closing and reopening PowerShell
- Or use: `npx @railway/cli` instead of `railway`

**If login fails:**
- Make sure you're logged into Railway in your browser first
- Try: `railway login --browserless` (will show a token to paste)

**If link fails:**
- Make sure you're in the `DentureFlowPro` directory
- Check that you have a Railway project created

---

## Quick Reference

```powershell
# 1. Install
npm install -g @railway/cli

# 2. Login
railway login

# 3. Go to project
cd DentureFlowPro

# 4. Link
railway link

# 5. Run SQL
railway run --service Postgres psql $DATABASE_URL -f create_tables.sql
```

Let's start with Step 1!
