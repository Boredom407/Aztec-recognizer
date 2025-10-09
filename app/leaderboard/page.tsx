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
    <main className="min-h-screen px-4 py-10 md:py-14">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        <header className="card-base p-6 md:p-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white md:text-4xl flex items-center gap-3">
                <span className="text-lime-500">🏆</span>
                Community Leaderboard
              </h1>
              <p className="mt-2 text-sm text-slate-400">
                Ranked by a combination of nominations received and community votes.
              </p>
            </div>
            <Link
              href="/"
              className="btn-secondary flex items-center gap-2 whitespace-nowrap"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to home
            </Link>
          </div>
        </header>

        <LeaderboardTable
          entries={leaderboard.entries}
          page={leaderboard.page}
          pageSize={leaderboard.pageSize}
          totalNominees={leaderboard.totalNominees}
          totalPages={leaderboard.totalPages}
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
