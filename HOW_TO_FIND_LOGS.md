# 📋 How to Find Railway Logs - Step by Step

## Step-by-Step Instructions

### Step 1: Open Your Railway Project
1. Go to https://railway.app/
2. Click on the project that has the **Web Service** (the crashed one)

### Step 2: Open the Web Service
1. You should see a service called **"Web Service"** or your app name
2. **Click on it** (not the PostgreSQL one)

### Step 3: Go to Deployments
1. Look at the top tabs: **"Metrics"**, **"Deployments"**, **"Variables"**, **"Settings"**
2. Click on **"Deployments"** tab

### Step 4: Open Latest Deployment
1. You'll see a list of deployments (most recent at top)
2. Click on the **top one** (the latest/crashed one)
3. It might say "Failed" or have a red X

### Step 5: View Logs
1. You'll see deployment details
2. Look for a button that says:
   - **"View Logs"** or
   - **"Logs"** or
   - **"View Build Logs"** or
   - Just click anywhere on the deployment card
3. Click it!

### Step 6: Find the Error
1. Logs will open (might take a second to load)
2. **Scroll all the way to the bottom**
3. The error is usually at the very end
4. Look for lines that say:
   - `Error:`
   - `Failed:`
   - `Cannot`
   - `Missing`
   - Red text

### Step 7: Copy the Error
1. **Select the last 20-30 lines** of the logs
2. Copy them (Ctrl+C)
3. Paste them here!

---

## Alternative: If You Can't Find "View Logs"

### Option A: Check the Deployment Card
- Sometimes the logs are shown directly on the deployment card
- Look for error messages right there

### Option B: Check Build Logs
- Some projects show "Build Logs" separately
- Click on "Build Logs" if you see it

### Option C: Check Service Logs
- Go back to the Web Service
- Look for a **"Logs"** tab (might be next to Deployments)
- Click it to see real-time logs

---

## Visual Guide

```
Railway Dashboard
  └── Your Project
      └── Web Service (click this)
          └── Deployments tab (click this)
              └── Latest deployment (click this)
                  └── View Logs button (click this)
                      └── Scroll to bottom
                          └── Copy error message
```

---

## What the Error Will Look Like

The error will be something like:
```
Error: SESSION_SECRET must be set
```
or
```
Failed to connect to database
```
or
```
Cannot find module 'something'
```

**Just copy the last 20-30 lines and paste them here!**
