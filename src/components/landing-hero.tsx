"use client"

import Link from "next/link"
import { signIn } from "next-auth/react"

async function handleDiscordSignIn() {
  try {
    const result = await signIn("discord", { callbackUrl: "/" })
    if (result?.error) {
      console.error("Discord sign-in failed", result.error)
    }
  } catch (error) {
    console.error("Discord sign-in threw", error)
  }
}

export function LandingHero() {
  return (
    <div className="flex flex-col items-center text-center">
      <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
        Recognize <span className="text-yellow-400">Aztec</span> community members
      </h1>
      <p className="mt-4 max-w-xl text-lg text-white/80">
        Sign in with your Discord account to nominate community members and cast votes.
      </p>
      <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row">
        <button
          onClick={handleDiscordSignIn}
          className="rounded-lg bg-white px-6 py-2 font-semibold text-brandDark shadow transition hover:bg-gray-100"
        >
          Sign in with Discord
        </button>
        <Link
          href="/leaderboard"
          className="rounded-lg bg-yellow-500 px-6 py-2 font-semibold text-white shadow transition hover:bg-yellow-600"
        >
          View Leaderboard
        </Link>
      </div>
    </div>
  )
}
