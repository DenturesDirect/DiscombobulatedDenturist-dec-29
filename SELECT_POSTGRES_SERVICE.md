# 🔍 Select Postgres Service

## You're at the Service Selection Screen!

You see:
```
? Select a service <esc to skip>
```

---

## Option 1: Select Postgres Service

1. **Use arrow keys (↑↓)** to move up and down
2. **Find "Postgres"** in the list
3. **Press Enter** to select it
4. **Then run the command:**
   ```powershell
   npx @railway/cli run --service Postgres psql $DATABASE_URL -f create_tables.sql
   ```

---

## Option 2: Skip Service Selection (Easier!)

1. **Press Esc** to skip service selection
2. **Then run the command:**
   ```powershell
   npx @railway/cli run --service Postgres psql $DATABASE_URL -f create_tables.sql
   ```

The `--service Postgres` part tells Railway which service to use, so you don't need to select it manually!

---

## Quick Fix

**Just press Esc to skip, then run:**

```powershell
npx @railway/cli run --service Postgres psql $DATABASE_URL -f create_tables.sql
```

---

**Press Esc first, then run the command!** 🚀
