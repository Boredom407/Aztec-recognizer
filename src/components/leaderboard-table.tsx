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
      <div className="card-base p-8 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-lime-500/10">
          <svg className="h-8 w-8 text-lime-500" fill="currentColor" viewBox="0 0 20 20">
            <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
          </svg>
        </div>
        <p className="text-lg font-medium text-white">
          No nominations yet
        </p>
        <p className="mt-1 text-sm text-slate-400">
          Encourage the community to celebrate one another.
        </p>
        <div className="mt-6 flex justify-center">
          <Link
            href="/"
            className="btn-primary"
          >
            Start Nominating →
          </Link>
        </div>
      </div>
    )
  }

  // Show podium for top 3 on first page only
  const showPodium = page === 1 && entries.length >= 3
  const topThree = showPodium ? entries.slice(0, 3) : []
  const remaining = showPodium ? entries.slice(3) : entries

  return (
    <div className="space-y-6">
      {/* Podium for top 3 on first page */}
      {showPodium && <LeaderboardPodium topThree={topThree} />}

      <div className="card-base overflow-hidden">
        <table className="min-w-full divide-y divide-slate-700/50">
          <thead className="bg-slate-800/70">
            <tr>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-400">
                Rank
              </th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-400">
                Member
              </th>
              <th scope="col" className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-slate-400">
                Nominations
              </th>
              <th scope="col" className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-slate-400">
                Votes
              </th>
              <th scope="col" className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-slate-400">
                Recognition points
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700/30">
            {remaining.map((entry, index) => {
              const rank = (page - 1) * pageSize + index + 1 + (showPodium ? 3 : 0)

              return (
                <tr key={entry.userId} className="hover:bg-lime-500/5 transition-colors">
                  <td className="px-4 py-4 text-sm font-semibold text-slate-300">#{rank}</td>
                  <td className="px-4 py-4 text-sm">
                    <div className="flex items-center gap-3">
                      {entry.image ? (
                        <Image
                          src={entry.image}
                          alt={entry.name ?? "Community member"}
                          width={36}
                          height={36}
                          className="h-9 w-9 rounded-full object-cover ring-2 ring-slate-600"
                        />
                      ) : (
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-700 text-sm font-semibold text-slate-300 ring-2 ring-slate-600">
                          {entry.name ? entry.name.slice(0, 1).toUpperCase() : "?"}
                        </div>
                      )}
                      <div>
                        <div className="font-semibold text-white">
                          {entry.name ?? "Unnamed member"}
                        </div>
                        <div className="text-xs text-slate-500">Total recognitions: {entry.recognitionPoints}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-right text-sm text-slate-300">{entry.nominationCount}</td>
                  <td className="px-4 py-4 text-right text-sm text-slate-300">{entry.voteCount}</td>
                  <td className="px-4 py-4 text-right text-sm font-semibold text-lime-500">
                    {entry.recognitionPoints}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>

        <div className="border-t border-slate-700/50 bg-slate-800/50">
          {/* Pagination Controls */}
          {totalPages && totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 border-b border-slate-700/30 px-4 py-3">
              {page > 1 && (
                <Link
                  href={`/leaderboard?page=${page - 1}&pageSize=${pageSize}`}
                  className="rounded-lg border border-lime-500/30 bg-lime-500/10 px-4 py-2 text-sm font-medium text-lime-400 transition hover:bg-lime-500/20 hover:border-lime-500/50 flex items-center gap-2"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Previous
                </Link>
              )}
              <span className="text-sm text-slate-400 px-4">
                Page {page} of {totalPages}
              </span>
              {page < totalPages && (
                <Link
                  href={`/leaderboard?page=${page + 1}&pageSize=${pageSize}`}
                  className="rounded-lg border border-lime-500/30 bg-lime-500/10 px-4 py-2 text-sm font-medium text-lime-400 transition hover:bg-lime-500/20 hover:border-lime-500/50 flex items-center gap-2"
                >
                  Next
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              )}
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between px-4 py-3 text-sm">
            <span className="text-slate-400">
              Showing {remaining.length} of {totalNominees} recognized members
            </span>
            <Link
              href="/?show=nominate"
              className="rounded-lg border border-lime-500/30 bg-lime-500/10 px-3 py-1.5 text-sm font-medium text-lime-400 transition hover:bg-lime-500/20 hover:border-lime-500/50"
            >
              Nominate someone
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
