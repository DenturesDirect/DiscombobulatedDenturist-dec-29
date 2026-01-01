# Add text_notifications Column - All Methods

Since you can't find the SQL Editor, here are **3 ways** to add the column:

---

## Method 1: Railway Shell (Easiest)

1. **Go to Railway** → Your project → **Postgres** service
2. Click the **"Shell"** tab (terminal icon)
3. **Copy and paste this command:**
   ```bash
   psql $DATABASE_URL -c "ALTER TABLE patients ADD COLUMN IF NOT EXISTS text_notifications BOOLEAN DEFAULT false NOT NULL;"
   ```
4. **Press Enter**
5. **Done!** You should see `ALTER TABLE` as confirmation

---

## Method 2: Run Script Locally (If you have DATABASE_URL)

1. **Get your DATABASE_URL from Railway:**
   - Go to **Postgres** service → **Variables** tab
   - Copy the `DATABASE_URL` value (use the PUBLIC one, not internal)

2. **Open PowerShell** on your computer:
   ```powershell
   cd C:\Users\info\OneDrive\Desktop\Dental_Saas\DentureFlowPro
   ```

3. **Set the DATABASE_URL:**
   ```powershell
   $env:DATABASE_URL="paste-your-database-url-here"
   ```

4. **Run the script:**
   ```powershell
   node add-text-notifications.js
   ```

5. **Done!** You should see "✅ Column added successfully"

---

## Method 3: Railway CLI (If you have it installed)

1. **Open PowerShell:**
   ```powershell
   cd C:\Users\info\OneDrive\Desktop\Dental_Saas\DentureFlowPro
   ```

2. **Connect to Railway:**
   ```powershell
   npx @railway/cli link
   ```
   (Select your project when prompted)

3. **Run SQL command:**
   ```powershell
   npx @railway/cli run psql $DATABASE_URL -c "ALTER TABLE patients ADD COLUMN IF NOT EXISTS text_notifications BOOLEAN DEFAULT false NOT NULL;"
   ```

---

## Which Method Should You Use?

- **Method 1 (Shell)** is easiest if you can find the Shell tab
- **Method 2 (Local Script)** works if you can copy the DATABASE_URL
- **Method 3 (CLI)** works if you have Railway CLI set up

**Try Method 1 first!** The Shell tab should be visible in the Postgres service.

---

## Can't Find Shell Tab?

The Shell tab might be:
- Called "Terminal" instead of "Shell"
- In a dropdown menu
- At the top of the Postgres service page
- Next to "Variables", "Settings", etc.

Look for an icon that looks like a terminal/command prompt (usually `>_` or a black box).
