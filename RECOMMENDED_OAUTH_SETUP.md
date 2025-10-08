# Recommended OAuth Setup - Multi-Environment

## Overview

The **best practice** is to have **separate Discord OAuth applications** for each environment. This provides clean separation, security, and flexibility.

## Setup: 3 Discord Applications

### 1. Development App
**Name:** `Aztec Recognizer (Development)`

**Purpose:** Local development only

**Redirect URIs:**
```
http://localhost:3000/api/auth/callback/discord
```

**Environment Variables (`.env.local`):**
```bash
DISCORD_CLIENT_ID=your-dev-client-id
DISCORD_CLIENT_SECRET=your-dev-client-secret
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=generate-unique-secret-for-dev
DATABASE_URL=postgresql://localhost:5432/aztec_dev
```

### 2. Production App
**Name:** `Aztec Recognizer`

**Purpose:** Production deployments only

**Redirect URIs:**
```
https://aztec-recognizer.vercel.app/api/auth/callback/discord
https://aztec-recognizer.com/api/auth/callback/discord
```
*(Add both Vercel domain and custom domain if you have one)*

**Environment Variables (Vercel - Production):**
```bash
DISCORD_CLIENT_ID=your-prod-client-id
DISCORD_CLIENT_SECRET=your-prod-client-secret
NEXTAUTH_URL=https://aztec-recognizer.vercel.app
NEXTAUTH_SECRET=generate-unique-secret-for-prod
DATABASE_URL=your-production-database-url
```

### 3. Preview/Testing App (Optional but Recommended)
**Name:** `Aztec Recognizer (Preview)`

**Purpose:** Testing OAuth in preview deployments

**Redirect URIs:**
```
https://aztec-recognizer-git-staging.vercel.app/api/auth/callback/discord
```
*(Or add specific preview URLs as needed)*

**Environment Variables (Vercel - Preview):**
```bash
DISCORD_CLIENT_ID=your-preview-client-id
DISCORD_CLIENT_SECRET=your-preview-client-secret
NEXTAUTH_URL=${VERCEL_URL}
NEXTAUTH_SECRET=generate-unique-secret-for-preview
DATABASE_URL=your-preview-database-url
```

---

## Step-by-Step Setup

### Step 1: Create Discord Applications

#### Create Development App
1. Go to https://discord.com/developers/applications
2. Click **New Application**
3. Name: `Aztec Recognizer (Development)`
4. Click **Create**
5. Go to **OAuth2** → **Redirects**
6. Add: `http://localhost:3000/api/auth/callback/discord`
7. Copy **Client ID** and **Client Secret**

#### Create Production App
1. Click **New Application** again
2. Name: `Aztec Recognizer`
3. Go to **OAuth2** → **Redirects**
4. Add: `https://aztec-recognizer.vercel.app/api/auth/callback/discord`
5. Copy **Client ID** and **Client Secret**

#### Create Preview App (Optional)
1. Click **New Application**
2. Name: `Aztec Recognizer (Preview)`
3. Go to **OAuth2** → **Redirects**
4. Add preview URLs as needed (or use staging branch URL)
5. Copy **Client ID** and **Client Secret**

### Step 2: Generate Unique Secrets

Generate a unique `NEXTAUTH_SECRET` for each environment:

```bash
# Generate 3 different secrets
openssl rand -base64 32  # For development
openssl rand -base64 32  # For production
openssl rand -base64 32  # For preview
```

**Why unique secrets?**
- Security isolation
- Prevents token reuse across environments
- Easier to rotate if one is compromised

### Step 3: Configure Local Development

Create `.env.local`:
```bash
# Development Discord App
DISCORD_CLIENT_ID=your-dev-app-client-id
DISCORD_CLIENT_SECRET=your-dev-app-secret

# Local URLs
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-dev-nextauth-secret

# Local Database (or dev database)
DATABASE_URL=postgresql://localhost:5432/aztec_dev
```

Test locally:
```bash
npm run dev
# Visit http://localhost:3000
# Try Discord login → Should work
```

### Step 4: Configure Vercel Production

1. Go to: Vercel Dashboard → aztec-recognizer → Settings → Environment Variables

2. Add variables for **Production** environment:
   ```
   DISCORD_CLIENT_ID = your-prod-client-id
   DISCORD_CLIENT_SECRET = your-prod-client-secret
   NEXTAUTH_URL = https://aztec-recognizer.vercel.app
   NEXTAUTH_SECRET = your-prod-nextauth-secret
   DATABASE_URL = your-production-database-url
   ```

3. **Important:** Select **Production** only (uncheck Preview and Development)

### Step 5: Configure Vercel Preview (Optional)

1. Add variables for **Preview** environment:
   ```
   DISCORD_CLIENT_ID = your-preview-client-id
   DISCORD_CLIENT_SECRET = your-preview-client-secret
   NEXTAUTH_URL = ${VERCEL_URL}
   NEXTAUTH_SECRET = your-preview-nextauth-secret
   DATABASE_URL = your-preview-database-url
   ```

2. **Important:** Select **Preview** only

**Note:** `${VERCEL_URL}` is a Vercel system variable that auto-fills with the current deployment URL.

### Step 6: Deploy and Test

```bash
# Deploy to production
git push origin main

# Wait for deployment
# Visit: https://aztec-recognizer.vercel.app
# Test Discord login → Should work
```

---

## Alternative Simpler Solutions

If separate apps feel like overkill, here are simpler alternatives:

### Option A: Production + Local Only (Recommended for Solo Projects)

**Setup:**
- 1 Discord app for production
- 1 Discord app for local dev
- Skip OAuth testing in previews

**Redirect URIs (Production App):**
```
https://aztec-recognizer.vercel.app/api/auth/callback/discord
```

**Redirect URIs (Dev App):**
```
http://localhost:3000/api/auth/callback/discord
```

**Testing Strategy:**
- Test OAuth locally during development
- Test OAuth on production after deploying
- Skip OAuth in preview deployments (test other features only)

**Pros:**
- ✅ Simple to manage (only 2 apps)
- ✅ Secure (dev credentials separate from prod)
- ✅ Minimal redirect URIs to maintain

**Cons:**
- ❌ Can't test OAuth in preview deployments
- ❌ Must deploy to prod to test OAuth changes

### Option B: Single Discord App with Multiple Redirects (Simplest)

**Setup:**
- 1 Discord app for all environments
- Add all redirect URIs to this single app

**Redirect URIs:**
```
http://localhost:3000/api/auth/callback/discord
https://aztec-recognizer.vercel.app/api/auth/callback/discord
https://aztec-recognizer-git-staging.vercel.app/api/auth/callback/discord
```

**Environment Variables (same in all environments):**
```bash
DISCORD_CLIENT_ID=same-everywhere
DISCORD_CLIENT_SECRET=same-everywhere
NEXTAUTH_URL=varies-by-environment
```

**Pros:**
- ✅ Simplest to set up
- ✅ Only manage 1 Discord app

**Cons:**
- ❌ Security risk (same credentials everywhere)
- ❌ Can't isolate dev from prod
- ❌ Must add every preview URL manually
- ❌ If credentials leak, affects all environments

---

## Comparison Table

| Solution | Security | Flexibility | Complexity | Preview OAuth | Best For |
|----------|----------|-------------|------------|---------------|----------|
| **3 Separate Apps** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ✅ Yes | Teams, production apps |
| **Prod + Dev Apps** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐ | ❌ No | Solo projects, MVPs |
| **Single App** | ⭐⭐ | ⭐⭐⭐ | ⭐ | ⚠️ Manual | Quick prototypes only |

---

## My Recommendation for You

Based on your situation (exposed credentials, Vercel previews, testing):

### **Go with Option A: Production + Dev Apps** ✅

**Reasoning:**
1. You already had credentials exposed → Need to create new apps anyway
2. You're testing solo → Don't need full preview environment
3. Vercel preview URLs change often → Too many redirects to manage
4. This balances security with simplicity

**Your Setup:**
```
Development App:
├─ Redirect: http://localhost:3000/api/auth/callback/discord
└─ Use for: Local development

Production App:
├─ Redirect: https://aztec-recognizer.vercel.app/api/auth/callback/discord
└─ Use for: Production deployments
```

**Testing Strategy:**
1. Develop and test OAuth locally
2. Deploy to production when ready
3. Test in production
4. Use preview deployments for UI/feature testing only (skip OAuth)

---

## Implementation Steps for You

### Phase 1: Create New Discord Apps (Security Fix)

Since your credentials were exposed, create fresh apps:

```bash
# 1. Create Development App
Name: Aztec Recognizer (Development)
Redirect: http://localhost:3000/api/auth/callback/discord
→ Save Client ID and Secret

# 2. Create Production App
Name: Aztec Recognizer
Redirect: https://aztec-recognizer.vercel.app/api/auth/callback/discord
→ Save Client ID and Secret

# 3. Generate New NextAuth Secrets
openssl rand -base64 32  # For dev
openssl rand -base64 32  # For prod
```

### Phase 2: Update Local Environment

```bash
cd aztec-recognize

# Create .env.local (for development)
cat > .env.local << 'EOF'
# Development Discord App (NEW)
DISCORD_CLIENT_ID=your-new-dev-client-id
DISCORD_CLIENT_SECRET=your-new-dev-secret

NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-new-dev-nextauth-secret

# Development Database
DATABASE_URL=postgresql://localhost:5432/aztec_dev
EOF

# Test locally
npm run dev
# Visit http://localhost:3000 and test Discord login
```

### Phase 3: Update Vercel Production

1. Go to: https://vercel.com/dashboard
2. Select: aztec-recognizer → Settings → Environment Variables
3. **Delete old variables** (exposed credentials)
4. **Add new variables** for Production only:
   ```
   DISCORD_CLIENT_ID = your-new-prod-client-id
   DISCORD_CLIENT_SECRET = your-new-prod-secret
   NEXTAUTH_URL = https://aztec-recognizer.vercel.app
   NEXTAUTH_SECRET = your-new-prod-secret
   DATABASE_URL = your-production-database-url
   ```

### Phase 4: Deploy and Verify

```bash
# Deploy to production
git push origin main

# Wait for deployment to complete

# Test production
# 1. Visit: https://aztec-recognizer.vercel.app
# 2. Click "Sign in with Discord"
# 3. Should redirect to Discord → Authorize → Redirect back logged in
# 4. Verify user appears in database (npx prisma studio)
```

### Phase 5: Document for Team

Update your `.env.example`:
```bash
# Discord OAuth
DISCORD_CLIENT_ID="get-from-team-lead"
DISCORD_CLIENT_SECRET="get-from-team-lead"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="generate-with: openssl rand -base64 32"

# Database
DATABASE_URL="postgresql://localhost:5432/aztec_dev"
```

---

## Security Checklist

After implementing the recommended setup:

- [ ] **Old credentials deleted** from Discord Developer Portal
- [ ] **New development app** created with separate credentials
- [ ] **New production app** created with separate credentials
- [ ] **All Vercel environment variables** updated with new credentials
- [ ] **Local .env.local** uses development credentials
- [ ] **Production environment** uses production credentials
- [ ] **Secrets are unique** per environment (not reused)
- [ ] **Old credentials removed** from git history (optional but recommended)
- [ ] **.env files** still in .gitignore
- [ ] **Team members notified** of credential changes

---

## Troubleshooting

### "Still getting 400 on production"

Check:
1. Production redirect URI matches `NEXTAUTH_URL` exactly
2. No trailing slash in `NEXTAUTH_URL`
3. Used production Discord app credentials
4. Redeployed after changing env vars

### "Works locally but not in production"

Check:
1. Are you using **different Discord apps** for dev vs prod?
2. Did you set env vars for **Production** environment only?
3. Did you redeploy after changing env vars?

### "Preview deployments asking for Vercel signup"

**This is expected** with Production + Dev setup. Preview deployments don't have OAuth configured.

**Options:**
1. Accept it (test OAuth in dev/prod only)
2. Add preview Discord app if you need OAuth in previews

---

## Cost Analysis

**Discord Apps:**
- ✅ Free (unlimited apps)
- ✅ No rate limits for typical usage
- ✅ Each app is independent

**Vercel:**
- ✅ Environment variables are free
- ✅ Deployments are free (hobby plan)
- ✅ Preview deployments included

**Total Cost:** $0 💰

---

## Summary

**Best for you:** Production + Development apps (Option A)

**Why:**
- Secure (isolates dev from prod)
- Simple (only 2 apps to manage)
- Practical (works with your workflow)
- Fixes security issue (new credentials)

**Setup time:** ~15 minutes

**Maintenance:** Minimal (rarely change)

**Security:** High (credentials isolated)

**Next step:** Create 2 new Discord apps and update your environment variables.
