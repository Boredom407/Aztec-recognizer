# Discord OAuth Setup Guide

## Why Create a New App?

The previous Discord OAuth credentials were exposed in the repository. For security, you should create a new Discord application.

## Step-by-Step Setup

### 1. Create New Discord Application

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Click **New Application**
3. Name: `Aztec Recognizer` (or your preferred name)
4. Click **Create**

### 2. Configure OAuth2 Settings

1. In your new application, go to **OAuth2** → **General**
2. Copy your **Client ID** and **Client Secret**
3. Click **OAuth2** → **Redirects**
4. Add redirect URIs:
   ```
   # For local development
   http://localhost:3000/api/auth/callback/discord

   # For Vercel deployment (replace with your actual URL)
   https://your-app.vercel.app/api/auth/callback/discord

   # If using preview deployments
   https://aztec-recognizer-bpj8xxptt-gaymuseds-projects.vercel.app/api/auth/callback/discord
   ```
5. Click **Save Changes**

### 3. Update Environment Variables

#### Local Development (.env)

```bash
# Discord OAuth (NEW - replace with your values)
DISCORD_CLIENT_ID="your-new-client-id"
DISCORD_CLIENT_SECRET="your-new-client-secret"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="generate-new-secret-see-below"

# Database (get from Neon dashboard)
DATABASE_URL="postgresql://user:password@host/database?sslmode=require"
```

#### Vercel Production

1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add/Update:
   ```
   DISCORD_CLIENT_ID = your-new-client-id
   DISCORD_CLIENT_SECRET = your-new-client-secret
   NEXTAUTH_URL = https://your-production-domain.com
   NEXTAUTH_SECRET = your-generated-secret
   DATABASE_URL = your-production-database-url
   ```

### 4. Generate New NextAuth Secret

```bash
# On macOS/Linux
openssl rand -base64 32

# On Windows (PowerShell)
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))

# Or use Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### 5. Redeploy Your Application

```bash
# If using Vercel CLI
vercel --prod

# Or trigger redeploy in Vercel Dashboard
```

## Troubleshooting Common Errors

### Error: "redirect_uri_mismatch"

**Cause:** The redirect URI in your request doesn't match any registered URIs in Discord.

**Fix:**
1. Check your `NEXTAUTH_URL` environment variable
2. Verify redirect URIs in Discord Developer Portal
3. Make sure URLs exactly match (including protocol: `http://` vs `https://`)

### Error: "invalid_client"

**Cause:** Client ID or Client Secret is incorrect.

**Fix:**
1. Double-check credentials from Discord Developer Portal
2. Verify no extra spaces in environment variables
3. Redeploy after updating

### Error: "access_denied"

**Cause:** User cancelled authorization or insufficient permissions.

**Fix:**
1. Verify your Discord app has `identify` and `email` scopes
2. Check if the user's Discord account can access your app

## Multiple Environment Setup

If you need different Discord apps for dev/staging/prod:

### Development Discord App
- **Name:** `Aztec Recognizer (Dev)`
- **Redirect:** `http://localhost:3000/api/auth/callback/discord`

### Production Discord App
- **Name:** `Aztec Recognizer`
- **Redirect:** `https://aztec-recognizer.com/api/auth/callback/discord`

Store credentials accordingly:
```bash
# .env.local (development)
DISCORD_CLIENT_ID="dev-client-id"
DISCORD_CLIENT_SECRET="dev-client-secret"

# Vercel (production)
DISCORD_CLIENT_ID="prod-client-id"
DISCORD_CLIENT_SECRET="prod-client-secret"
```

## Security Best Practices

1. ✅ **Never commit** `.env` file to git
2. ✅ **Rotate credentials** if exposed
3. ✅ **Use different apps** for dev/prod
4. ✅ **Restrict redirect URIs** to known domains only
5. ✅ **Regenerate NEXTAUTH_SECRET** regularly

## Verification Checklist

After setup, verify:

- [ ] Discord app created with new credentials
- [ ] All redirect URIs added in Discord Developer Portal
- [ ] Environment variables updated locally (`.env`)
- [ ] Environment variables updated in Vercel
- [ ] `NEXTAUTH_SECRET` generated and set
- [ ] Application redeployed
- [ ] Can successfully sign in with Discord
- [ ] User data appears in database

## Quick Fix for Current Error

**Your immediate issue:**

The Discord app with ID `1417182508377837709` needs this redirect URI added:
```
https://aztec-recognizer-bpj8xxptt-gaymuseds-projects.vercel.app/api/auth/callback/discord
```

**Steps:**
1. Go to https://discord.com/developers/applications/1417182508377837709/oauth2
2. Add the redirect URI above
3. Save changes
4. Try signing in again

**However,** since this client ID was exposed in your git history, I recommend creating a new Discord app for production security.

## Testing Your Setup

```bash
# 1. Clear browser cookies/cache
# 2. Visit your app
# 3. Click "Sign in with Discord"
# 4. Check browser console for errors
# 5. Verify redirect to Discord OAuth page
# 6. Authorize and verify redirect back to app
```

If issues persist, check:
- Browser Developer Tools → Network tab
- Vercel deployment logs
- Database connection (run `npx prisma db push` to verify)

## Additional Resources

- [NextAuth.js Discord Provider Docs](https://next-auth.js.org/providers/discord)
- [Discord OAuth2 Documentation](https://discord.com/developers/docs/topics/oauth2)
- [NextAuth.js Configuration](https://next-auth.js.org/configuration/options)
