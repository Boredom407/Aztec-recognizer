import Link from "next/link"
import { signOut } from "next-auth/react"

export function DashboardHeader({ name }: { name: string | null }) {
  return (
    <header className="flex flex-col gap-2 rounded-xl border border-white/10 bg-white/10 p-6 text-white shadow-inner shadow-white/10 backdrop-blur md:flex-row md:items-center md:justify-between">
      <div>
        <p className="text-sm uppercase tracking-wide text-white/60">Signed in as</p>
        <h2 className="text-2xl font-semibold">{name ?? "Aztec member"}</h2>
      </div>
      <div className="flex flex-wrap items-center gap-3 text-sm font-medium">
        <Link
          href="/leaderboard"
          className="rounded-lg border border-white/30 px-4 py-2 transition hover:bg-white/20"
        >
          View Leaderboard
        </Link>
        <button
          onClick={() => signOut()}
          className="rounded-lg bg-white px-4 py-2 text-brandDark transition hover:bg-white/90"
        >
          Sign out
        </button>
      </div>
    </header>
  )
}
