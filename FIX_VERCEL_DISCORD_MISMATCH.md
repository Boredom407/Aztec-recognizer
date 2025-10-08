# Fix: Vercel URL Changed - Discord Redirect Mismatch

## The Problem

Vercel preview deployments get **unique URLs** for each deployment. Your Discord OAuth is failing because the redirect URI doesn't match.

**Current deployment URL:**
```
https://aztec-recognizer-afwn-5r99jsxzu-gaymuseds-projects.vercel.app
```

**But Discord only has:**
```
https://aztec-recognizer-ifu6joecl-gaymuseds-projects.vercel.app
```

## Solution 1: Add Wildcard/Multiple Redirect URIs (RECOMMENDED)

### Step 1: Go to Discord Developer Portal
https://discord.com/developers/applications/1417182508377837709/oauth2

### Step 2: Add ALL These Redirect URIs

Add these redirect URIs (Discord allows multiple):

```
# Local development
http://localhost:3000/api/auth/callback/discord

# Vercel production (your main domain)
https://aztec-recognizer.vercel.app/api/auth/callback/discord

# Current preview deployment
https://aztec-recognizer-afwn-5r99jsxzu-gaymuseds-projects.vercel.app/api/auth/callback/discord

# Previous preview deployment (if you still need it)
https://aztec-recognizer-ifu6joecl-gaymuseds-projects.vercel.app/api/auth/callback/discord
```

### Step 3: Save Changes

Click **Save Changes** in Discord Developer Portal.

### Step 4: Wait 1-2 Minutes

Discord needs time to propagate the changes across their servers.

### Step 5: Try Logging In Again

Go back to your Vercel app and try Discord login.

---

## Solution 2: Use Production Domain (BEST FOR PRODUCTION)

Instead of preview deployment URLs, use a consistent production domain.

### Option A: Use Vercel's Default Production Domain

```
https://aztec-recognizer.vercel.app
```

**Steps:**
1. Add this redirect URI in Discord:
   ```
   https://aztec-recognizer.vercel.app/api/auth/callback/discord
   ```

2. Update `NEXTAUTH_URL` in Vercel (Production environment only):
   ```
   NEXTAUTH_URL=https://aztec-recognizer.vercel.app
   ```

3. Deploy to production:
   ```bash
   git push origin main
   # Or in Vercel dashboard: Promote deployment to production
   ```

### Option B: Use Custom Domain

If you have a custom domain (e.g., `aztec-recognizer.com`):

1. Add domain in Vercel: Project Settings → Domains
2. Add redirect URI in Discord:
   ```
   https://aztec-recognizer.com/api/auth/callback/discord
   ```
3. Update `NEXTAUTH_URL`:
   ```
   NEXTAUTH_URL=https://aztec-recognizer.com
   ```

---

## Solution 3: Configure Vercel for Consistent Preview URLs

### Make NEXTAUTH_URL Dynamic for Preview Deployments

Update your Vercel environment variables:

#### Production Environment
```
NEXTAUTH_URL=https://aztec-recognizer.vercel.app
```

#### Preview Environment
```
NEXTAUTH_URL=${VERCEL_URL}
```

**Note:** Vercel automatically sets `VERCEL_URL` to the current deployment URL.

**BUT:** You'll need to add each preview URL to Discord manually, which isn't practical.

---

## Solution 4: Separate Discord Apps for Dev/Production (RECOMMENDED FOR TEAMS)

Create separate Discord applications for different environments:

### Development Discord App
- **Name:** "Aztec Recognizer (Dev)"
- **Redirect URIs:**
  ```
  http://localhost:3000/api/auth/callback/discord
  ```
- **Use in:** Local development

### Staging/Preview Discord App
- **Name:** "Aztec Recognizer (Preview)"
- **Redirect URIs:**
  ```
  https://*.vercel.app/api/auth/callback/discord
  ```
  ⚠️ Discord doesn't support wildcards! You need to add each preview URL.

### Production Discord App
- **Name:** "Aztec Recognizer"
- **Redirect URIs:**
  ```
  https://aztec-recognizer.vercel.app/api/auth/callback/discord
  https://aztec-recognizer.com/api/auth/callback/discord
  ```
- **Use in:** Production deployments

**Environment Variables:**

```bash
# Local (.env)
DISCORD_CLIENT_ID=dev-app-client-id
DISCORD_CLIENT_SECRET=dev-app-secret
NEXTAUTH_URL=http://localhost:3000

# Vercel Preview
DISCORD_CLIENT_ID=preview-app-client-id
DISCORD_CLIENT_SECRET=preview-app-secret
NEXTAUTH_URL=${VERCEL_URL}

# Vercel Production
DISCORD_CLIENT_ID=prod-app-client-id
DISCORD_CLIENT_SECRET=prod-app-secret
NEXTAUTH_URL=https://aztec-recognizer.vercel.app
```

---

## Quick Fix for Right Now

**Fastest solution to get you working immediately:**

1. **Add the current preview URL to Discord:**
   - Go to: https://discord.com/developers/applications/1417182508377837709/oauth2
   - Click **Add Redirect**
   - Paste: `https://aztec-recognizer-afwn-5r99jsxzu-gaymuseds-projects.vercel.app/api/auth/callback/discord`
   - Click **Save Changes**

2. **Wait 1-2 minutes**

3. **Try logging in again**

---

## Understanding Vercel Preview Deployments

### Why URLs Change

Vercel creates a **unique URL for every deployment**:
- Push to branch → New preview URL
- New commit → New preview URL
- Redeploy → New preview URL

**Pattern:**
```
https://{project-name}-{random-hash}-{team-slug}.vercel.app
                      ^^^^^^^^^^^^^^^^
                      This changes each deployment
```

### Vercel URL Types

1. **Production URL:**
   ```
   https://aztec-recognizer.vercel.app
   ```
   - Consistent across deployments
   - Points to production branch (usually `main`)
   - **Use this for Discord OAuth**

2. **Preview URL (unique per deployment):**
   ```
   https://aztec-recognizer-afwn-5r99jsxzu-gaymuseds-projects.vercel.app
   ```
   - Changes with every deployment
   - Don't use for OAuth (too many URLs to manage)

3. **Git Branch URL:**
   ```
   https://aztec-recognizer-git-{branch-name}-{team-slug}.vercel.app
   ```
   - Consistent for a specific branch
   - Could work for long-lived branches

---

## Best Practice Setup

### For Production App:

```bash
# Discord Developer Portal
Redirect URI: https://aztec-recognizer.vercel.app/api/auth/callback/discord

# Vercel Environment Variables (Production only)
NEXTAUTH_URL=https://aztec-recognizer.vercel.app
DISCORD_CLIENT_ID=1417182508377837709
DISCORD_CLIENT_SECRET=nK8OQ_cfj7YQnlKQA6D3P18QtVvEP9Ns
```

### For Testing/Preview:

**Option 1:** Test OAuth locally
```bash
# Local .env
NEXTAUTH_URL=http://localhost:3000

# Discord redirect URI
http://localhost:3000/api/auth/callback/discord
```

**Option 2:** Skip OAuth in previews
- Preview deployments for UI/feature testing
- Production for OAuth testing

---

## Debugging Future URL Mismatches

### Check Your Current Deployment URL

In browser console:
```javascript
console.log(window.location.origin)
// Should match NEXTAUTH_URL env var
```

### Check What Discord Has

Discord error messages show the redirect URI:
```
redirect_uri=https%3A%2F%2Faztec-recognizer-afwn-5r99jsxzu-gaymuseds-projects.vercel.app%2Fapi%2Fauth%2Fcallback%2Fdiscord
```

URL decode this:
```
https://aztec-recognizer-afwn-5r99jsxzu-gaymuseds-projects.vercel.app/api/auth/callback/discord
```

Then check if it exists in Discord Developer Portal → OAuth2 → Redirects.

### Verify NEXTAUTH_URL in Vercel

```bash
# Vercel Dashboard
1. Go to: Settings → Environment Variables
2. Find NEXTAUTH_URL
3. Check which environments it's set for:
   - Production: Should be production domain
   - Preview: Should be ${VERCEL_URL} OR specific preview domain
   - Development: Should be http://localhost:3000
```

---

## Step-by-Step Fix (Right Now)

**Do this now to get unblocked:**

### 1. Get Your Current Vercel URL
You're on: `https://aztec-recognizer-afwn-5r99jsxzu-gaymuseds-projects.vercel.app`

### 2. Add to Discord
https://discord.com/developers/applications/1417182508377837709/oauth2

Click **Add Redirect**, paste:
```
https://aztec-recognizer-afwn-5r99jsxzu-gaymuseds-projects.vercel.app/api/auth/callback/discord
```

Click **Save Changes**

### 3. Update Vercel NEXTAUTH_URL (for this preview)

Go to: Vercel Dashboard → aztec-recognizer → Settings → Environment Variables

Find `NEXTAUTH_URL` for **Preview** environment.

Update to:
```
https://aztec-recognizer-afwn-5r99jsxzu-gaymuseds-projects.vercel.app
```

**Or better:** Set it to `${VERCEL_URL}` (Vercel will automatically use the current deployment URL)

### 4. Redeploy

After changing env vars, redeploy:
```bash
# Trigger a redeploy
git commit --allow-empty -m "Fix Discord OAuth redirect"
git push
```

### 5. Test After 2 Minutes

Wait for:
- Discord to update (1-2 minutes)
- Vercel to deploy (1-2 minutes)

Then try logging in.

---

## Long-Term Solution (Recommended)

### Set Up Production Domain

1. **Use Vercel's production URL:**
   - Production domain: `https://aztec-recognizer.vercel.app`
   - This URL is **consistent** and won't change

2. **Configure Discord for production only:**
   ```
   Redirect URIs:
   - http://localhost:3000/api/auth/callback/discord (for dev)
   - https://aztec-recognizer.vercel.app/api/auth/callback/discord (for prod)
   ```

3. **Set NEXTAUTH_URL in Vercel:**
   - **Production:** `https://aztec-recognizer.vercel.app`
   - **Preview:** Don't test OAuth in previews (or use separate Discord app)
   - **Development:** `http://localhost:3000`

4. **Test OAuth only on:**
   - Local development
   - Production deployments
   - Skip OAuth testing on preview deployments

This way, you only manage 2 redirect URIs instead of dozens.

---

## Summary

**Problem:** Vercel preview URL changed, Discord doesn't have the new URL registered.

**Quick Fix:** Add new URL to Discord Developer Portal redirect URIs.

**Long-term Fix:** Use production domain for OAuth, test previews for UI only.

**Right now:**
1. Add current preview URL to Discord redirects
2. Wait 2 minutes
3. Try logging in
