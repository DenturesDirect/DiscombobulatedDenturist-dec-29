# 🔗 How to Connect PostgreSQL to Your App on Railway

## Quick Steps (2 minutes)

### Step 1: Find Your PostgreSQL Service
1. In Railway, you should see **two services** in your project:
   - Your **Web Service** (your app)
   - **PostgreSQL** (your database)

### Step 2: Connect Them
1. Click on your **Web Service** (NOT the PostgreSQL one)
2. Go to the **"Settings"** tab
3. Scroll down to the **"Service Connect"** section
4. You'll see your **PostgreSQL** service listed
5. Click the **"Connect"** button next to PostgreSQL

### Step 3: Verify Connection
1. Railway automatically sets `DATABASE_URL` for you
2. Go to your **Web Service** → **"Variables"** tab
3. You should see `DATABASE_URL` listed (Railway added it automatically!)
4. It will look like: `postgresql://postgres:password@host:port/database`

### Step 4: Redeploy (if needed)
- Railway usually redeploys automatically when you connect
- If not, you can manually trigger a redeploy

---

## ✅ That's It!

Once connected:
- ✅ `DATABASE_URL` is automatically set
- ✅ Your app can now connect to the database
- ✅ No manual configuration needed!

---

## 🆘 Troubleshooting

**Can't find "Service Connect"?**
- Make sure you clicked on the **Web Service** (not PostgreSQL)
- Go to **Settings** tab (not Variables or Deployments)
- Scroll down - it's near the bottom

**DATABASE_URL not showing?**
- Wait a few seconds after clicking "Connect"
- Refresh the Variables page
- Check that both services are in the same Railway project

**Connection not working?**
- Make sure PostgreSQL service is running (green status)
- Check Railway logs for connection errors
- Verify `DATABASE_URL` is set in Variables

---

## 📝 Next Step

After connecting, run:
```bash
npm run db:push
```

In Railway's shell to set up your database tables!
