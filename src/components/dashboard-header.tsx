import Link from "next/link"
import { signOut } from "next-auth/react"

export function DashboardHeader({ name }: { name: string | null }) {
  return (
    <header className="card-base p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-lime-400">Signed in as</p>
          <h2 className="text-2xl font-bold text-white">{name ?? "Aztec member"}</h2>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-sm font-semibold">
          <Link
            href="/leaderboard"
            className="btn-secondary flex items-center gap-2"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            View Leaderboard
          </Link>
          <button
            onClick={() => signOut()}
            className="rounded-lg border-2 border-red-500/50 bg-transparent px-4 py-2 text-red-400 transition-all hover:border-red-500 hover:bg-red-500/10"
          >
            Sign out
          </button>
        </div>
      </div>
    </header>
  )
}
