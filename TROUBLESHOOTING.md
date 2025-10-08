# Troubleshooting Guide

## Issue 1: "Unauthorized" Error When Testing Self-Nomination

### Expected Behavior ✅
You **should not** be able to nominate yourself. The app prevents this in two ways:

1. **Frontend:** Your own name is filtered out of the dropdown
2. **Backend:** If you somehow bypass the frontend, you'll get error: `"You cannot nominate yourself"`

### What You're Seeing
If you see "Unauthorized" instead of "You cannot nominate yourself", this indicates a **session problem**.

### Diagnosis Steps

#### Step 1: Check if you're logged in
```javascript
// Open browser console (F12) and run:
fetch('/api/auth/session').then(r => r.json()).then(console.log)

// Expected output:
{
  "user": {
    "id": "some-id",
    "name": "Your Name",
    "email": "your@email.com",
    "image": "..."
  },
  "expires": "2025-..."
}

// If you see `null` or empty object, you're NOT logged in
```

#### Step 2: Check if session is persisting
1. Sign in with Discord
2. Refresh the page
3. Check if you're still logged in
4. If not, this is a cookie/session issue

#### Step 3: Verify database connection
```bash
cd aztec-recognize

# Check if database is accessible
npx prisma db pull

# If this fails, your DATABASE_URL is wrong
```

### Solutions

#### Solution A: Session Cookie Issues

**Cause:** NextAuth session cookies not being set/read correctly.

**Fix in Vercel:**
```bash
# Ensure NEXTAUTH_URL matches your domain EXACTLY
NEXTAUTH_URL=https://aztec-recognizer-bpj8xxptt-gaymuseds-projects.vercel.app

# NO trailing slash!
# ❌ WRONG: https://example.com/
# ✅ RIGHT: https://example.com
```

**Fix in code (if needed):**
```typescript
// src/lib/auth.ts - Add these options if missing
export const authOptions: NextAuthOptions = {
  // ... existing config ...

  // Add these:
  useSecureCookies: process.env.NODE_ENV === "production",
  cookies: {
    sessionToken: {
      name: `__Secure-next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === "production",
      },
    },
  },
}
```

#### Solution B: Database Connection Issues

**Symptoms:**
- Can sign in but session doesn't persist
- User created but not found in subsequent requests

**Fix:**
1. Check Vercel logs for Prisma errors
2. Verify `DATABASE_URL` in Vercel environment variables
3. Ensure database is awake (Neon databases hibernate)

```bash
# Wake up database
npx prisma db push

# Or use the test script
npx tsx scripts/test-prisma.ts
```

#### Solution C: CORS/Domain Issues

**Symptom:** Works locally but not in Vercel

**Fix:**
```typescript
// next.config.ts
const nextConfig = {
  // Add this if missing
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Origin', value: process.env.NEXTAUTH_URL || '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,POST,PUT,DELETE,OPTIONS' },
        ],
      },
    ]
  },
}
```

---

## Issue 2: Vercel Signup Redirect Instead of Discord Auth

### What's Happening
When you click "Sign in with Discord", you're being redirected to Vercel's signup page instead of Discord OAuth.

### Root Cause
This happens when **environment variables are missing or incorrect** in Vercel deployment.

### Quick Diagnosis

Open your deployed app and check the browser console:
```javascript
// You'll see errors like:
// "Missing DISCORD_CLIENT_ID"
// "Invalid OAuth configuration"
```

### Solution: Fix Vercel Environment Variables

#### Step 1: Access Vercel Project Settings
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project: `aztec-recognizer`
3. Click **Settings** → **Environment Variables**

#### Step 2: Verify/Add Required Variables

Add these variables for **Production**, **Preview**, and **Development**:

```bash
# Discord OAuth (REQUIRED)
DISCORD_CLIENT_ID=1417182508377837709
DISCORD_CLIENT_SECRET=nK8OQ_cfj7YQnlKQA6D3P18QtVvEP9Ns

# NextAuth (REQUIRED)
NEXTAUTH_URL=https://aztec-recognizer-bpj8xxptt-gaymuseds-projects.vercel.app
NEXTAUTH_SECRET=IbWWHGcjal7v1G3RHT+Dm5cL2r3lWg14SXXjHbl5YoE=

# Database (REQUIRED)
DATABASE_URL=postgresql://neondb_owner:npg_U4XKHcaqnsf2@ep-holy-fire-ad2ggwfk-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require

# Testing (OPTIONAL - only for E2E tests)
AUTH_TEST_MODE=false
```

**⚠️ IMPORTANT:** These are the OLD exposed credentials. For production security, you should:
1. Create new Discord OAuth app
2. Generate new NEXTAUTH_SECRET
3. Rotate database password

But for testing, use the above values to get it working first.

#### Step 3: Check Variable Scope

Make sure each variable is set for:
- ✅ **Production** (main branch deployments)
- ✅ **Preview** (PR/branch deployments)
- ✅ **Development** (local development via `vercel dev`)

#### Step 4: Redeploy

After adding/updating variables:
```bash
# Option 1: Trigger redeploy in Vercel UI
# Go to Deployments → ... → Redeploy

# Option 2: Push a commit
git commit --allow-empty -m "Trigger redeploy with env vars"
git push

# Option 3: Vercel CLI
vercel --prod
```

#### Step 5: Verify Variables are Set

After deployment, check the build logs:
```
1. Go to Vercel Dashboard → Your Deployment
2. Click "Building" or "Deployment Summary"
3. Look for "Environment Variables" section
4. Verify all required vars are listed
```

### Why This Happens

**Missing DISCORD_CLIENT_ID or DISCORD_CLIENT_SECRET:**
```typescript
// In src/lib/auth.ts
DiscordProvider({
  clientId: process.env.DISCORD_CLIENT_ID!,  // undefined!
  clientSecret: process.env.DISCORD_CLIENT_SECRET!,  // undefined!
})
```

When these are undefined, NextAuth fails to initialize Discord provider, and the sign-in button might redirect incorrectly.

### Alternative: Check for Missing Env Vars

Add this safety check to your auth configuration:

```typescript
// src/lib/auth.ts
if (!process.env.DISCORD_CLIENT_ID || !process.env.DISCORD_CLIENT_SECRET) {
  throw new Error(
    'Missing Discord OAuth credentials. Set DISCORD_CLIENT_ID and DISCORD_CLIENT_SECRET in environment variables.'
  )
}

export const authOptions: NextAuthOptions = {
  // ... rest of config
}
```

This will show a clear error in Vercel logs if variables are missing.

---

## Issue 3: Database Connection in Vercel

### Symptom
- Auth works but user data doesn't persist
- "Database connection timeout" errors in logs

### Solution

#### Check 1: Neon Database is Awake
Neon free tier databases hibernate after inactivity.

**Wake it up:**
```bash
# Run this locally (it will wake the database)
npx prisma db push

# Or visit Neon dashboard and click "Wake"
```

#### Check 2: Connection String Format
Verify your `DATABASE_URL` has correct format:
```
postgresql://username:password@hostname:5432/database?sslmode=require&channel_binding=require
```

#### Check 3: Connection Pooling
For serverless (Vercel), use Neon's **pooled connection**:

```bash
# ❌ Direct connection (not recommended for serverless)
postgresql://user:pass@ep-xxx.neon.tech/db

# ✅ Pooled connection (recommended)
postgresql://user:pass@ep-xxx-pooler.neon.tech/db
```

Your current URL already has `-pooler` ✅

---

## Issue 4: Rate Limiting Blocks You

### Symptom
After multiple test attempts, you get:
```
"Rate limit exceeded. Try again in X seconds."
```

### Why It Happens
Our rate limiting implementation:
- **Nominations:** 10 per hour
- **Votes:** 50 per hour

### Solution

#### Option 1: Wait (Production Behavior)
This is working as intended. Wait for the time specified.

#### Option 2: Disable for Testing (Development Only)

```typescript
// src/lib/rate-limit.ts - Temporary for testing
export function checkRateLimit(userId: string, endpoint: keyof typeof RATE_LIMITS): void {
  // Disable rate limiting in development
  if (process.env.NODE_ENV === 'development') {
    return
  }

  // ... rest of rate limit logic
}
```

#### Option 3: Clear Rate Limit (Restart Server)
In-memory rate limiter resets when you restart:
```bash
# Local development
# Stop server (Ctrl+C) and restart
npm run dev

# Vercel (trigger redeploy)
```

---

## Debugging Checklist

Use this checklist to systematically diagnose issues:

### Environment Variables
- [ ] `DISCORD_CLIENT_ID` is set in Vercel
- [ ] `DISCORD_CLIENT_SECRET` is set in Vercel
- [ ] `NEXTAUTH_URL` matches deployment URL exactly
- [ ] `NEXTAUTH_SECRET` is set (32+ character string)
- [ ] `DATABASE_URL` is set with pooled connection
- [ ] All variables are set for Production, Preview, and Development

### Discord OAuth
- [ ] Redirect URI added in Discord Developer Portal
- [ ] Redirect URI matches: `{NEXTAUTH_URL}/api/auth/callback/discord`
- [ ] Discord app has `identify` and `email` scopes

### Database
- [ ] Database is awake (Neon)
- [ ] Connection string is correct
- [ ] Prisma schema is synced (`npx prisma db push`)
- [ ] Can connect from local machine

### Session/Auth
- [ ] Can successfully sign in with Discord
- [ ] Session persists after page refresh
- [ ] User data appears in database
- [ ] `/api/auth/session` returns user data

### Testing
- [ ] Cannot nominate yourself (expected behavior)
- [ ] Can nominate other users
- [ ] Can vote on nominations
- [ ] Pagination works (if > 20 nominations)

---

## Common Error Messages & Solutions

### "Unauthorized"
- **Check:** Are you logged in? Run `fetch('/api/auth/session')`
- **Fix:** Re-login with Discord

### "You cannot nominate yourself"
- **This is correct behavior** - working as intended
- You should not see yourself in the dropdown

### "Rate limit exceeded"
- **Check:** Have you made too many requests?
- **Fix:** Wait or disable rate limiting for testing

### "Invalid JSON payload"
- **Check:** Browser console for request payload
- **Fix:** Ensure you're sending valid JSON

### "Nominee not found"
- **Check:** Database has user records
- **Fix:** Ensure Discord login creates user in DB

### "You have already nominated this person"
- **Check:** Database for existing nomination
- **Fix:** This is correct behavior (duplicate prevention)

### "Database connection failed"
- **Check:** Vercel logs for Prisma errors
- **Fix:** Verify DATABASE_URL, wake Neon database

### Redirects to Vercel signup
- **Check:** Vercel environment variables
- **Fix:** Add DISCORD_CLIENT_ID and DISCORD_CLIENT_SECRET

---

## Getting Detailed Logs

### Browser Console
```javascript
// Enable verbose logging
localStorage.debug = 'next-auth:*'

// Then refresh and check console
```

### Vercel Logs
```bash
# Option 1: Vercel Dashboard
# Go to Deployments → Your Deployment → Runtime Logs

# Option 2: Vercel CLI
vercel logs
```

### Database Logs
Check Neon dashboard for:
- Connection attempts
- Query errors
- Hibernate/wake events

---

## Quick Test Script

Create this file to test your setup:

```typescript
// scripts/test-auth.ts
import { getServerAuthSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

async function testAuth() {
  console.log('Testing auth configuration...')

  // Test 1: Environment variables
  console.log('✓ DISCORD_CLIENT_ID:', process.env.DISCORD_CLIENT_ID ? 'Set' : 'Missing')
  console.log('✓ DISCORD_CLIENT_SECRET:', process.env.DISCORD_CLIENT_SECRET ? 'Set' : 'Missing')
  console.log('✓ NEXTAUTH_URL:', process.env.NEXTAUTH_URL)
  console.log('✓ NEXTAUTH_SECRET:', process.env.NEXTAUTH_SECRET ? 'Set' : 'Missing')
  console.log('✓ DATABASE_URL:', process.env.DATABASE_URL ? 'Set' : 'Missing')

  // Test 2: Database connection
  try {
    await prisma.$connect()
    console.log('✓ Database connection: Success')

    const userCount = await prisma.user.count()
    console.log(`✓ Users in database: ${userCount}`)
  } catch (error) {
    console.error('✗ Database connection: Failed', error)
  }
}

testAuth()
```

Run it:
```bash
npx tsx scripts/test-auth.ts
```

---

## Still Stuck?

If issues persist after following this guide:

1. **Check Vercel deployment logs** for specific errors
2. **Clear browser cache and cookies** completely
3. **Try incognito/private browsing** to rule out cookie issues
4. **Test with a different Discord account**
5. **Compare working local dev with broken production**

**Gather this info for debugging:**
- Vercel deployment URL
- Browser console errors (screenshot)
- Vercel runtime logs (last 50 lines)
- Output of test script above
