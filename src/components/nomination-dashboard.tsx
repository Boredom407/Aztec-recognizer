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
    <div className="flex w-full flex-col gap-8 text-white">
      <DashboardHeader name={currentUser.name} />

      {showCreateForm && (
        <section className="rounded-2xl border border-white/10 bg-white/10 p-6 shadow-inner backdrop-blur">
          <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-xl font-semibold">Create a nomination</h2>
              <p className="text-sm text-white/70">
                Choose a community member to recognize and optionally explain why they deserve it.
              </p>
            </div>
            {nominatableUsers.length === 0 && (
              <p className="text-sm text-yellow-200">
                Invite more teammates to nominate and vote!
              </p>
            )}
          </div>

          <form
            className="mt-6 grid gap-4 md:grid-cols-2"
            onSubmit={handleCreateNomination}
            data-testid="nomination-form"
          >
            <label className="flex flex-col gap-2 text-sm md:col-span-1">
              <span className="font-medium text-white">Nominee</span>
              <select
                value={formState.nomineeId}
                onChange={(event) =>
                  setFormState((prev) => ({ ...prev, nomineeId: event.target.value }))
                }
                className="rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-white outline-none transition focus:border-yellow-300 focus:ring-2 focus:ring-yellow-400"
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
                  <option key={user.id} value={user.id} className="text-brandDark">
                    {user.name ?? "Unnamed member"}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-2 text-sm md:col-span-1">
              <span className="font-medium text-white">Reason (optional)</span>
              <textarea
                value={formState.reason}
                onChange={(event) =>
                  setFormState((prev) => ({ ...prev, reason: event.target.value }))
                }
                maxLength={500}
                rows={3}
                placeholder="Share why this person deserves recognition."
                className="rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-white outline-none transition placeholder:text-white/40 focus:border-yellow-300 focus:ring-2 focus:ring-yellow-400"
                disabled={isSubmitting}
                data-testid="nomination-reason"
              />
              <span className="text-xs text-white/50">
                {500 - formState.reason.length} characters remaining
              </span>
            </label>

            {formError && (
              <p className="md:col-span-2 text-sm font-medium text-red-300">{formError}</p>
            )}

            <div className="md:col-span-2 flex items-center justify-end gap-3">
              <button
                type="submit"
                className="rounded-lg bg-yellow-400 px-4 py-2 text-sm font-semibold text-brandDarker shadow transition hover:bg-yellow-300 disabled:opacity-50"
                disabled={isSubmitting || nominatableUsers.length === 0}
              >
                {isSubmitting ? "Submitting..." : "Submit nomination"}
              </button>
            </div>
          </form>
        </section>
      )}

      {showFeed && (
        <div className="space-y-3">
          {voteError && <p className="text-sm font-medium text-red-300">{voteError}</p>}
          <NominationFeed
            nominations={nominations}
            pendingVoteId={pendingVoteId}
            onVote={handleVote}
          />
        </div>
      )}
    </div>
  )
}
