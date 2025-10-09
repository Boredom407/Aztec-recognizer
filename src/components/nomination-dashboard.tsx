"use client"

import Link from "next/link"
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

type PaginationInfo = {
  page: number
  pageSize: number
  totalCount: number
  totalPages: number
  hasNextPage: boolean
  hasPreviousPage: boolean
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
  pagination?: PaginationInfo
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
  pagination,
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
        <section className="card-base p-6">
          <div className="mb-6 flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <svg className="h-6 w-6 text-lime-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Create Nomination
              </h2>
              <p className="mt-1 text-sm text-slate-400">
                Recognize a community member for their contributions
              </p>
            </div>
            {nominatableUsers.length === 0 && (
              <div className="rounded-lg bg-amber-500/10 px-3 py-2 border border-amber-500/20">
                <p className="text-sm text-amber-400">
                  ⚠️ Invite teammates to get started!
                </p>
              </div>
            )}
          </div>

          <form
            className="space-y-5"
            onSubmit={handleCreateNomination}
            data-testid="nomination-form"
          >
            {/* Nominee Selection */}
            <div>
              <label htmlFor="nominee-select" className="mb-2 block text-sm font-medium text-slate-300">
                Who deserves recognition?
              </label>
              <select
                id="nominee-select"
                value={formState.nomineeId}
                onChange={(event) =>
                  setFormState((prev) => ({ ...prev, nomineeId: event.target.value }))
                }
                className="input-base w-full text-base"
                required
                disabled={nominatableUsers.length === 0 || isSubmitting}
                data-testid="nomination-select"
              >
                <option value="" disabled className="bg-slate-800 text-slate-400">
                  {nominatableUsers.length === 0
                    ? "No other members available"
                    : "Select a community member..."}
                </option>
                {nominatableUsers.map((user) => (
                  <option key={user.id} value={user.id} className="bg-slate-800 text-white">
                    {user.name ?? "Unnamed member"}
                  </option>
                ))}
              </select>
            </div>

            {/* Reason Textarea */}
            <div>
              <label htmlFor="nomination-reason" className="mb-2 block text-sm font-medium text-slate-300">
                Why do they deserve it? <span className="text-slate-500">(optional)</span>
              </label>
              <div className="relative">
                <textarea
                  id="nomination-reason"
                  value={formState.reason}
                  onChange={(event) =>
                    setFormState((prev) => ({ ...prev, reason: event.target.value }))
                  }
                  maxLength={500}
                  rows={4}
                  placeholder="Share their achievement, contribution, or why they stand out..."
                  className="input-base w-full resize-none text-base"
                  disabled={isSubmitting}
                  data-testid="nomination-reason"
                />
                <div className="absolute bottom-3 right-3 text-xs text-slate-500">
                  {formState.reason.length}/500
                </div>
              </div>
            </div>

            {/* Error Message */}
            {formError && (
              <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3">
                <p className="text-sm font-medium text-red-400">{formError}</p>
              </div>
            )}

            {/* Submit Button */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setFormState({ nomineeId: "", reason: "" })}
                className="btn-secondary text-sm"
                disabled={isSubmitting}
              >
                Clear
              </button>
              <button
                type="submit"
                className="btn-primary"
                disabled={isSubmitting || nominatableUsers.length === 0 || !formState.nomineeId}
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Submitting...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Submit Nomination
                  </span>
                )}
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

          {pagination && pagination.totalPages > 1 && (
            <div className="mt-6 flex items-center justify-between rounded-lg border border-white/10 bg-white/5 p-4">
              <p className="text-sm text-white/70">
                Page {pagination.page} of {pagination.totalPages} ({pagination.totalCount} total nominations)
              </p>
              <div className="flex gap-2">
                {pagination.hasPreviousPage && (
                  <Link
                    href={`?page=${pagination.page - 1}&pageSize=${pagination.pageSize}`}
                    className="rounded bg-white/10 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-white/20"
                  >
                    Previous
                  </Link>
                )}
                {pagination.hasNextPage && (
                  <Link
                    href={`?page=${pagination.page + 1}&pageSize=${pagination.pageSize}`}
                    className="rounded bg-white/10 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-white/20"
                  >
                    Next
                  </Link>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
