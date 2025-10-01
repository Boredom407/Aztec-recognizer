"use client"

import { useMemo, useState } from "react"

import { DashboardHeader } from "@/components/dashboard-header"
import { NominationFeed } from "@/components/nomination-feed"
import type { NominationWithMeta } from "@/lib/nominations"

type CandidateUser = {
  id: string
  name: string | null
  image: string | null
  points?: number | null
}

type NominationDashboardProps = {
  currentUser: {
    id: string
    name: string | null
    image: string | null
  }
  nominations: NominationWithMeta[]
  users: CandidateUser[]
  showCreateForm?: boolean
  showFeed?: boolean
}

type ApiErrorResponse = {
  error?: string
}

type NominationResponse = {
  nomination: NominationWithMeta | null
}

export function NominationDashboard({
  currentUser,
  nominations: initialNominations,
  users,
  showCreateForm = true,
  showFeed = true,
}: NominationDashboardProps) {
  const [nominations, setNominations] = useState(initialNominations)
  const [pendingVoteId, setPendingVoteId] = useState<string | null>(null)
  const [voteError, setVoteError] = useState<string | null>(null)
  const [formState, setFormState] = useState({ nomineeId: "", reason: "" })
  const [formError, setFormError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const nominatableUsers = useMemo(
    () => users.filter((user) => user.id !== currentUser.id),
    [users, currentUser.id],
  )

  async function handleVote(nominationId: string, hasVoted: boolean) {
    setPendingVoteId(nominationId)
    setVoteError(null)

    try {
      const response = await fetch("/api/votes", {
        method: hasVoted ? "DELETE" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ nominationId }),
      })

      if (!response.ok) {
        const data = (await response.json().catch(() => ({}))) as ApiErrorResponse
        setVoteError(data.error ?? "Unable to update vote. Please try again.")
        return
      }

      const data = (await response.json()) as NominationResponse

      if (!data.nomination) {
        setNominations((prev) => prev.filter((item) => item.id !== nominationId))
        return
      }

      setNominations((prev) =>
        prev.map((item) =>
          item.id === nominationId ? { ...item, ...data.nomination } : item,
        ),
      )
    } catch {

      setVoteError("Something went wrong while updating your vote.")
    } finally {
      setPendingVoteId(null)
    }
  }

  async function handleCreateNomination(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    setFormError(null)
    setIsSubmitting(true)

    try {
      const payload = {
        nomineeId: formState.nomineeId,
        reason: formState.reason.trim() ? formState.reason.trim() : undefined,
      }

      const response = await fetch("/api/nominations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const data = (await response.json().catch(() => ({}))) as ApiErrorResponse
        setFormError(data.error ?? "Unable to create nomination.")
        return
      }

      const data = (await response.json()) as NominationResponse
      const nomination = data.nomination

      if (!nomination) {
        setFormError("Nomination could not be created. Please try again.")
        return
      }

      setNominations((prev) => [nomination, ...prev])
      setFormState({ nomineeId: "", reason: "" })
    } catch {

      setFormError("Something went wrong while submitting your nomination.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex w-full flex-col gap-6">
      <DashboardHeader name={currentUser.name} />

      {showCreateForm && (
        <section className="rounded-2xl border border-white/10 bg-white/10 p-6 shadow-inner backdrop-blur">
          <h2 className="text-xl font-semibold text-white">Create a nomination</h2>
          <p className="mt-1  text-sm text-white/70">
            Choose a community member to recognize and optionally explain why they deserve it.
          </p>
          <form
            className="mt-4 flex flex-col gap-4"
            onSubmit={handleCreateNomination}
            data-testid="nomination-form"
          >
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium text-zinc-700">Nominee</span>
              <select
                value={formState.nomineeId}
                onChange={(event) =>
                  setFormState((prev) => ({ ...prev, nomineeId: event.target.value }))
                }
                className="rounded border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring"
                required
                disabled={nominatableUsers.length === 0 || isSubmitting}
                data-testid="nomination-select"
              >
                <option value="" disabled>
                  {nominatableUsers.length === 0
                    ? "No other members available"
                    : "Select a community member"}
                </option>
                {nominatableUsers.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name ?? "Unnamed member"}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium text-zinc-700">Reason (optional)</span>
              <textarea
                value={formState.reason}
                onChange={(event) =>
                  setFormState((prev) => ({ ...prev, reason: event.target.value }))
                }
                maxLength={500}
                rows={3}
                placeholder="Share why this person deserves recognition."
                className="rounded border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring"
                disabled={isSubmitting}
                data-testid="nomination-reason"
              />
            </label>

            {formError && <p className="text-sm text-red-600">{formError}</p>}

            <button
              type="submit"
              className="self-start rounded bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-500 disabled:opacity-50"
              disabled={isSubmitting || nominatableUsers.length === 0}
            >
              {isSubmitting ? "Submitting..." : "Submit nomination"}
            </button>
          </form>
        </section>
      )}

      {showFeed && (
        <section className="rounded-2xl border border-white/10 bg-white/10 p-6 shadow-inner backdrop-blur">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-lg font-semibold text-zinc-800">Current nominations</h2>
            {voteError && <p className="text-sm text-red-600">{voteError}</p>}
          </div>

          {nominations.length === 0 ? (
            <p className="mt-4 text-sm text-zinc-500">
              No nominations yet. Be the first to recognize someone!
            </p>
          ) : (
            <ul className="mt-4 flex flex-col gap-4">
              {nominations.map((nomination) => {
                const voteButtonVariant = nomination.hasVoted
                  ? "bg-green-600 hover:bg-green-500"
                  : "bg-indigo-600 hover:bg-indigo-500"
                const voteButtonState = pendingVoteId === nomination.id ? " opacity-60" : ""
                const voteButtonText =
                  pendingVoteId === nomination.id
                    ? "Saving..."
                    : nomination.hasVoted
                      ? "Voted"
                      : "Vote"

                return (
                  <li
                    key={nomination.id}
                    className="flex flex-col gap-3 rounded border border-zinc-100 bg-zinc-50 p-4"
                    data-testid={`nomination-card-${nomination.id}`}
                  >
                    <div className="flex flex-col gap-1">
                      <div className="text-sm text-zinc-500">
                        Nominated by {nomination.nominator.name ?? "Anonymous"}
                      </div>
                      <div className="text-xl font-semibold text-zinc-800">
                        {nomination.nominee.name ?? "Unnamed member"}
                      </div>
                    </div>

                    {nomination.reason && (
                      <p className="text-sm text-zinc-600">{nomination.reason}</p>
                    )}

                    <div className="flex items-center justify-between gap-4">
                      <span className="text-sm font-medium text-zinc-700">
                        {nomination.voteCount} vote{nomination.voteCount === 1 ? "" : "s"}
                      </span>

                      <button
                        onClick={() => handleVote(nomination.id, nomination.hasVoted)}
                        disabled={pendingVoteId === nomination.id}
                        className={
                          "rounded px-3 py-2 text-sm font-medium text-white transition " +
                          voteButtonVariant +
                          voteButtonState
                        }
                        data-testid={`vote-button-${nomination.id}`}
                      >
                        {voteButtonText}
                      </button>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </section>
      )}
    </div>
  )
}
