# Vercel Deployment Guide - Smart Waste Flow

## **STEP 1: Prepare Your Project**

### 1.1 Install Vercel CLI

```bash
npm install -g vercel
```

### 1.2 Ensure Build is Working Locally

```bash
npm run build
npm run preview
```

Make sure the app builds without errors.

### 1.3 Push Code to GitHub (Required for Vercel)

```bash
git init
git add .
git commit -m "Initial commit - Ready for Vercel deployment"
git remote add origin https://github.com/YOUR_USERNAME/smart-waste-flow.git
git branch -M main
git push -u origin main
```

---

## **STEP 2: Create Vercel Account**

1. Go to [vercel.com](https://vercel.com)
2. Sign up with GitHub account (recommended for easier integration)
3. Authorize Vercel to access your GitHub repositories

---

## **STEP 3: Deploy to Vercel**

### Option A: Using Vercel Dashboard (Easiest)

1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Click **"Add New..."** → **"Project"**
3. Select your `smart-waste-flow` GitHub repository
4. Click **"Import"**
5. Configure project:
   - **Framework Preset**: Vite
   - **Root Directory**: ./smart-waste-flow (if in monorepo, otherwise leave default)
   - Click **"Deploy"**

### Option B: Using Vercel CLI

```bash
cd smart-waste-flow
vercel login
vercel --prod
```

Follow the prompts to create project and deploy.

---

## **STEP 4: Add Environment Variables to Vercel**

### 4.1 Via Vercel Dashboard

1. Go to your project on Vercel
2. Click **"Settings"** tab
3. Click **"Environment Variables"** in left sidebar
4. Add each variable:

**Production Environment Variables:**

```
VITE_FIREBASE_API_KEY = AIzaSyDBJHUAPRocDreTW6m6e3bkpkNy8WwKhe0
VITE_FIREBASE_AUTH_DOMAIN = smart-green-e8080.firebaseapp.com
VITE_FIREBASE_PROJECT_ID = smart-green-e8080
VITE_FIREBASE_STORAGE_BUCKET = smart-green-e8080.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID = 1090844924733
VITE_FIREBASE_APP_ID = 1:1090844924733:web:0861ed57d19114f1488354
VITE_FIREBASE_MEASUREMENT_ID = G-FB14Z9SCNE
VITE_ADMIN_EMAIL = admin@ecocollect.com
VITE_ADMIN_PASSWORD = Admin@12345
```

5. For each variable, ensure it's available for:
   - ✅ Production
   - ✅ Preview
   - ✅ Development

6. Click **"Save"**

### 4.2 Via Vercel CLI

```bash
vercel env add VITE_FIREBASE_API_KEY
# Paste: AIzaSyDBJHUAPRocDreTW6m6e3bkpkNy8WwKhe0
# Select: Production

vercel env add VITE_FIREBASE_AUTH_DOMAIN
# Paste: smart-green-e8080.firebaseapp.com
# Continue for all variables...
```

---

## **STEP 5: Configure Firebase for Production**

### 5.1 Update Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project: `smart-green-e8080`
3. Click **"Settings"** (Gear icon) → **"Project settings"**
4. Go to **"Authorized JavaScript origins"**
5. Add your Vercel production URL:
   ```
   https://your-app-name.vercel.app
   https://your-app-name-*.vercel.app (for preview deployments)
   ```

### 5.2 Update Firestore Rules (Important!)

1. Go to **Firestore Database**
2. Click **"Rules"** tab
3. Update to allow authenticated users:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow authenticated users to read/write
    match /{document=**} {
      allow read, write: if request.auth != null;
    }

    // Allow admins full access
    match /{document=**} {
      allow read, write: if request.auth.token.role == 'admin';
    }
  }
}
```

4. Click **"Publish"**

---

## **STEP 6: Enable Storage Rules**

1. Go to **Cloud Storage**
2. Click **"Rules"** tab
3. Update to allow authenticated uploads:

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

4. Publish

---

## **STEP 7: Test Deployment**

### 7.1 Check Build Status

- Go to **Vercel Dashboard** → Your Project
- Check **"Deployments"** tab
- Status should show **"Ready"** (blue checkmark)

### 7.2 Visit Live URL

```
https://your-app-name.vercel.app
```

### 7.3 Test Features

- ✅ Login page loads
- ✅ Firebase authentication works
- ✅ Can create an account
- ✅ Dashboard loads data
- ✅ Images upload to Cloud Storage

---

## **STEP 8: Setup Custom Domain (Optional)**

1. Go to **Vercel Dashboard** → Your Project → **"Domains"**
2. Click **"Add"**
3. Enter your domain: `smartwaste.com`
4. Update DNS records at your domain provider:
   ```
   CNAME: ALIAS or @ → cname.vercel.app
   ```
5. Wait for DNS propagation (5-48 hours)

---

## **STEP 9: Setup CI/CD Pipeline**

### Auto-Deploy on Git Push

Vercel automatically deploys when you push to your GitHub repo:

```bash
# Make changes locally
git add .
git commit -m "Update features"
git push origin main

# Vercel automatically builds and deploys!
```

### Preview Deployments

Every pull request automatically gets a preview URL:

```
https://your-app-name-pr-123.vercel.app
```

---

## **STEP 10: Monitor & Debug**

### Check Logs

```bash
vercel logs
```

### Environment Variables Status

```bash
vercel env ls
```

### Redeploy if Needed

```bash
vercel --prod
```

---

## **Important: Security Checklist**

- ✅ Never commit `.env.local` to GitHub
- ✅ Add to `.gitignore`:
  ```
  .env.local
  .env.*.local
  .DS_Store
  ```
- ✅ Use Vercel Secrets for sensitive data
- ✅ Rotate Firebase API keys periodically
- ✅ Enable 2FA on Vercel account
- ✅ Monitor Firebase usage in console

---

## **Troubleshooting**

### Build Failed

```
Error: Missing VITE_FIREBASE_API_KEY
```

**Solution**: Check Vercel environment variables are set for Production

### Firebase Auth Not Working

**Solution**: Add Vercel URL to Firebase authorized origins

### 403 Forbidden Error

**Solution**: Update Firestore/Storage security rules

### Blank Page on Deploy

**Solution**: Check browser console (F12) for errors, check Vercel logs

---

## **Quick Command Reference**

```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy for first time
vercel

# Deploy to production
vercel --prod

# View logs
vercel logs

# List environment vars
vercel env ls

# Add environment variable
vercel env add VARIABLE_NAME

# Remove environment variable
vercel env rm VARIABLE_NAME

# View all deployments
vercel list
```

---

**Your app should now be live at:** `https://your-app-name.vercel.app` 🚀
