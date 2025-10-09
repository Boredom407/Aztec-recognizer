import Image from "next/image"
import type { NominationWithMeta } from "@/lib/nominations"

type NominationFeedProps = {
  nominations: NominationWithMeta[]
  pendingVoteId: string | null
  onVote: (id: string, hasVoted: boolean) => Promise<void>
}

export function NominationFeed({ nominations, pendingVoteId, onVote }: NominationFeedProps) {
  if (nominations.length === 0) {
    return (
      <div className="card-base p-12 text-center">
        <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-lime-500/20">
          <svg className="h-10 w-10 text-lime-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </div>
        <p className="text-xl font-semibold text-white">No nominations yet</p>
        <p className="mt-2 text-sm text-slate-400">Be the first to recognize someone in the community!</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      {nominations.map((nomination) => {
        const isPending = pendingVoteId === nomination.id

        return (
          <div
            key={nomination.id}
            className="card-base card-hover p-6"
            data-testid={`nomination-card-${nomination.id}`}
          >
            {/* Header - Nominator and Nominee */}
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {/* Nominator Avatar */}
                {nomination.nominator.image ? (
                  <Image
                    src={nomination.nominator.image}
                    alt={nomination.nominator.name ?? "Nominator"}
                    width={40}
                    height={40}
                    className="rounded-full ring-2 ring-lime-500/30"
                  />
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-700 text-sm font-semibold text-slate-300 ring-2 ring-lime-500/30">
                    {nomination.nominator.name?.[0]?.toUpperCase() ?? "?"}
                  </div>
                )}

                <div className="flex flex-col">
                  <span className="text-xs text-slate-400">Nominated by</span>
                  <span className="text-sm font-medium text-white">
                    {nomination.nominator.name ?? "Anonymous"}
                  </span>
                </div>
              </div>

              {/* Vote Count */}
              <div className="flex items-center gap-1 rounded-full bg-lime-500/20 px-3 py-1">
                <svg className="h-4 w-4 text-lime-400" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
                </svg>
                <span className="text-sm font-semibold text-lime-400">{nomination.voteCount}</span>
              </div>
            </div>

            {/* Nominee - Main Focus */}
            <div className="mb-4 flex items-center gap-4 rounded-lg bg-slate-900/50 p-4">
              {nomination.nominee.image ? (
                <Image
                  src={nomination.nominee.image}
                  alt={nomination.nominee.name ?? "Nominee"}
                  width={56}
                  height={56}
                  className="rounded-full ring-4 ring-lime-500"
                />
              ) : (
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-lime-500 text-xl font-bold text-slate-900 ring-4 ring-lime-500">
                  {nomination.nominee.name?.[0]?.toUpperCase() ?? "?"}
                </div>
              )}

              <div className="flex-1">
                <div className="text-xs font-medium text-lime-400">Recognized</div>
                <div className="text-lg font-bold text-white">{nomination.nominee.name ?? "Anonymous"}</div>
              </div>
            </div>

            {/* Reason */}
            {nomination.reason && (
              <div className="mb-4">
                <p className="text-sm leading-relaxed text-slate-300">
                  &ldquo;{nomination.reason}&rdquo;
                </p>
              </div>
            )}

            {/* Vote Button */}
            <button
              onClick={() => onVote(nomination.id, nomination.hasVoted)}
              disabled={isPending}
              className={`w-full rounded-lg px-4 py-3 font-semibold transition-all duration-200 ${
                nomination.hasVoted
                  ? "bg-slate-700 text-slate-300 cursor-default"
                  : "bg-lime-500 text-slate-900 hover:bg-lime-400 shadow-md hover:shadow-lime-glow"
              } ${isPending ? "opacity-50 cursor-wait" : ""}`}
            >
              {isPending ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Saving...
                </span>
              ) : nomination.hasVoted ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Voted
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
                  </svg>
                  Vote
                </span>
              )}
            </button>
          </div>
        )
      })}
    </div>
  )
}
