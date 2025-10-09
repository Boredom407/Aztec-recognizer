import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"

import { SignInSection } from "@/components/sign-in-section"
import { getServerAuthSession } from "@/lib/auth"
import { fetchNominationsWithMeta } from "@/lib/nominations"
import type { NominationWithMeta } from "@/lib/nominations"
import { prisma } from "@/lib/prisma"

export default async function ProfilePage({
  params,
}: {
  params: { id: string }
}) {
  const session = await getServerAuthSession()

  const profileUser = await prisma.user.findUnique({
    where: { id: params.id },
    select: {
      id: true,
      name: true,
      image: true,
      points: true,
    },
  })

  if (!profileUser) {
    notFound()
  }

  const currentUserId = session?.user?.id

  const [receivedNominations, submittedNominations, votedNominations]: [
    NominationWithMeta[],
    NominationWithMeta[],
    NominationWithMeta[],
  ] =
    await Promise.all([
      fetchNominationsWithMeta({
        currentUserId,
        where: { nomineeId: profileUser.id },
      }),
      fetchNominationsWithMeta({
        currentUserId,
        where: { nominatorId: profileUser.id },
      }),
      fetchNominationsWithMeta({
        currentUserId,
        where: {
          votes: {
            some: {
              voterId: profileUser.id,
            },
          },
        },
      }),
    ])

  if (!session?.user) {
    return (
      <main className="min-h-screen bg-zinc-100 py-10">
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4">
          <SignInSection />
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-zinc-100 py-10">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4">
        <section className="flex flex-col gap-4 rounded-lg border border-zinc-200 bg-white p-6 shadow-sm md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            {profileUser.image ? (
              <Image
                src={profileUser.image}
                alt={profileUser.name ?? "Community member"}
                width={64}
                height={64}
                className="h-16 w-16 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-indigo-100 text-2xl font-semibold text-indigo-700">
                {profileUser.name ? profileUser.name.slice(0, 1).toUpperCase() : "?"}
              </div>
            )}
            <div>
              <h1 className="text-2xl font-semibold text-zinc-900">
                {profileUser.name ?? "Unnamed member"}
              </h1>
              <p className="text-sm text-zinc-500">Aztec Community recognition profile</p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2 text-right">
            <div className="text-sm uppercase tracking-wide text-zinc-500">
              Recognition points
            </div>
            <div className="text-3xl font-semibold text-indigo-600">
              {profileUser.points}
            </div>
            <Link
              href="/leaderboard"
              className="rounded border border-indigo-200 px-4 py-2 text-sm font-medium text-indigo-700 transition hover:bg-indigo-50"
            >
              View leaderboard
            </Link>
          </div>
        </section>

        <section className="flex flex-col gap-4 md:flex-row">
          <div className="flex-1 rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
            <header className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-zinc-900">
                Nominations received ({receivedNominations.length})
              </h2>
            </header>
            {receivedNominations.length === 0 ? (
              <p className="mt-3 text-sm text-zinc-500">
                No nominations received yet.
              </p>
            ) : (
              <ul className="mt-4 flex flex-col gap-3">
                {receivedNominations.map((nomination) => (
                  <li
                    key={nomination.id}
                    className="rounded border border-zinc-100 bg-zinc-50 p-4"
                  >
                    <div className="text-sm text-zinc-500">
                      From {nomination.nominator.name ?? "Anonymous"}
                    </div>
                    {nomination.reason && (
                      <p className="mt-2 text-sm text-zinc-700">{nomination.reason}</p>
                    )}
                    <div className="mt-3 text-xs uppercase tracking-wide text-zinc-500">
                      {nomination.voteCount} vote{nomination.voteCount === 1 ? "" : "s"}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="flex-1 rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
            <header className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-zinc-900">
                Nominations submitted ({submittedNominations.length})
              </h2>
            </header>
            {submittedNominations.length === 0 ? (
              <p className="mt-3 text-sm text-zinc-500">
                No nominations submitted yet.
              </p>
            ) : (
              <ul className="mt-4 flex flex-col gap-3">
                {submittedNominations.map((nomination) => (
                  <li
                    key={nomination.id}
                    className="rounded border border-zinc-100 bg-zinc-50 p-4"
                  >
                    <div className="text-sm text-zinc-500">
                      For {nomination.nominee.name ?? "Unnamed member"}
                    </div>
                    {nomination.reason && (
                      <p className="mt-2 text-sm text-zinc-700">{nomination.reason}</p>
                    )}
                    <div className="mt-3 text-xs uppercase tracking-wide text-zinc-500">
                      {nomination.voteCount} vote{nomination.voteCount === 1 ? "" : "s"}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        <section className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
          <header className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-zinc-900">
              Votes cast ({votedNominations.length})
            </h2>
          </header>
          {votedNominations.length === 0 ? (
            <p className="mt-3 text-sm text-zinc-500">No votes yet.</p>
          ) : (
            <ul className="mt-4 flex flex-col gap-3">
              {votedNominations.map((nomination) => (
                <li
                  key={nomination.id}
                  className="rounded border border-zinc-100 bg-zinc-50 p-4"
                >
                  <div className="text-sm text-zinc-500">
                    Nomination for {nomination.nominee.name ?? "Unnamed member"}
                  </div>
                  {nomination.reason && (
                    <p className="mt-2 text-sm text-zinc-700">{nomination.reason}</p>
                  )}
                  <div className="mt-3 text-xs uppercase tracking-wide text-zinc-500">
                    {nomination.voteCount} vote{nomination.voteCount === 1 ? "" : "s"}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  )
}
