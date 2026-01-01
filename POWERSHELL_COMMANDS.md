# 💻 PowerShell Commands - Copy and Paste

## Important: Commands Need Spaces!

When you see `cd DentureFlowPro`, that means:
- Type: `cd` (then a **space**)
- Then type: `DentureFlowPro`

**NOT:** `cdDentureFlowPro` ❌ (no space - won't work!)

---

## Step-by-Step Commands

Copy and paste these **one at a time** into PowerShell:

### Step 1: Go to Your Project Folder

```powershell
cd C:\Users\info\OneDrive\Desktop\Dental_Saas\DentureFlowPro
```

Press Enter. You should see the path change to show `DentureFlowPro` at the end.

---

### Step 2: Login to Railway

```powershell
railway login
```

Press Enter. Your browser will open - click "Authorize".

---

### Step 3: Link to Railway Project

```powershell
railway link
```

Press Enter. Select your project from the list (use arrow keys, then Enter).

---

### Step 4: Create All Tables

```powershell
railway run --service Postgres psql $DATABASE_URL -f create_tables.sql
```

Press Enter. Wait for it to finish - you should see success messages!

---

## Quick Copy-Paste (All at Once)

If you want to see all commands:

```powershell
cd C:\Users\info\OneDrive\Desktop\Dental_Saas\DentureFlowPro
railway login
railway link
railway run --service Postgres psql $DATABASE_URL -f create_tables.sql
```

**But run them ONE AT A TIME** - wait for each to finish before running the next!

---

## Common Mistakes

❌ **Wrong:** `cdDentureFlowPro` (no space)
✅ **Right:** `cd DentureFlowPro` (with space)

❌ **Wrong:** Running all commands at once
✅ **Right:** Run one, wait, then run the next

---

## Start Here

**Copy this first command and paste it into PowerShell:**

```powershell
cd C:\Users\info\OneDrive\Desktop\Dental_Saas\DentureFlowPro
```

Press Enter, then tell me what you see! 😊
