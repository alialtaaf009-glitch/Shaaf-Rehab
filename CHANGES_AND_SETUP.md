# Shaaf Rehab — Changes & Setup Guide

This covers what was changed and the few things **you** must do (config that can't be done in code).

## What changed in this update

1. **New logo** — a sprout-in-a-ring (recovery/growth) icon replaces the "SR" box. All icon sizes (144/192/512 + maskable) regenerated. The build's `copy-logo.js` path bug was also fixed.
2. **Google login fixed** — now tries popup, then falls back to full-page redirect (the path that works inside the Android APK). See "Firebase setup" below — there is a console step you MUST do or login still fails.
3. **Patient Aftercare Companion removed** — the tab, its overview card, and the component file are gone. The staff app no longer ships any patient-facing screens.
4. **Editable Enrollment ID** — open a patient, click the Enrollment ID under their name to edit it. It's searchable. (Internally the stable record key is untouched, so existing records never orphan.)
5. **Access restricted to staff** — controlled by a `staff` collection in Firestore (add/remove staff with no redeploy), enforced both in the app and in `firestore.rules`.
6. **Header** — simplified name "Shaaf Rehab" + Urdu "شاف ری ہیب اینڈ ایڈکشن سینٹر", address (919 J2, Johar Town, Lahore), and registration PHC# R-28998.

## YOU MUST DO THESE (config, not code)

### A. Add your staff members (REQUIRED — login is locked until you do)
Access is now controlled by a `staff` collection in Firestore, so you can add or
remove staff anytime WITHOUT editing code or redeploying.

For each staff member:
1. Have them sign in once with Google — this will be denied, but it creates their
   account and gives them a **User UID** (visible in Firebase Console →
   Authentication → Users).
2. In Firestore, create a document at `staff/{that-uid}`. You can put any fields
   you like (e.g. `name`, `role`), or leave it empty — only its existence matters.
3. They can now sign in.

To remove someone's access, delete their `staff/{uid}` document.

### B. Firebase Console — authorize your domain (REQUIRED — fixes login)
1. Firebase Console → Authentication → Settings → **Authorized domains**.
2. Add your Netlify domain (e.g. `your-site.netlify.app`).
3. Ensure Google sign-in is enabled under Authentication → Sign-in method.

### C. Deploy the updated Firestore rules (REQUIRED — secures patient data)
- Firebase Console → Firestore → Rules → paste contents of `firestore.rules` → Publish.
- Note: `staff` documents can only be created/edited from the console (clients
  can't write them), which prevents anyone granting themselves access.

### D. Remove the URL bar in the APK (point 2)
The bar appears until Android verifies the app owns the URL. To fix:
1. In PWABuilder, when you generate the Android package, copy the **SHA-256 signing fingerprint** it shows you (and the package name you chose).
2. Edit `public/.well-known/assetlinks.json` and replace the two `REPLACE_WITH_...` placeholders.
3. Re-deploy so the file is live at `https://your-site.netlify.app/.well-known/assetlinks.json`.
4. Re-install the APK. The bar disappears once verification passes.

## Build & deploy
```
npm install
npm run build      # outputs dist/
```
Deploy `dist/` to Netlify (drag-drop) or push and let Netlify build (publish dir: dist).

## Still recommended (not yet done)
- Remove the 4 fake seed patients before real use (in `src/lib/firebase.ts`, the SEED_* arrays).
- Consider soft-delete (archive flag) instead of hard delete for medical records.
- Add an audit trail of who changed what.
