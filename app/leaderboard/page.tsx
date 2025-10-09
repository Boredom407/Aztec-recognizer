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
    <main className="min-h-screen px-4 py-8 md:py-12">
      <div className="mx-auto w-full max-w-6xl">
        {/* Header */}
        <div className="card-base mb-8 p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="flex items-center gap-3 text-3xl font-bold text-white md:text-4xl">
                <span className="text-lime-400">🏆</span>
                Community Leaderboard
              </h1>
              <p className="mt-2 text-sm text-slate-400 md:text-base">
                Ranked by nominations received and community votes
              </p>
            </div>
            <Link
              href="/"
              className="btn-secondary flex items-center justify-center gap-2 whitespace-nowrap"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to home
            </Link>
          </div>
        </div>

        {/* Leaderboard Content */}
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
