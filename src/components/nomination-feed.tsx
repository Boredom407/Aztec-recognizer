import type { NominationWithMeta } from "@/lib/nominations"

type NominationFeedProps = {
  nominations: NominationWithMeta[]
  pendingVoteId: string | null
  onVote: (id: string, hasVoted: boolean) => Promise<void>
}

export function NominationFeed({ nominations, pendingVoteId, onVote }: NominationFeedProps) {
  if (nominations.length === 0) {
    return (
      <div className="rounded-xl border border-white/10 bg-white/5 p-6 text-white/80">
        No nominations yet. Be the first to recognize someone!
      </div>
    )
  }

  return (
    <ul className="grid gap-4 md:grid-cols-2">
      {nominations.map((nomination) => {
        const isPending = pendingVoteId === nomination.id

        const buttonClassName = [
          "rounded-lg px-4 py-2 text-sm font-semibold shadow transition",
          nomination.hasVoted
            ? "bg-green-400/90 text-brandDarker hover:bg-green-400"
            : "bg-yellow-400 text-brandDarker hover:bg-yellow-300",
          isPending ? "opacity-60" : "",
        ]
          .filter(Boolean)
          .join(" ")

        return (
          <li
            key={nomination.id}
            className="flex flex-col gap-4 rounded-xl border border-white/10 bg-white/10 p-4 text-white shadow-sm backdrop-blur"
            data-testid={`nomination-card-${nomination.id}`}
          >
            <div className="space-y-1">
              <p className="text-sm text-white/60">
                Nominated by {nomination.nominator.name ?? "Anonymous"}
              </p>
              <h3 className="text-xl font-semibold">
                {nomination.nominee.name ?? "Unnamed member"}
              </h3>
            </div>

            {nomination.reason && (
              <p className="rounded-lg bg-white/5 p-3 text-sm text-white/80">
                {nomination.reason}
              </p>
            )}

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-white/70">
                {nomination.voteCount} vote{nomination.voteCount === 1 ? "" : "s"}
              </span>
              <button
                onClick={() => onVote(nomination.id, nomination.hasVoted)}
                disabled={isPending}
                data-testid={`vote-button-${nomination.id}`}
                className={buttonClassName}
              >
                {isPending ? "Saving..." : nomination.hasVoted ? "Voted" : "Vote"}
              </button>
            </div>
          </li>
        )
      })}
    </ul>
  )
}