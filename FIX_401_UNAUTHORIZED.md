# Fix: 401 Unauthorized on Nomination Submit

## The Problem

Users can see the nomination form (appears logged in) but get **401 Unauthorized** when submitting a nomination.

**Error:**
```
POST /api/nominations
Status: 401 Unauthorized
```

## Root Cause

This happens when the **session cookie** is not being sent with the API request, or the session has expired.

**Possible causes:**
1. Session cookies not being set correctly
2. Cookie sameSite settings blocking session
3. NEXTAUTH_URL mismatch between page and API
4. Session expired but UI didn't refresh
5. NextAuth configuration issue

---

## Quick Diagnosis

### Step 1: Check if User is Actually Logged In

Open browser console (F12) on your app and run:

```javascript
// Check session
fetch('/api/auth/session')
  .then(r => r.json())
  .then(data => {
    console.log('Session:', data)
    if (data.user) {
      console.log('✅ Logged in as:', data.user.name)
    } else {
      console.log('❌ NOT logged in!')
    }
  })
```

**Expected output if logged in:**
```json
{
  "user": {
    "id": "some-id",
    "name": "Username",
    "email": "user@example.com"
  },
  "expires": "2025-..."
}
```

**If you see `null` or `{}`:**
→ User is NOT actually logged in, even though UI shows they are

### Step 2: Check Cookies

In Chrome DevTools:
1. Press F12 → Application tab
2. Left sidebar → Cookies → Your site URL
3. Look for NextAuth cookies:
   - `next-auth.session-token` (or `__Secure-next-auth.session-token`)
   - `next-auth.csrf-token`

**If cookies are missing:**
→ Session cookies not being set

**If cookies exist but API returns 401:**
→ Cookies not being sent with requests

---

## Solutions

### Solution 1: Fix Cookie Settings for Vercel

The issue is likely **cookie security settings** for HTTPS deployments.

Update your auth configuration:

```typescript
// src/lib/auth.ts
import { getServerSession, type NextAuthOptions } from "next-auth"
import DiscordProvider from "next-auth/providers/discord"
import { PrismaAdapter } from "@next-auth/prisma-adapter"
import { prisma } from "@/lib/prisma"

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    DiscordProvider({
      clientId: process.env.DISCORD_CLIENT_ID!,
      clientSecret: process.env.DISCORD_CLIENT_SECRET!,
      profile(profile) {
        const image = profile.avatar
          ? "https://cdn.discordapp.com/avatars/" + profile.id + "/" + profile.avatar + ".png"
          : "https://cdn.discordapp.com/embed/avatars/" + (Number(profile.discriminator ?? 0) % 5) + ".png"

        return {
          id: profile.id,
          name: profile.global_name ?? profile.username,
          email: profile.email,
          image,
          discordId: profile.id,
          points: 0,
        }
      },
    }),
  ],

  // ⭐ ADD THESE COOKIE SETTINGS
  cookies: {
    sessionToken: {
      name: process.env.NODE_ENV === 'production'
        ? '__Secure-next-auth.session-token'
        : 'next-auth.session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
  },

  // ⭐ ADD SESSION CONFIGURATION
  session: {
    strategy: "database", // Using Prisma adapter
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // 24 hours
  },

  callbacks: {
    async session({ session, token, user }) {
      if (!session.user) {
        return session
      }

      // When using database sessions, user is available
      if (user) {
        session.user.id = user.id
        session.user.discordId = user.discordId
      }
      // When using JWT sessions, token is available
      else if (token?.id) {
        session.user.id = token.id as string
        session.user.discordId = token.discordId as string | undefined
      }

      return session
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.discordId = user.discordId ?? undefined
      }
      return token
    },
  },

  secret: process.env.NEXTAUTH_SECRET,

  // ⭐ ADD PAGES CONFIGURATION (optional but recommended)
  pages: {
    signIn: '/',
    error: '/',
  },

  // ⭐ ADD DEBUG LOGGING (temporary, for troubleshooting)
  debug: process.env.NODE_ENV === 'development',
}

export async function getServerAuthSession() {
  if (process.env.AUTH_TEST_MODE === "true") {
    const testUserRaw = process.env.AUTH_TEST_USER

    if (testUserRaw) {
      try {
        const parsed = JSON.parse(testUserRaw)
        if (parsed && typeof parsed.id === "string") {
          return { user: parsed }
        }
      } catch (error) {
        console.warn("Failed to parse AUTH_TEST_USER", error)
      }
    }

    return {
      user: {
        id: "test-user",
        name: "Test User",
        email: "test@example.com",
      },
    }
  }

  return getServerSession(authOptions)
}
```

**Key changes:**
1. **Cookie settings** - Proper `sameSite` and `secure` flags
2. **Session strategy** - Explicitly set to "database" (since you use Prisma)
3. **Callback fix** - Handle both database and JWT sessions properly
4. **Debug mode** - Enable logging in development

### Solution 2: Verify NEXTAUTH_URL is Correct

The `NEXTAUTH_URL` must **exactly match** your deployment URL.

**Check in Vercel:**
```
Settings → Environment Variables → NEXTAUTH_URL
```

**Must be:**
```
https://aztec-recognizer.vercel.app
```

**NOT:**
```
https://aztec-recognizer.vercel.app/    ❌ (trailing slash)
http://aztec-recognizer.vercel.app      ❌ (http instead of https)
https://aztec-recognizer-abc123.vercel.app  ❌ (preview URL)
```

**Fix:**
1. Update `NEXTAUTH_URL` in Vercel to match your production domain exactly
2. Redeploy
3. Test again

### Solution 3: Check Database Sessions

If using database sessions (with Prisma adapter), verify sessions are being created:

```bash
# Locally, run:
cd aztec-recognize
npx prisma studio

# Open the Session table
# After logging in, you should see a session record with:
# - sessionToken (unique token)
# - userId (your user ID)
# - expires (future date)
```

**If no session appears after login:**
→ Database connection issue or Prisma adapter not working

**Fix:**
```bash
# Verify database connection
npx prisma db push

# Check Vercel logs for Prisma errors
# Vercel Dashboard → Deployments → Latest → Runtime Logs
```

### Solution 4: Force Session Refresh

Sometimes the UI shows logged in but session is stale.

Add a session refresh mechanism:

```typescript
// src/components/nomination-dashboard.tsx

// Add this useEffect at the top of the component
import { useEffect } from 'react'

export function NominationDashboard({ ... }) {
  // ... existing state ...

  // Add session check on mount
  useEffect(() => {
    async function checkSession() {
      const response = await fetch('/api/auth/session')
      const session = await response.json()

      if (!session?.user) {
        console.error('Session expired or invalid')
        // Redirect to sign in
        window.location.href = '/api/auth/signin'
      }
    }

    checkSession()
  }, [])

  // ... rest of component ...
}
```

### Solution 5: Check for CORS Issues

If cookies are blocked by CORS, sessions won't work.

**Verify in browser console:**
```javascript
// Should NOT see CORS errors
// If you do, it means your API and pages are on different origins
```

**Fix (if needed):**
```typescript
// next.config.ts
import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: [
          { key: "Access-Control-Allow-Credentials", value: "true" },
          {
            key: "Access-Control-Allow-Origin",
            value: process.env.NEXTAUTH_URL || "*"
          },
          {
            key: "Access-Control-Allow-Methods",
            value: "GET,DELETE,PATCH,POST,PUT"
          },
          {
            key: "Access-Control-Allow-Headers",
            value: "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version",
          },
        ],
      },
    ]
  },
}

export default nextConfig
```

---

## Testing After Fixes

### Test 1: Fresh Login
```bash
1. Clear all site data (Chrome: DevTools → Application → Clear storage)
2. Refresh page
3. Sign in with Discord
4. Check if session cookie is set (DevTools → Application → Cookies)
5. Try submitting a nomination
```

### Test 2: Session Persistence
```bash
1. Sign in
2. Refresh page
3. Should still be logged in
4. Check session: fetch('/api/auth/session').then(r => r.json()).then(console.log)
5. Should return user data
```

### Test 3: API Authentication
```bash
1. While logged in, run in console:

   fetch('/api/nominations', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({ nomineeId: 'test', reason: 'test' })
   }).then(r => console.log(r.status))

2. Should return 400 (self-nomination error) NOT 401
3. If you get 401, session is not being sent
```

---

## Common Causes & Fixes

### Cause: Using Preview URL but NEXTAUTH_URL is Production

**Symptom:**
- Logged in on preview deployment
- Submit nomination → 401

**Fix:**
Set `NEXTAUTH_URL` for Preview environment:
```
NEXTAUTH_URL=${VERCEL_URL}
```

Or add the specific preview URL to the Preview environment variables.

### Cause: Database Session Not Created

**Symptom:**
- Login succeeds
- Redirects to homepage
- But API calls get 401

**Fix:**
Check Vercel logs for database errors:
```bash
# Look for errors like:
# "Can't reach database server"
# "Connection timeout"
# "Invalid DATABASE_URL"
```

Fix DATABASE_URL and redeploy.

### Cause: Session Strategy Mismatch

**Symptom:**
- Sometimes works, sometimes doesn't
- Inconsistent 401 errors

**Fix:**
Explicitly set session strategy in `authOptions`:
```typescript
session: {
  strategy: "database", // Use "jwt" if not using Prisma adapter
}
```

### Cause: Multiple Tabs/Windows

**Symptom:**
- Works in one tab
- 401 in another tab

**Fix:**
This might indicate session strategy is "jwt" but token isn't refreshing. Switch to database strategy or ensure JWT refresh works.

---

## Debug Checklist

Run through this checklist:

- [ ] `fetch('/api/auth/session')` returns user data
- [ ] Session cookies exist in Application → Cookies
- [ ] `NEXTAUTH_URL` matches current deployment URL exactly
- [ ] Database has Session record after login
- [ ] `DATABASE_URL` is correct in Vercel
- [ ] No CORS errors in console
- [ ] NextAuth secret is set and matches
- [ ] Redeployed after changing auth configuration
- [ ] Tried in incognito mode (rules out extension issues)
- [ ] Cleared site data and logged in fresh

---

## Advanced Debugging

### Enable NextAuth Debug Mode

```typescript
// src/lib/auth.ts
export const authOptions: NextAuthOptions = {
  // ... config ...
  debug: true, // Enable detailed logging
}
```

Then check Vercel logs:
```
Vercel Dashboard → Deployments → Latest → Runtime Logs
```

Look for:
- Session creation logs
- JWT token logs
- Database query logs
- Authentication errors

### Check Session in Server Component

Add logging to your homepage:

```typescript
// app/page.tsx
export default async function HomePage({ searchParams }: HomePageProps) {
  const session = await getServerAuthSession()

  // Temporary debug logging
  console.log('Server session:', session)

  if (!session?.user) {
    // ...
  }

  // ...
}
```

Check Vercel logs to see if server sees the session.

### Network Tab Analysis

1. Open DevTools → Network tab
2. Submit a nomination
3. Find the `/api/nominations` request
4. Check **Request Headers** section
5. Look for `Cookie:` header

**Should contain:**
```
Cookie: next-auth.session-token=xxx; next-auth.csrf-token=xxx
```

**If Cookie header is missing:**
→ Cookies are being blocked or not set

---

## Quick Fix (Try This First)

The most common fix for this issue:

```typescript
// src/lib/auth.ts
// Add these two configurations:

export const authOptions: NextAuthOptions = {
  // ... existing config ...

  session: {
    strategy: "database",
  },

  cookies: {
    sessionToken: {
      name: process.env.NODE_ENV === 'production'
        ? '__Secure-next-auth.session-token'
        : 'next-auth.session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
  },

  // ... rest of config ...
}
```

Then redeploy and test.

---

## If Nothing Works

### Last Resort: Switch to JWT Sessions

If database sessions keep failing, try JWT:

```typescript
// src/lib/auth.ts
export const authOptions: NextAuthOptions = {
  // Remove or comment out adapter
  // adapter: PrismaAdapter(prisma),

  session: {
    strategy: "jwt", // Use JWT instead of database
    maxAge: 30 * 24 * 60 * 60,
  },

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.discordId = user.discordId
      }
      return token
    },
    async session({ session, token }) {
      if (session.user && token) {
        session.user.id = token.id as string
        session.user.discordId = token.discordId as string | undefined
      }
      return session
    },
  },

  // ... rest of config ...
}
```

**Note:** With JWT, you lose some features but sessions are more reliable.

---

## Summary

**Most likely cause:** Cookie settings not configured for production HTTPS

**Quick fix:**
1. Add `cookies` and `session` config to `authOptions`
2. Verify `NEXTAUTH_URL` is correct
3. Redeploy
4. Test

**If still broken:** Check database connection and session creation

**Debug with:**
```javascript
fetch('/api/auth/session').then(r => r.json()).then(console.log)
```

Should return user data. If `null`, session isn't working.
