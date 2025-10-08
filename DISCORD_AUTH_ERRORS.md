# Discord Authentication Errors - Debugging Guide

## Error: `/api/v9/auth/logout:1 Failed to load resource: 401`

### What This Means

This error occurs **on Discord's servers**, not in your application. Discord is attempting to log you out during the OAuth flow, which prevents successful authentication.

### Why This Happens

1. **Stale Discord Session**
   - You have an old/invalid Discord session in your browser
   - Discord's session expired but browser cache still has it

2. **Discord Security Measures**
   - Too many OAuth attempts in short time
   - Suspicious activity detected (IP changes, etc.)
   - Account requires additional verification

3. **Browser Cookie Issues**
   - Mixed HTTP/HTTPS cookies
   - Third-party cookies blocked
   - Browser extensions interfering

4. **Discord Account Status**
   - Email not verified
   - Phone verification required
   - Account temporarily restricted

## Solutions (Try in Order)

### Solution 1: Complete Fresh Start ⭐ RECOMMENDED

```bash
# Step 1: Clear EVERYTHING Discord-related
1. Open Discord.com and LOG OUT
2. Close ALL Discord tabs/windows
3. Clear browser data:
   - Chrome: Settings → Privacy → Clear browsing data
     ✅ Cookies and site data
     ✅ Cached images and files
     Time range: "All time"
     Sites: "discord.com"

   - Firefox: Settings → Privacy → Clear Data
     ✅ Cookies
     ✅ Cache

4. Close browser completely
5. Reopen browser
6. Go directly to your app (not Discord first)
7. Click "Sign in with Discord"
```

### Solution 2: Incognito/Private Mode

```bash
1. Open NEW incognito/private window (Ctrl+Shift+N / Cmd+Shift+N)
2. Go to: https://aztec-recognizer-ifu6joecl-gaymuseds-projects.vercel.app
3. Click "Sign in with Discord"
4. Complete Discord authorization
5. If successful, issue is browser cache/cookies
```

### Solution 3: Check Discord Account Health

```bash
1. Visit: https://discord.com
2. Log in directly (not via OAuth)
3. Check for any warnings/notices:
   - Verify email notification?
   - Add phone number?
   - Account verification required?
4. Complete any required verifications
5. Log out, wait 5 minutes
6. Try OAuth again
```

### Solution 4: Different Browser

```bash
# Test if it's browser-specific
1. Try Chrome if you were using Firefox
2. Try Firefox if you were using Chrome
3. Try Edge/Safari as alternative

# If it works in different browser:
# → Your original browser has conflicting settings/extensions
```

### Solution 5: Wait & Retry

```bash
# Discord may have rate-limited you
1. Wait 15-30 minutes
2. Don't attempt any OAuth during this time
3. Try again after waiting period
```

### Solution 6: Check Browser Settings

#### Chrome
```
1. Settings → Privacy and security → Cookies and other site data
2. Ensure: "Allow all cookies" or "Block third-party cookies"
3. If blocking third-party: Add exception for discord.com
4. Settings → Site Settings → JavaScript → Ensure Allowed
```

#### Firefox
```
1. Settings → Privacy & Security
2. Enhanced Tracking Protection: "Standard" (not Strict)
3. Cookies and Site Data: "Accept cookies and site data"
4. If using "Custom": Allow cookies for discord.com
```

## Advanced Debugging

### Check What Discord Sees

Open browser DevTools (F12) before clicking "Sign in":

```javascript
// 1. Open Console tab
// 2. Go to Network tab
// 3. Enable "Preserve log"
// 4. Click "Sign in with Discord"
// 5. Look for failed requests

// You'll see requests to:
// - /api/v9/oauth2/authorize (should succeed)
// - /api/v9/auth/logout (this one is failing with 401)
```

**If you see:**
- `logout` called before `authorize` completes → Discord session issue
- Multiple `authorize` attempts → You may be rate limited
- `401` on authorize → Credentials mismatch (check env vars)

### Verify Your OAuth Configuration

```javascript
// Run this in browser console on your app's homepage
fetch('/api/auth/providers')
  .then(r => r.json())
  .then(providers => {
    console.log('Available providers:', providers)
    // Should show Discord provider
  })
```

Expected output:
```json
{
  "discord": {
    "id": "discord",
    "name": "Discord",
    "type": "oauth",
    "signinUrl": "/api/auth/signin/discord",
    "callbackUrl": "/api/auth/callback/discord"
  }
}
```

### Check Environment Variables (Vercel)

```bash
# Make sure these are EXACTLY right in Vercel:

DISCORD_CLIENT_ID=1417182508377837709
# ✅ No quotes, no spaces

DISCORD_CLIENT_SECRET=nK8OQ_cfj7YQnlKQA6D3P18QtVvEP9Ns
# ✅ No quotes, no spaces

NEXTAUTH_URL=https://aztec-recognizer-ifu6joecl-gaymuseds-projects.vercel.app
# ✅ No trailing slash
# ✅ Must match deployment URL exactly

NEXTAUTH_SECRET=IbWWHGcjal7v1G3RHT+Dm5cL2r3lWg14SXXjHbl5YoE=
# ✅ At least 32 characters
```

After changing any env vars:
```bash
# MUST redeploy for changes to take effect
git commit --allow-empty -m "Redeploy with updated env vars"
git push
```

## Error-Specific Solutions

### "401 Unauthorized" on /api/v9/auth/logout

**Cause:** Discord session token is invalid/expired

**Fix:**
1. Clear Discord cookies completely
2. Don't log into Discord directly before OAuth
3. Let OAuth flow handle login from scratch

### "403 Forbidden" on Discord OAuth

**Cause:** Your IP or account is rate-limited

**Fix:**
1. Wait 30 minutes
2. Try from different network (mobile hotspot)
3. Check Discord Developer Portal for app status

### "400 Bad Request" with "redirect_uri_mismatch"

**Cause:** Redirect URI not registered in Discord app

**Fix:**
1. Go to: https://discord.com/developers/applications/1417182508377837709/oauth2
2. Add redirect URI: `https://aztec-recognizer-ifu6joecl-gaymuseds-projects.vercel.app/api/auth/callback/discord`
3. Save changes
4. Wait 1-2 minutes for Discord to propagate changes

### Session Not Persisting After Login

**Cause:** Cookie settings or database issue

**Fix:**
```bash
# Check if user was created in database
# Run locally:
cd aztec-recognize
npx prisma studio

# Look in User table - should see new user after successful login
# If user is NOT there → Database connection issue
```

## Verify Discord App Configuration

### Required Settings in Discord Developer Portal

1. **OAuth2 → Redirects**
   ```
   https://aztec-recognizer-ifu6joecl-gaymuseds-projects.vercel.app/api/auth/callback/discord

   # Also add (if testing locally):
   http://localhost:3000/api/auth/callback/discord
   ```

2. **OAuth2 → Scopes** (in your code, correct ✅)
   ```
   identify
   email
   ```

3. **Bot Settings** (not needed for OAuth)
   - You don't need a bot token
   - Bot settings don't affect user OAuth

4. **OAuth2 → Authorization Method**
   - Should be: "In-app Authorization" (default)
   - NOT "None"

## Common Misconceptions

### ❌ "I need to be logged into Discord first"
**No!** The OAuth flow will log you in. Being logged in separately can cause session conflicts.

### ❌ "I need to authorize the app in Discord settings"
**No!** First-time authorization happens via OAuth flow. You don't pre-authorize.

### ❌ "The app needs a Discord bot"
**No!** OAuth for user login is separate from Discord bots.

### ❌ "I need to wait after changing env vars"
**Yes!** You must redeploy after changing environment variables in Vercel.

## Testing OAuth Flow Manually

### Step-by-Step OAuth Test

```bash
# 1. Start fresh
- Clear all Discord cookies
- Close Discord tabs
- Use incognito window

# 2. Go to your app
https://aztec-recognizer-ifu6joecl-gaymuseds-projects.vercel.app

# 3. Open DevTools (F12) → Network tab

# 4. Click "Sign in with Discord"

# 5. Watch the network requests:

# Request 1: Your app → Discord
GET https://discord.com/api/oauth2/authorize?
  client_id=1417182508377837709
  &response_type=code
  &redirect_uri=https://aztec-recognizer...
  &scope=identify%20email
  &state=...

Expected: 200 OK → Discord login page

# Request 2: Discord login
POST https://discord.com/api/v9/auth/login
Expected: 200 OK → Redirects to authorization

# Request 3: User authorizes
POST https://discord.com/api/v9/oauth2/authorize
Expected: 302 Redirect → Back to your app

# Request 4: Callback to your app
GET https://aztec-recognizer.../api/auth/callback/discord?code=...
Expected: 302 Redirect → Your app homepage (now logged in)
```

**If it fails at Request 2 (login):**
→ Discord session issue (use Solution 1)

**If it fails at Request 3 (authorize):**
→ App configuration issue (check env vars)

**If it fails at Request 4 (callback):**
→ Your app's auth configuration issue

## Still Not Working?

### Collect Debug Information

```bash
# 1. Browser Console Errors
F12 → Console tab → Copy all red errors

# 2. Network Tab
F12 → Network tab → Filter: "auth" → Screenshot failed requests

# 3. Vercel Logs
Vercel Dashboard → Deployments → Latest → Runtime Logs

# 4. Test Script Output
cd aztec-recognize
npx tsx scripts/test-auth.ts
```

### What to Check

- [ ] Can you log into Discord.com directly?
- [ ] Is your Discord email verified?
- [ ] Have you tried incognito mode?
- [ ] Have you tried a different browser?
- [ ] Have you cleared all Discord cookies?
- [ ] Have you waited 30 minutes since last attempt?
- [ ] Are all env vars set in Vercel?
- [ ] Have you redeployed after setting env vars?
- [ ] Is the redirect URI added in Discord Developer Portal?
- [ ] Does the redirect URI exactly match NEXTAUTH_URL?

## Alternative: Use Different Auth Provider

If Discord OAuth continues to fail, you can add alternative providers:

```typescript
// src/lib/auth.ts
import GitHubProvider from "next-auth/providers/github"
import GoogleProvider from "next-auth/providers/google"

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    DiscordProvider({ /* ... */ }),

    // Add GitHub as backup
    GitHubProvider({
      clientId: process.env.GITHUB_ID!,
      clientSecret: process.env.GITHUB_SECRET!,
    }),

    // Or Google
    GoogleProvider({
      clientId: process.env.GOOGLE_ID!,
      clientSecret: process.env.GOOGLE_SECRET!,
    }),
  ],
}
```

But fix Discord first before adding more complexity!

## Success Indicators

You know it's working when:

1. ✅ Click "Sign in with Discord" → Discord authorization page
2. ✅ Click "Authorize" → Redirects back to your app
3. ✅ You see your Discord name/avatar in the app
4. ✅ Refresh page → Still logged in
5. ✅ User appears in database (check with `npx prisma studio`)
6. ✅ Can create nominations and vote

## Summary

**The 401 logout error means:**
- Your app is configured correctly ✅
- Discord is having session issues ❌
- Solution: Clear Discord cookies and start fresh

**Most common fix:** Complete fresh start (Solution 1)

**If nothing works:** Try different browser in incognito mode

The error is on Discord's side, not your application's configuration.
