# Pre-Deployment Checklist

Complete this checklist before deploying to Vercel!

---

## ✅ CODE & GIT SETUP

- [ ] Code is committed and tested locally
- [ ] `npm run build` succeeds without errors
- [ ] `npm run preview` works correctly
- [ ] No console errors when running app locally
- [ ] GitHub account created and repo pushed to GitHub
- [ ] Repository is public (or invite Vercel to access private repo)
- [ ] `.env.local` is in `.gitignore` and NOT committed
- [ ] No sensitive credentials in code comments

**Commands to verify:**

```bash
git status                    # Should show clean working directory
npm run build                 # Should succeed
npm run preview              # Should run without errors
```

---

## ✅ FIREBASE SETUP FOR PRODUCTION

### Authentication

- [ ] Firebase project created
- [ ] Email/Password authentication enabled in Firebase Console
- [ ] Admin account created in Firebase (admin@ecocollect.com)
- [ ] Admin password set to secure value (NOT Admin@12345)

### Database (Firestore)

- [ ] Firestore database created in `nam5` region
- [ ] Security rules are updated to allow authenticated users:
  ```
  rules_version = '2';
  service cloud.firestore {
    match /databases/{database}/documents {
      match /{document=**} {
        allow read, write: if request.auth != null;
      }
    }
  }
  ```
- [ ] Composite indexes created if needed (Firestore will prompt)
- [ ] Backup enabled (optional but recommended)

### Storage (Cloud Storage)

- [ ] Cloud Storage bucket created
- [ ] Security rules allow authenticated uploads:
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

### Authorized Domains

- [ ] Firebase Console → Authentication → Settings
- [ ] Add **Authorized JavaScript origins**:
  ```
  https://your-app-name.vercel.app
  https://your-app-name-*.vercel.app
  http://localhost:8080 (for local development)
  ```
- [ ] Add **Authorized redirect URIs** (same URLs)

---

## ✅ VERCEL ACCOUNT & PROJECT

### Account Setup

- [ ] Vercel account created (vercel.com)
- [ ] Signed in with GitHub account
- [ ] GitHub authorized and connected

### Project Created

- [ ] Repository imported to Vercel
- [ ] Framework detected as **Vite**
- [ ] Build command: `npm run build`
- [ ] Output directory: `dist`
- [ ] Install command: `npm install` or `npm ci`

---

## ✅ ENVIRONMENT VARIABLES IN VERCEL

Add each variable in **Vercel Dashboard → Settings → Environment Variables**:

### Required Variables (9 total)

#### Firebase Configuration

- [ ] `VITE_FIREBASE_API_KEY` = `AIzaSyDBJHUAPRocDreTW6m6e3bkpkNy8WwKhe0`
- [ ] `VITE_FIREBASE_AUTH_DOMAIN` = `smart-green-e8080.firebaseapp.com`
- [ ] `VITE_FIREBASE_PROJECT_ID` = `smart-green-e8080`
- [ ] `VITE_FIREBASE_STORAGE_BUCKET` = `smart-green-e8080.firebasestorage.app`
- [ ] `VITE_FIREBASE_MESSAGING_SENDER_ID` = `1090844924733`
- [ ] `VITE_FIREBASE_APP_ID` = `1:1090844924733:web:0861ed57d19114f1488354`
- [ ] `VITE_FIREBASE_MEASUREMENT_ID` = `G-FB14Z9SCNE`

#### Admin Credentials

- [ ] `VITE_ADMIN_EMAIL` = `admin@ecocollect.com`
- [ ] `VITE_ADMIN_PASSWORD` = [YOUR SECURE PASSWORD - NOT Admin@12345]

### For Each Variable:

- [ ] Set for **Production** environment
- [ ] Set for **Preview** environment
- [ ] Set for **Development** environment
- [ ] Click **Save**

---

## ✅ SECURITY AUDIT

### Credentials

- [ ] Admin password is secured (8+ chars, special characters)
- [ ] No hardcoded secrets in code
- [ ] No API keys in comments
- [ ] `.env.local` not in GitHub (check with `git log --all`)

### Firestore Rules

- [ ] Rules prohibit unauthenticated access
- [ ] Read/write only for authenticated users
- [ ] Admin access properly configured

### Storage Rules

- [ ] Authenticated users can upload
- [ ] Public read access only if intended
- [ ] File size limits implemented (if needed)

### APIs

- [ ] Firebase API key restrictions set (if paid plan)
- [ ] Referred domain restrictions configured

---

## ✅ BUILD & DEPLOYMENT TEST

### First Deployment

- [ ] Click **Deploy** in Vercel Dashboard
- [ ] Watch build logs - should complete in 2-5 minutes
- [ ] Status should show **Ready** (blue checkmark)
- [ ] Preview URL generated

### Test Deployment

Open the deployment URL and verify:

- [ ] Page loads without errors
- [ ] No console errors (F12)
- [ ] Firebase config is recognized
- [ ] Logo and styling loads correctly
- [ ] Navigation works

### Test Authentication

- [ ] Login page accessible
- [ ] Can create new account
- [ ] Email verification works (if enabled)
- [ ] Can login with test account
- [ ] Can logout

### Test Core Features

- [ ] Dashboard loads after login
- [ ] Can navigate between pages
- [ ] Can book a pickup (if user role)
- [ ] Can view completed pickups
- [ ] Can upload images to storage

### Test Data

- [ ] User data saves to Firestore
- [ ] Images upload to Cloud Storage
- [ ] Transactions recorded correctly
- [ ] Wallet balances update
- [ ] Admin dashboard shows data

---

## ✅ PERFORMANCE

- [ ] Page load time < 5 seconds (check Vercel Analytics)
- [ ] No major bundle size warnings
- [ ] Images optimized and loading quickly
- [ ] No console warnings or errors

---

## ✅ MONITORING & LOGGING

### Vercel

- [ ] Project overview shows **Ready** status
- [ ] No failed deployments in history
- [ ] Edge logs accessible for debugging

### Firebase

- [ ] Monitor usage quotas (Firestore reads/writes)
- [ ] Check Cloud Storage usage
- [ ] Review authentication activity
- [ ] Set up Google Cloud billing alerts

---

## ✅ DOCUMENTATION

- [ ] README.md updated with live link
- [ ] VERCEL_DEPLOYMENT_GUIDE.md created ✅
- [ ] ENV_VARIABLES_REFERENCE.md created ✅
- [ ] Emergency contacts documented (if team project)

---

## ✅ POST-DEPLOYMENT

### Monitoring

- [ ] Check Vercel Deployments tab regularly
- [ ] Monitor Firebase usage
- [ ] Set up alerts for spikes
- [ ] Review error logs weekly

### Maintenance

- [ ] Plan for database backups
- [ ] Update dependencies monthly
- [ ] Review security rules quarterly
- [ ] Plan for storage cleanup

---

## ⚠️ CRITICAL - DO NOT SKIP

| Task                                | Importance  | Status |
| ----------------------------------- | ----------- | ------ |
| Add environment variables to Vercel | 🔴 CRITICAL | [ ]    |
| Update Firebase authorized domains  | 🔴 CRITICAL | [ ]    |
| Change admin password from default  | 🔴 CRITICAL | [ ]    |
| Update Firestore security rules     | 🔴 CRITICAL | [ ]    |
| Test login on production            | 🔴 CRITICAL | [ ]    |
| Verify Firebase connection works    | 🔴 CRITICAL | [ ]    |
| Test data persistence in Firestore  | 🟠 HIGH     | [ ]    |
| Test file uploads to Storage        | 🟠 HIGH     | [ ]    |
| Monitor build logs for errors       | 🟠 HIGH     | [ ]    |

---

## 📋 FINAL CHECKLIST

Before launching to users:

```
Code Quality
- [ ] No console errors in F12
- [ ] No warnings in build logs
- [ ] Performance acceptable
- [ ] Mobile responsive works

Functionality
- [ ] All pages load correctly
- [ ] User registration works
- [ ] Login/logout works
- [ ] Data persists to Firestore
- [ ] Images upload to Storage
- [ ] Wallet system functional
- [ ] Collector features working
- [ ] Admin dashboard shows data

Security
- [ ] Environment variables secured
- [ ] No hardcoded secrets
- [ ] Firestore rules active
- [ ] Storage rules active
- [ ] CORS properly configured
- [ ] Admin account secured

Deployment
- [ ] Build succeeds on Vercel
- [ ] No failed deployments
- [ ] Edge functions working (if any)
- [ ] SSL certificate valid
- [ ] Custom domain working (if used)

Monitoring
- [ ] Error tracking enabled
- [ ] Analytics enabled
- [ ] Performance monitoring active
- [ ] Backup strategy in place
```

---

## 🚀 DEPLOYMENT STEPS RECAP

1. Push code to GitHub
2. Create Vercel account
3. Import project from GitHub
4. Add 9 environment variables
5. Trigger first deployment
6. Update Firebase authorized domains
7. Test all features
8. Enable custom domain (optional)
9. Monitor and celebrate! 🎉

---

## 📞 TROUBLESHOOTING

If deployment fails, check:

1. **Build Error**: Review Vercel build logs, check for syntax errors
2. **Cannot Find Module**: Run `npm install` and push again
3. **Firebase Error**: Verify environment variables in Vercel
4. **Blank Page**: Check browser console (F12) and Vercel logs
5. **Auth Not Working**: Check Firebase authorized domains
6. **No Data Showing**: Verify Firestore security rules allow reads

---

## ✅ COMPLETION

- [ ] All items checked
- [ ] Application tested thoroughly
- [ ] Ready to share with users

**Deployment Date:** ******\_\_\_\_******
**Deployed By:** ******\_\_\_\_******
**Notes/Issues:** **********************\_\_\_\_**********************

---

**Need help?** Check VERCEL_DEPLOYMENT_GUIDE.md or Firebase documentation
