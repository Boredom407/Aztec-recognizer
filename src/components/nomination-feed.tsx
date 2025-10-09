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
      <div className="card-base p-8 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-lime-500/10">
          <svg className="h-8 w-8 text-lime-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </div>
        <p className="text-lg font-medium text-white">No nominations yet</p>
        <p className="mt-1 text-sm text-slate-400">Be the first to recognize someone in the community!</p>
      </div>
    )
  }

  return (
    <ul className="grid gap-4 md:grid-cols-2">
      {nominations.map((nomination) => {
        const isPending = pendingVoteId === nomination.id

        return (
          <li
            key={nomination.id}
            className="card-base card-hover group p-5"
            data-testid={`nomination-card-${nomination.id}`}
          >
            {/* Header with avatars */}
            <div className="mb-4 flex items-center gap-3">
              {/* Nominator */}
              <div className="flex items-center gap-2">
                {nomination.nominator.image ? (
                  <Image
                    src={nomination.nominator.image}
                    alt={nomination.nominator.name ?? "Nominator"}
                    width={32}
                    height={32}
                    className="h-8 w-8 rounded-full ring-2 ring-slate-700"
                  />
                ) : (
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-700 text-xs font-semibold text-slate-300 ring-2 ring-slate-600">
                    {nomination.nominator.name?.[0]?.toUpperCase() ?? "?"}
                  </div>
                )}
                <span className="text-sm text-slate-400">nominated</span>
              </div>

              {/* Arrow */}
              <svg className="h-4 w-4 text-lime-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>

              {/* Nominee */}
              <div className="flex items-center gap-2">
                {nomination.nominee.image ? (
                  <Image
                    src={nomination.nominee.image}
                    alt={nomination.nominee.name ?? "Nominee"}
                    width={40}
                    height={40}
                    className="h-10 w-10 rounded-full ring-2 ring-lime-500/50"
                  />
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-lime-500/20 text-sm font-bold text-lime-400 ring-2 ring-lime-500/50">
                    {nomination.nominee.name?.[0]?.toUpperCase() ?? "?"}
                  </div>
                )}
                <div>
                  <p className="font-semibold text-white">
                    {nomination.nominee.name ?? "Unnamed member"}
                  </p>
                </div>
              </div>
            </div>

            {/* Reason */}
            {nomination.reason && (
              <div className="mb-4 rounded-lg bg-slate-900/50 p-3 border border-slate-700/50">
                <p className="text-sm leading-relaxed text-slate-300">
                  "{nomination.reason}"
                </p>
              </div>
            )}

            {/* Footer with votes and button */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-700/50">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 rounded-full bg-slate-900/50 px-3 py-1">
                  <svg className="h-4 w-4 text-lime-500" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
                  </svg>
                  <span className="text-sm font-semibold text-slate-300">
                    {nomination.voteCount}
                  </span>
                </div>
                <span className="text-xs text-slate-500">
                  {nomination.voteCount === 1 ? "vote" : "votes"}
                </span>
              </div>

              <button
                onClick={() => onVote(nomination.id, nomination.hasVoted)}
                disabled={isPending}
                data-testid={`vote-button-${nomination.id}`}
                className={
                  nomination.hasVoted
                    ? "flex items-center gap-2 rounded-lg bg-aztec-500 px-4 py-2 text-sm font-semibold text-white shadow-md transition-all hover:bg-aztec-600"
                    : "btn-primary text-sm"
                }
              >
                {isPending ? (
                  <>
                    <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Saving...</span>
                  </>
                ) : nomination.hasVoted ? (
                  <>
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span>Voted</span>
                  </>
                ) : (
                  <>
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
                    </svg>
                    <span>Vote</span>
                  </>
                )}
              </button>
            </div>
          </li>
        )
      })}
    </ul>
  )
}