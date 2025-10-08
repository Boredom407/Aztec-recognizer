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
  session: {
    strategy: "database", // Use database sessions with Prisma adapter
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // 24 hours
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
  callbacks: {
    async session({ session, user }) {
      // With database strategy, user object is available (not token)
      if (session.user && user) {
        session.user.id = user.id
        session.user.discordId = user.discordId
      }
      return session
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
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
