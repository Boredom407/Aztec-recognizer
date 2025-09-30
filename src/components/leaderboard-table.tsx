import Image from "next/image"
import Link from "next/link"

import type { LeaderboardEntry } from "@/lib/leaderboard"

type LeaderboardTableProps = {
  entries: LeaderboardEntry[]
  page: number
  pageSize: number
  totalNominees: number
}

export function LeaderboardTable({ entries, page, pageSize, totalNominees }: LeaderboardTableProps) {
  if (entries.length === 0) {
    return (
      <div className="rounded-lg border border-zinc-200 bg-white p-6 text-center shadow-sm">
        <p className="text-sm text-zinc-600">
          No nominations yet. Encourage the community to celebrate one another.
        </p>
        <div className="mt-4 flex justify-center">
          <Link
            href="/"
            className="rounded border border-indigo-200 px-4 py-2 text-sm font-medium text-indigo-700 transition hover:bg-indigo-50"
          >
            Back to nominations
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm">
      <table className="min-w-full divide-y divide-zinc-200">
        <thead className="bg-zinc-50">
          <tr>
            <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-zinc-500">
              Rank
            </th>
            <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-zinc-500">
              Member
            </th>
            <th scope="col" className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-zinc-500">
              Nominations
            </th>
            <th scope="col" className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-zinc-500">
              Votes
            </th>
            <th scope="col" className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-zinc-500">
              Recognition points
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100 bg-white">
          {entries.map((entry, index) => {
            const rank = (page - 1) * pageSize + index + 1

            return (
              <tr key={entry.userId} className="hover:bg-indigo-50/50">
                <td className="px-4 py-4 text-sm font-semibold text-zinc-700">#{rank}</td>
                <td className="px-4 py-4 text-sm text-zinc-800">
                  <div className="flex items-center gap-3">
                    {entry.image ? (
                      <Image
                        src={entry.image}
                        alt={entry.name ?? "Community member"}
                        width={36}
                        height={36}
                        className="h-9 w-9 rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-100 text-sm font-semibold text-indigo-700">
                        {entry.name ? entry.name.slice(0, 1).toUpperCase() : "?"}
                      </div>
                    )}
                    <div>
                      <div className="font-semibold text-zinc-900">
                        {entry.name ?? "Unnamed member"}
                      </div>
                      <div className="text-xs text-zinc-500">Total recognitions: {entry.recognitionPoints}</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-4 text-right text-sm text-zinc-700">{entry.nominationCount}</td>
                <td className="px-4 py-4 text-right text-sm text-zinc-700">{entry.voteCount}</td>
                <td className="px-4 py-4 text-right text-sm font-semibold text-indigo-700">
                  {entry.recognitionPoints}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>

      <div className="flex items-center justify-between border-t border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-600">
        <span>
          Showing {entries.length} of {totalNominees} recognized members
        </span>
        <Link
          href="/?show=nominate"
          className="rounded border border-indigo-200 px-3 py-1.5 text-sm font-medium text-indigo-700 transition hover:bg-indigo-50"
        >
          Nominate someone
        </Link>
      </div>
    </div>
  )
}
