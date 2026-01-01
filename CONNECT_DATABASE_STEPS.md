# 🔗 Connect Database - Follow These Steps

## I See the Connect Modal!

The modal shows you exactly what to do. Follow these steps:

---

## Step 1: Copy the Value

1. In the modal, you see: `${{ Postgres.DATABASE_URL }}`
2. **Click the copy icon** (📋) next to it
3. This copies the value to your clipboard

---

## Step 2: Switch to Web Service

1. **Close the modal** (click X or outside)
2. **Click on "web"** in the left sidebar (the one with GitHub icon)
3. This switches you to your web service

---

## Step 3: Add the Variable

1. In the **"web"** service, go to **"Variables"** tab
2. Click **"+ New Variable"** or **"Add Variable"**
3. Fill in:
   - **Key/Name:** `DATABASE_URL`
   - **Value:** `${{ Postgres.DATABASE_URL }}` (paste what you copied)
4. Click **"Add"** or **"Save"**

---

## Step 4: Verify

1. After adding, you should see `DATABASE_URL` in your Variables list
2. Railway will automatically redeploy
3. Wait for deployment to finish

---

## Step 5: Set Up Database Tables

1. Go to **"Deployments"** tab
2. Click on the **latest deployment**
3. Click **"Shell"** button (or terminal icon)
4. Type: `npm run db:push`
5. Press Enter
6. Wait for "✓ Push completed"

---

## ✅ Done!

After this:
- ✅ Database is connected
- ✅ Tables are created
- ✅ Data will save permanently!

---

## Quick Summary

1. **Copy** `${{ Postgres.DATABASE_URL }}` from the modal
2. **Switch** to "web" service (left sidebar)
3. **Add Variable:** `DATABASE_URL` = `${{ Postgres.DATABASE_URL }}`
4. **Run:** `npm run db:push` in Shell

**Follow the modal's instructions - it's showing you exactly what to do!**
