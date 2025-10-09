import Image from "next/image"
import type { LeaderboardEntry } from "@/lib/leaderboard"

type LeaderboardPodiumProps = {
  topThree: LeaderboardEntry[]
}

export function LeaderboardPodium({ topThree }: LeaderboardPodiumProps) {
  if (topThree.length === 0) {
    return null
  }

  // Arrange as [2nd, 1st, 3rd] for podium visual effect
  const [first, second, third] = topThree
  const arranged = [second, first, third].filter(Boolean)

  return (
    <div className="mb-8">
      {/* Podium Container */}
      <div className="flex items-end justify-center gap-4 md:gap-8">
        {arranged.map((entry, index) => {
          // Determine actual rank (second=1, first=0, third=2 in arranged array)
          const actualRank = index === 1 ? 1 : index === 0 ? 2 : 3
          const isFirst = actualRank === 1
          const isSecond = actualRank === 2

          // Heights for podium effect
          const containerHeight = isFirst ? "h-80" : isSecond ? "h-64" : "h-56"
          const medalSize = isFirst ? "h-16 w-16" : isSecond ? "h-14 w-14" : "h-12 w-12"
          const avatarSize = isFirst ? 96 : isSecond ? 80 : 72

          // Medal colors and icons
          const medalBg = isFirst
            ? "bg-gradient-to-br from-yellow-400 to-amber-600"
            : isSecond
            ? "bg-gradient-to-br from-slate-300 to-slate-500"
            : "bg-gradient-to-br from-amber-600 to-amber-800"

          const medalEmoji = isFirst ? "🥇" : isSecond ? "🥈" : "🥉"

          const glowColor = isFirst
            ? "shadow-lime-glow-strong"
            : isSecond
            ? "shadow-card-hover"
            : "shadow-card"

          return (
            <div
              key={entry.userId}
              className={`flex ${containerHeight} w-full max-w-xs flex-col items-center justify-end`}
            >
              {/* Medal Badge */}
              <div className={`mb-3 ${medalSize} flex items-center justify-center rounded-full ${medalBg} ${glowColor} animate-fade-in`}>
                <span className="text-3xl">{medalEmoji}</span>
              </div>

              {/* Card */}
              <div className={`card-base w-full p-6 text-center ${isFirst ? 'border-lime-500/50 shadow-lime-glow' : ''} animate-slide-up`}>
                {/* Avatar */}
                <div className="mb-4 flex justify-center">
                  {entry.image ? (
                    <Image
                      src={entry.image}
                      alt={entry.name ?? "Top contributor"}
                      width={avatarSize}
                      height={avatarSize}
                      className={`rounded-full ${isFirst ? 'ring-4 ring-lime-500' : isSecond ? 'ring-4 ring-slate-400' : 'ring-4 ring-amber-600'}`}
                    />
                  ) : (
                    <div
                      className={`flex items-center justify-center rounded-full ${isFirst ? 'bg-lime-500 ring-4 ring-lime-500' : isSecond ? 'bg-slate-400 ring-4 ring-slate-400' : 'bg-amber-600 ring-4 ring-amber-600'} text-2xl font-bold text-white`}
                      style={{ width: avatarSize, height: avatarSize }}
                    >
                      {entry.name?.[0]?.toUpperCase() ?? "?"}
                    </div>
                  )}
                </div>

                {/* Name */}
                <h3 className={`mb-2 font-bold ${isFirst ? 'text-2xl text-lime-500' : isSecond ? 'text-xl text-slate-300' : 'text-lg text-amber-500'}`}>
                  {entry.name ?? "Unnamed member"}
                </h3>

                {/* Rank Badge */}
                <div className="mb-3 text-sm text-slate-500">
                  Rank #{actualRank}
                </div>

                {/* Stats */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between rounded-lg bg-slate-900/50 px-3 py-2">
                    <span className="text-xs text-slate-400">Recognition Points</span>
                    <span className={`font-bold ${isFirst ? 'text-lime-500' : 'text-white'}`}>
                      {entry.recognitionPoints}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="rounded-lg bg-slate-900/30 px-2 py-1.5">
                      <div className="text-slate-500">Nominations</div>
                      <div className="font-semibold text-white">{entry.nominationCount}</div>
                    </div>
                    <div className="rounded-lg bg-slate-900/30 px-2 py-1.5">
                      <div className="text-slate-500">Votes</div>
                      <div className="font-semibold text-white">{entry.voteCount}</div>
                    </div>
                  </div>
                </div>

                {/* Trophy Animation for First Place */}
                {isFirst && (
                  <div className="mt-4 flex justify-center">
                    <span className="text-2xl animate-glow">✨</span>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Podium Base Visual */}
      <div className="mt-1 flex items-end justify-center gap-4 md:gap-8">
        {arranged.map((entry, index) => {
          const actualRank = index === 1 ? 1 : index === 0 ? 2 : 3
          const isFirst = actualRank === 1
          const isSecond = actualRank === 2

          const baseHeight = isFirst ? "h-24" : isSecond ? "h-16" : "h-12"
          const baseBg = isFirst
            ? "bg-gradient-to-t from-lime-600 to-lime-500"
            : isSecond
            ? "bg-gradient-to-t from-slate-600 to-slate-500"
            : "bg-gradient-to-t from-amber-700 to-amber-600"

          return (
            <div
              key={`base-${entry.userId}`}
              className={`${baseHeight} w-full max-w-xs rounded-t-lg ${baseBg} flex items-center justify-center font-bold text-white shadow-lg`}
            >
              <span className="text-sm opacity-75">#{actualRank}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
