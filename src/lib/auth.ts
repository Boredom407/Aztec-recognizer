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
  callbacks: {
    async session({ session, token }) {
      if (!session.user) {
        return session
      }

      if (typeof token?.id === "string") {
        session.user.id = token.id
      }

      if (typeof token?.discordId === "string") {
        session.user.discordId = token.discordId
      } else {
        session.user.discordId = undefined
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
