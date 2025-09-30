"use client"

import Link from "next/link"
import { signIn } from "next-auth/react"

export function SignInSection() {
  return (
    <div className="flex flex-col items-center gap-4 rounded-lg border border-zinc-200 bg-white p-8 text-center shadow-sm">
      <h1 className="text-2xl font-semibold">Recognize Aztec community members</h1>
      <p className="max-w-md text-sm text-zinc-600">
        Sign in with your Discord account to nominate community members and cast votes.
      </p>
      <div className="flex flex-col items-stretch gap-2 sm:flex-row">
        <button
          onClick={() => signIn("discord")}
          className="rounded bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-500"
        >
          Sign in with Discord
        </button>
        <Link
          href="/leaderboard"
          className="rounded border border-indigo-200 px-4 py-2 text-sm font-medium text-indigo-700 transition hover:bg-indigo-50"
        >
          View leaderboard
        </Link>
      </div>
    </div>
  )
}
