import { type DefaultSession } from "next-auth"

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & {
      id: string
      discordId?: string | null
    }
  }

  interface User {
    discordId?: string | null
    points: number
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    discordId?: string | null
  }
}
