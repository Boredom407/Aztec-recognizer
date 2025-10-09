import Image from "next/image"
import type { LeaderboardEntry } from "@/lib/leaderboard"

type LeaderboardPodiumProps = {
  topThree: LeaderboardEntry[]
}

export function LeaderboardPodium({ topThree }: LeaderboardPodiumProps) {
  if (topThree.length === 0) {
    return null
  }

  const [first, second, third] = topThree

  return (
    <div className="mb-12">
      {/* Top 3 Cards - Horizontal Row, Equal Heights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Second Place */}
        {second && (
          <div className="card-base p-6 border-2 border-slate-400/50 bg-lime-500/15 min-h-[320px] flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-semibold text-slate-300">🥈 Runner-up</span>
              <span className="text-2xl font-bold text-slate-300">#2</span>
            </div>

            <div className="flex flex-col items-center flex-1">
              {second.image ? (
                <Image
                  src={second.image}
                  alt={second.name ?? "Runner-up"}
                  width={80}
                  height={80}
                  className="rounded-full ring-4 ring-slate-400 mb-3"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-slate-400 ring-4 ring-slate-400 flex items-center justify-center text-2xl font-bold text-white mb-3">
                  {second.name?.[0]?.toUpperCase() ?? "?"}
                </div>
              )}

              <h3 className="text-xl font-bold text-white text-center mb-2">
                {second.name ?? "Unnamed member"}
              </h3>

              <div className="mt-auto w-full space-y-2">
                <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-slate-900/50">
                  <span className="text-xs text-slate-400">Recognition Points</span>
                  <span className="text-lg font-bold text-lime-400">{second.recognitionPoints}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="text-center py-2 rounded bg-slate-900/30">
                    <div className="text-slate-400">Nominations</div>
                    <div className="font-semibold text-white">{second.nominationCount}</div>
                  </div>
                  <div className="text-center py-2 rounded bg-slate-900/30">
                    <div className="text-slate-400">Votes</div>
                    <div className="font-semibold text-white">{second.voteCount}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* First Place */}
        {first && (
          <div className="card-base p-6 border-2 border-lime-500 bg-lime-500/20 shadow-lime-glow-strong min-h-[320px] flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-semibold text-lime-400">🏆 Champion</span>
              <span className="text-2xl font-bold text-lime-500">#1</span>
            </div>

            <div className="flex flex-col items-center flex-1">
              {first.image ? (
                <Image
                  src={first.image}
                  alt={first.name ?? "Champion"}
                  width={80}
                  height={80}
                  className="rounded-full ring-4 ring-lime-500 mb-3"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-lime-500 ring-4 ring-lime-500 flex items-center justify-center text-2xl font-bold text-slate-900 mb-3">
                  {first.name?.[0]?.toUpperCase() ?? "?"}
                </div>
              )}

              <h3 className="text-xl font-bold text-lime-400 text-center mb-2">
                {first.name ?? "Unnamed member"}
              </h3>

              <div className="mt-auto w-full space-y-2">
                <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-lime-500/20 border border-lime-500/30">
                  <span className="text-xs text-lime-300">Recognition Points</span>
                  <span className="text-lg font-bold text-lime-400">{first.recognitionPoints}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="text-center py-2 rounded bg-lime-500/10">
                    <div className="text-lime-300">Nominations</div>
                    <div className="font-semibold text-white">{first.nominationCount}</div>
                  </div>
                  <div className="text-center py-2 rounded bg-lime-500/10">
                    <div className="text-lime-300">Votes</div>
                    <div className="font-semibold text-white">{first.voteCount}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Third Place */}
        {third && (
          <div className="card-base p-6 border-2 border-amber-500/50 bg-lime-500/15 min-h-[320px] flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-semibold text-amber-400">🥉 Third Place</span>
              <span className="text-2xl font-bold text-amber-400">#3</span>
            </div>

            <div className="flex flex-col items-center flex-1">
              {third.image ? (
                <Image
                  src={third.image}
                  alt={third.name ?? "Third place"}
                  width={80}
                  height={80}
                  className="rounded-full ring-4 ring-amber-500 mb-3"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-amber-500 ring-4 ring-amber-500 flex items-center justify-center text-2xl font-bold text-white mb-3">
                  {third.name?.[0]?.toUpperCase() ?? "?"}
                </div>
              )}

              <h3 className="text-xl font-bold text-white text-center mb-2">
                {third.name ?? "Unnamed member"}
              </h3>

              <div className="mt-auto w-full space-y-2">
                <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-slate-900/50">
                  <span className="text-xs text-slate-400">Recognition Points</span>
                  <span className="text-lg font-bold text-amber-400">{third.recognitionPoints}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="text-center py-2 rounded bg-slate-900/30">
                    <div className="text-slate-400">Nominations</div>
                    <div className="font-semibold text-white">{third.nominationCount}</div>
                  </div>
                  <div className="text-center py-2 rounded bg-slate-900/30">
                    <div className="text-slate-400">Votes</div>
                    <div className="font-semibold text-white">{third.voteCount}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
