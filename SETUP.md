# DentureFlowPro Setup Guide

## Overview
This guide will help you set up DentureFlowPro with Google Vertex AI (HIPAA-compliant) and Supabase.

## Prerequisites
- Node.js 18+ installed
- npm or yarn package manager
- Google Cloud account (for Vertex AI)
- Supabase account (free tier available)

## Step 1: Install Dependencies

```bash
cd DentureFlowPro
npm install
```

## Step 2: Set Up Google AI Studio (Gemini API)

**Much simpler!** No Google Cloud setup needed - just get an API key.

1. **Go to Google AI Studio**
   - Visit https://aistudio.google.com/
   - Sign in with your Google account

2. **Get Your API Key**
   - Click "Get API Key" in the left sidebar
   - Click "Create API Key" 
   - Choose "Create API key in new project" (or select existing project)
   - Copy the API key that appears
   - **Important:** Save this key somewhere safe - you'll need it for the `.env` file

3. **Set Environment Variable**
   - `GOOGLE_AI_API_KEY`: Your API key from Google AI Studio

## Step 3: Set Up Supabase Database

1. **Create a Supabase Project**
   - Go to https://supabase.com/
   - Sign up/login and create a new project
   - Wait for the project to finish provisioning

2. **Get Your Database Connection String**
   - Go to Project Settings > Database
   - Under "Connection string", select "URI"
   - Copy the connection string (it looks like: `postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres`)
   - Replace `[YOUR-PASSWORD]` with your actual database password

3. **Set Environment Variable**
   - `DATABASE_URL`: Your Supabase PostgreSQL connection string

## Step 4: Configure Environment Variables

Create a `.env` file in the `DentureFlowPro` directory:

```env
# Database (Supabase)
DATABASE_URL=postgresql://postgres:your_password@db.your_project_ref.supabase.co:5432/postgres

# Google AI Studio (Gemini API) - Much simpler!
# Get your API key from: https://aistudio.google.com/
GOOGLE_AI_API_KEY=your-api-key-here

# Session Secret (generate with: openssl rand -base64 32)
SESSION_SECRET=your-random-session-secret-here

# Storage (use Supabase PostgreSQL, not in-memory)
USE_MEM_STORAGE=0
```

## Step 5: Set Up Database Schema

Run the database migrations to create all tables:

```bash
npm run db:push
```

This will create all the necessary tables in your Supabase database.

## Step 6: Seed Initial Data (Optional)

If you want to populate the database with sample staff accounts:

```bash
npm run dev
```

The server will automatically seed staff accounts on first run.

## Step 7: Run the Application

Start the development server:

```bash
npm run dev
```

The application will be available at:
- Frontend: http://localhost:5173 (or the port Vite assigns)
- Backend API: http://localhost:5000 (or the port Express assigns)

## Default Staff Accounts

The following accounts are created automatically:
- **damien@denturesdirect.ca** (admin) - Password: `TempPassword123!`
- **michael@denturesdirect.ca** (staff) - Password: `TempPassword123!`
- **luisa@denturesdirect.ca** (staff) - Password: `TempPassword123!`
- **info@denturesdirect.ca** (Caroline, staff) - Password: `TempPassword123!`

**⚠️ IMPORTANT:** Change these passwords immediately after first login!

## Troubleshooting

### Google AI API Errors
- Make sure your `GOOGLE_AI_API_KEY` is correct
- Verify you copied the full API key from https://aistudio.google.com/
- Check that your API key hasn't expired or been revoked

### Database Connection Errors
- Verify your `DATABASE_URL` is correct
- Check that your Supabase project is active
- Ensure you've replaced `[YOUR-PASSWORD]` with the actual password

### Tasks Not Showing Up
- Check that tasks are being created with the correct `assignee` field
- Use the "Refresh" button on the Staff To-Do page
- Verify the database connection is working

## Production Deployment

For production:
1. Set `NODE_ENV=production`
2. Use strong, randomly generated `SESSION_SECRET`
3. Ensure all environment variables are set securely
4. Run `npm run build` to build the application
5. Use a process manager like PM2 to run the server

## Support

If you encounter issues, check:
- Server logs for error messages
- Browser console for frontend errors
- Database connection status in Supabase dashboard
- Google Cloud Console for API quota/errors

