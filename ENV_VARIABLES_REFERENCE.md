# Environment Variables Reference

## Overview

This document explains all environment variables used in the Smart Waste Flow application and how to configure them for different environments.

---

## Firebase Configuration Variables

### VITE_FIREBASE_API_KEY

**Value:** `AIzaSyDBJHUAPRocDreTW6m6e3bkpkNy8WwKhe0`
**Purpose:** Unique identifier for your Firebase project (public key)
**Where to find:** Firebase Console → Project Settings → Web App Configuration
**Required:** ✅ Yes
**Scope:** All environments (Development, Staging, Production)

### VITE_FIREBASE_AUTH_DOMAIN

**Value:** `smart-green-e8080.firebaseapp.com`
**Purpose:** Auth domain for Firebase Authentication
**Where to find:** Firebase Console → Project Settings → Web App Configuration
**Required:** ✅ Yes
**Scope:** All environments

### VITE_FIREBASE_PROJECT_ID

**Value:** `smart-green-e8080`
**Purpose:** Unique identifier for your Firebase project
**Where to find:** Firebase Console → Project Settings
**Required:** ✅ Yes
**Scope:** All environments

### VITE_FIREBASE_STORAGE_BUCKET

**Value:** `smart-green-e8080.firebasestorage.app`
**Purpose:** Cloud Storage bucket for image uploads
**Where to find:** Firebase Console → Storage → Bucket Name
**Required:** ✅ Yes
**Scope:** All environments

### VITE_FIREBASE_MESSAGING_SENDER_ID

**Value:** `1090844924733`
**Purpose:** For Firebase Cloud Messaging (notifications)
**Where to find:** Firebase Console → Project Settings → Web App Configuration
**Required:** ✅ Yes (even if messaging not used yet)
**Scope:** All environments

### VITE_FIREBASE_APP_ID

**Value:** `1:1090844924733:web:0861ed57d19114f1488354`
**Purpose:** Unique identifier for your web app in Firebase
**Where to find:** Firebase Console → Project Settings → Web App Configuration
**Required:** ✅ Yes
**Scope:** All environments

### VITE_FIREBASE_MEASUREMENT_ID

**Value:** `G-FB14Z9SCNE`
**Purpose:** Google Analytics Measurement ID
**Where to find:** Firebase Console → Project Settings → Analytics
**Required:** ⚠️ Optional (but recommended for tracking)
**Scope:** All environments

---

## Admin Credentials Variables

### VITE_ADMIN_EMAIL

**Value:** `admin@ecocollect.com`
**Purpose:** Default admin account email for testing/demo
**Security:** 🔒 Change this for production!
**Required:** ✅ Yes
**Scope:** All environments

### VITE_ADMIN_PASSWORD

**Value:** `Admin@12345`
**Purpose:** Default admin account password for testing/demo
**Security:** 🔒 MUST change this for production!
**Requirements:**

- Minimum 8 characters
- At least one uppercase letter (A-Z)
- At least one lowercase letter (a-z)
- At least one number (0-9)
- At least one special character (!@#$%^&\*)
  **Required:** ✅ Yes
  **Scope:** All environments
  **⚠️ WARNING:** Never use the same password in production as development!

---

## Environment Variable Usage by Environment

### Development (Local)

```bash
npm run dev
# Uses: .env.local or .env.development
```

**Variables needed:**

- All Firebase configuration variables
- Admin credentials (can use test values)
- Can be less restrictive for testing

### Production (Vercel)

```bash
npm run build
# Uses: Vercel Environment Variables (via Dashboard)
```

**Variables needed:**

- All Firebase configuration variables
- Admin credentials (MUST use security-hardened password)
- More restrictive security rules

---

## How to Use Environment Variables in Code

### In Vite React Project

```typescript
// Accessing variables
import.meta.env.VITE_FIREBASE_API_KEY;
import.meta.env.VITE_FIREBASE_PROJECT_ID;

// Example: firebase.ts
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  // ... other config
};
```

### Important:

- ✅ Variables MUST start with `VITE_` to be accessible in browser
- ✅ They're bundled in the final build (visible in browser)
- ❌ Never put sensitive secrets (API keys for backend-only use) with `VITE_` prefix
- ❌ These are NOT truly secret - only use public Firebase keys

---

## Vercel Deployment: Setting Environment Variables

### Method 1: Via Vercel Dashboard (Recommended)

1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Select your project
3. Click **Settings** → **Environment Variables**
4. Add each variable:
   - Name: `VITE_FIREBASE_API_KEY`
   - Value: `AIzaSyDBJHUAPRocDreTW6m6e3bkpkNy8WwKhe0`
   - Environments: ✅ Production ✅ Preview ✅ Development
5. Click **Save**
6. Repeat for all 9 variables

### Method 2: Via Vercel CLI

```bash
vercel env add VITE_FIREBASE_API_KEY
vercel env add VITE_FIREBASE_AUTH_DOMAIN
# ... repeat for all variables
```

### Method 3: Via Git Push with .env File

```bash
# Create .env file with all variables
# Push to GitHub
# Vercel detects and prompts to add variables
```

---

## Security Best Practices

### ✅ DO's:

- ✅ Use `.env.local` for local development
- ✅ Add `.env.local` to `.gitignore` (never commit)
- ✅ Use Vercel Dashboard to set production variables
- ✅ Rotate credentials periodically
- ✅ Use different passwords for dev vs production
- ✅ Enable Firebase Security Rules
- ✅ Monitor Firebase usage in console
- ✅ Use custom domain instead of vercel.app domain

### ❌ DON'Ts:

- ❌ Never commit `.env.local` to GitHub
- ❌ Never share Vercel environment variables in chat/email
- ❌ Never use weak passwords for admin accounts
- ❌ Never expose Firebase private keys (only use public config)
- ❌ Never leave default admin credentials in production
- ❌ Never share Firebase project IDs publicly
- ❌ Never deploy without updated Firebase security rules

---

## Testing Environment Variables

### Check if variables are loaded (local):

```bash
npm run dev
# Open browser console (F12)
# Type in console: import.meta.env.VITE_FIREBASE_API_KEY
# Should print your API key
```

### Check if variables are loaded (production):

```bash
# Visit your Vercel app
# Open browser console (F12)
# Type: import.meta.env.VITE_FIREBASE_PROJECT_ID
# Should print your project ID
```

### Debug variables:

```typescript
// Add this to your code temporarily to verify:
console.log("Firebase Config Loaded:", {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY?.substring(0, 10) + "...",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
});
```

---

## Troubleshooting

### Issue: "undefined is not a function" for Firebase

**Solution:** Check that all 7 Firebase variables are set in Vercel

### Issue: "CORS error" in browser

**Solution:** Add Vercel URL to Firebase Authorized JavaScript Origins

### Issue: Blank page on production

**Solution:** Check Vercel build logs for environment variable errors

### Issue: Auth not working

**Solution:** Verify admin email and password are correct in `.env.local`

---

## Your Current Configuration

```
✅ Firebase Project: smart-green-e8080
✅ Auth Domain: smart-green-e8080.firebaseapp.com
✅ Storage Bucket: smart-green-e8080.firebasestorage.app

To use in Vercel, add all 9 variables to:
Dashboard → Settings → Environment Variables
```

---

**Last Updated:** April 2, 2026
**Next Review:** After deployment to verify all variables are working
