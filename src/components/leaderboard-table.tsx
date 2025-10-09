import Image from "next/image"
import Link from "next/link"

import type { LeaderboardEntry } from "@/lib/leaderboard"
import { LeaderboardPodium } from "./leaderboard-podium"

type LeaderboardTableProps = {
  entries: LeaderboardEntry[]
  page: number
  pageSize: number
  totalNominees: number
  totalPages?: number
}

export function LeaderboardTable({ entries, page, pageSize, totalNominees, totalPages }: LeaderboardTableProps) {
  if (entries.length === 0) {
    return (
      <div className="card-base p-12 text-center">
        <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-lime-500/20">
          <svg className="h-10 w-10 text-lime-400" fill="currentColor" viewBox="0 0 20 20">
            <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
          </svg>
        </div>
        <p className="text-xl font-semibold text-white">No members ranked yet</p>
        <p className="mt-2 text-sm text-slate-400">Be the first to nominate someone and start building the leaderboard!</p>
        <Link href="/?show=nominate" className="btn-primary mt-6 inline-block">
          Create First Nomination
        </Link>
      </div>
    )
  }

  // Show podium for top 3 on first page only
  const showPodium = page === 1 && entries.length >= 3
  const topThree = showPodium ? entries.slice(0, 3) : []
  const remaining = showPodium ? entries.slice(3) : entries

  return (
    <div className="space-y-8">
      {/* Podium for top 3 on first page */}
      {showPodium && <LeaderboardPodium topThree={topThree} />}

      {/* Rest of Leaderboard */}
      {remaining.length > 0 && (
        <div className="card-base overflow-hidden p-6">
          <div className="space-y-3">
            {remaining.map((entry, index) => {
              const rank = (page - 1) * pageSize + index + 1 + (showPodium ? 3 : 0)

              return (
                <div
                  key={entry.userId}
                  className="flex flex-col sm:flex-row items-start sm:items-center gap-4 rounded-lg bg-slate-900/30 p-4 transition-all hover:bg-lime-500/10"
                >
                  {/* Rank */}
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-slate-800 font-bold text-lime-400">
                    #{rank}
                  </div>

                  {/* Avatar */}
                  {entry.image ? (
                    <Image
                      src={entry.image}
                      alt={entry.name ?? "Community member"}
                      width={48}
                      height={48}
                      className="h-12 w-12 flex-shrink-0 rounded-full ring-2 ring-lime-500/30"
                    />
                  ) : (
                    <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-slate-700 font-semibold text-slate-300 ring-2 ring-lime-500/30">
                      {entry.name ? entry.name.slice(0, 1).toUpperCase() : "?"}
                    </div>
                  )}

                  {/* Name and Stats */}
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-white truncate">
                      {entry.name ?? "Unnamed member"}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-400">
                      <span>{entry.nominationCount} nominations</span>
                      <span>•</span>
                      <span>{entry.voteCount} votes</span>
                    </div>
                  </div>

                  {/* Recognition Points */}
                  <div className="text-left sm:text-right">
                    <div className="text-xs text-slate-400">Points</div>
                    <div className="text-xl font-bold text-lime-400">{entry.recognitionPoints}</div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Pagination and Footer */}
      <div className="card-base overflow-hidden">
        {/* Pagination Controls */}
        {totalPages && totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 border-b border-lime-500/20 p-4">
            {page > 1 ? (
              <Link
                href={`/leaderboard?page=${page - 1}&pageSize=${pageSize}`}
                className="flex items-center gap-2 rounded-lg border-2 border-lime-500/50 bg-transparent px-4 py-2 font-semibold text-lime-400 transition-all hover:border-lime-500 hover:bg-lime-500/10"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Previous
              </Link>
            ) : (
              <div className="w-24"></div>
            )}

            <span className="px-4 text-sm text-slate-400">
              Page {page} of {totalPages}
            </span>

            {page < totalPages ? (
              <Link
                href={`/leaderboard?page=${page + 1}&pageSize=${pageSize}`}
                className="flex items-center gap-2 rounded-lg border-2 border-lime-500/50 bg-transparent px-4 py-2 font-semibold text-lime-400 transition-all hover:border-lime-500 hover:bg-lime-500/10"
              >
                Next
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            ) : (
              <div className="w-24"></div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex flex-col items-center justify-between gap-3 p-4 sm:flex-row">
          <span className="text-sm text-slate-400">
            Showing {entries.length} of {totalNominees} recognized members
          </span>
          <Link
            href="/?show=nominate"
            className="rounded-lg border-2 border-lime-500/50 bg-transparent px-4 py-2 text-sm font-semibold text-lime-400 transition-all hover:border-lime-500 hover:bg-lime-500/10"
          >
            Nominate someone
          </Link>
        </div>
      </div>
    </div>
  )
}
