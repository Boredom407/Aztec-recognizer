import Link from "next/link"

import { LeaderboardTable } from "@/components/leaderboard-table"
import { fetchLeaderboard } from "@/lib/leaderboard"

type LeaderboardPageProps = {
  searchParams?: {
    page?: string
    pageSize?: string
  }
}

export default async function LeaderboardPage({ searchParams }: LeaderboardPageProps) {
  const page = parseOptionalNumber(searchParams?.page)
  const pageSize = parseOptionalNumber(searchParams?.pageSize)
  const leaderboard = await fetchLeaderboard({ page, pageSize })

  return (
    <main className="min-h-screen bg-zinc-100 py-10">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4">
        <header className="flex flex-col gap-4 rounded-lg border border-zinc-200 bg-white p-6 shadow-sm md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-zinc-900">Community leaderboard</h1>
            <p className="mt-1 text-sm text-zinc-600">
              Ranked by a combination of nominations received and community votes.
            </p>
          </div>
          <Link
            href="/"
            className="rounded border border-indigo-200 px-4 py-2 text-sm font-medium text-indigo-700 transition hover:bg-indigo-50"
          >
            Back to home
          </Link>
        </header>

        <LeaderboardTable
          entries={leaderboard.entries}
          page={leaderboard.page}
          pageSize={leaderboard.pageSize}
          totalNominees={leaderboard.totalNominees}
        />
      </div>
    </main>
  )
}

function parseOptionalNumber(value?: string) {
  if (!value) {
    return undefined
  }

  const parsed = Number(value)

  if (Number.isNaN(parsed) || !Number.isFinite(parsed)) {
    return undefined
  }

  return parsed
}
