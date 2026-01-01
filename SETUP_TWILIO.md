# 📱 Setup Twilio for Text Notifications

## Step 1: Create Twilio Account

1. **Go to Twilio**: https://www.twilio.com/
2. **Sign up** for a free account (includes $15.50 credit for testing)
3. **Verify your phone number** (for testing)

## Step 2: Get Your Twilio Credentials

1. **Go to Twilio Console**: https://console.twilio.com/
2. **Find your Account SID and Auth Token**:
   - Account SID: On the dashboard homepage
   - Auth Token: Click "Show" next to Auth Token (keep this secret!)

## Step 3: Get a Phone Number

1. **Go to Phone Numbers** → **Manage** → **Buy a number**
2. **Select a number** (US/Canada numbers work best)
3. **Buy it** (free trial includes one number)

## Step 4: Add to Railway Variables

Go to Railway → web service → Variables tab, add:

- **Name**: `TWILIO_ACCOUNT_SID`
  - **Value**: Your Account SID (starts with `AC...`)

- **Name**: `TWILIO_AUTH_TOKEN`
  - **Value**: Your Auth Token (keep secret!)

- **Name**: `TWILIO_PHONE_NUMBER`
  - **Value**: Your Twilio phone number (format: `+1234567890`)

## Step 5: Redeploy

Railway will auto-redeploy, or click "Redeploy"

---

**After setup, text notifications will automatically send when events occur!**
