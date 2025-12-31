# Deployment Guide

## Quick Deploy Options

### Option 1: Railway (Recommended - Easiest)

1. **Sign up at Railway**
   - Go to https://railway.app/
   - Sign up with GitHub (free tier available)

2. **Deploy from GitHub**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your repository
   - Railway will auto-detect and deploy

3. **Add PostgreSQL Database**
   - In your Railway project, click "+ New"
   - Select "Database" → "Add PostgreSQL"
   - Railway will create a PostgreSQL database automatically

4. **Set Environment Variables**
   - Go to your service → Variables tab
   - Add these variables:
     ```
     DATABASE_URL=<Railway will auto-set this from the PostgreSQL service>
     SESSION_SECRET=<Generate a random secret: openssl rand -base64 32>
     NODE_ENV=production
     GOOGLE_AI_API_KEY=<Your API key from https://aistudio.google.com/>
     PORT=5000
     ```

5. **Set up Database Schema**
   - Go to your service → Settings → Deploy Logs
   - Click "Open Shell" or use Railway CLI
   - Run: `npm run db:push`

6. **Your app will be live!**
   - Railway provides a URL like: `https://your-app.up.railway.app`

---

### Option 2: Render (Free Tier Available)

1. **Sign up at Render**
   - Go to https://render.com/
   - Sign up with GitHub

2. **Create Web Service**
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Settings:
     - Build Command: `npm install && npm run build`
     - Start Command: `npm start`
     - Environment: `Node`

3. **Add PostgreSQL Database**
   - Click "New +" → "PostgreSQL"
   - Create a new database
   - Copy the "Internal Database URL"

4. **Set Environment Variables**
   - In your Web Service → Environment
   - Add:
     ```
     DATABASE_URL=<PostgreSQL Internal Database URL>
     SESSION_SECRET=<Random secret>
     NODE_ENV=production
     GOOGLE_AI_API_KEY=<Your API key>
     PORT=5000
     ```

5. **Set up Database Schema**
   - Use Render Shell or local terminal with DATABASE_URL set
   - Run: `npm run db:push`

---

### Option 3: Fly.io

1. **Install Fly CLI**: `npm install -g @fly/cli`
2. **Sign up**: `fly auth signup`
3. **Launch**: `fly launch` (in project directory)
4. **Add PostgreSQL**: `fly postgres create`
5. **Attach database**: `fly postgres attach <db-name> -a <app-name>`
6. **Deploy**: `fly deploy`

---

## Environment Variables Needed

Make sure to set these in your deployment platform:

- `DATABASE_URL` - PostgreSQL connection string (auto-set by Railway/Render)
- `SESSION_SECRET` - Random secret for sessions (generate with: `openssl rand -base64 32`)
- `NODE_ENV` - Set to `production`
- `GOOGLE_AI_API_KEY` - Your Google AI Studio API key (optional, for AI features)
- `PORT` - Usually auto-set by platform, but defaults to 5000

## After Deployment

1. **Set up database schema**: Run `npm run db:push` (with DATABASE_URL set)
2. **Seed initial data**: The app will auto-seed staff accounts on first run
3. **Access your app**: Use the URL provided by your hosting platform

## Default Staff Accounts (Created Automatically)

- **damien@denturesdirect.ca** (admin) - Password: `TempPassword123!`
- **michael@denturesdirect.ca** (staff) - Password: `TempPassword123!`
- **luisa@denturesdirect.ca** (staff) - Password: `TempPassword123!`
- **info@denturesdirect.ca** (Caroline, staff) - Password: `TempPassword123!`

⚠️ **IMPORTANT**: Change these passwords immediately after first login!




