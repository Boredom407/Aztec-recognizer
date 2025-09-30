import type { Prisma } from "@prisma/client"

import { prisma } from "@/lib/prisma"

const nominationInclude = {
  nominee: {
    select: {
      id: true,
      name: true,
      image: true,
      points: true,
    },
  },
  nominator: {
    select: {
      id: true,
      name: true,
      image: true,
    },
  },
  _count: {
    select: {
      votes: true,
    },
  },
} satisfies Prisma.NominationInclude

type NominationRecord = Prisma.NominationGetPayload<{
  include: typeof nominationInclude
}>

export type NominationWithMeta = ReturnType<typeof mapNomination>

type FetchNominationsOptions = {
  currentUserId?: string
  where?: Prisma.NominationWhereInput
  orderBy?:
    | Prisma.NominationOrderByWithRelationInput
    | Prisma.NominationOrderByWithRelationInput[]
  take?: number
}

export async function fetchNominationsWithMeta({
  currentUserId,
  where,
  orderBy,
  take,
}: FetchNominationsOptions = {}) {
  const nominations = await prisma.nomination.findMany({
    include: nominationInclude,
    where,
    orderBy: orderBy ?? { createdAt: "desc" },
    ...(typeof take === "number" ? { take } : {}),
  })

  const votedNominationIds = currentUserId
    ? await fetchUserVotes(currentUserId)
    : new Set<string>()

  return nominations.map((nomination) =>
    mapNomination(nomination, votedNominationIds),
  )
}

export async function fetchNominationById(
  nominationId: string,
  currentUserId?: string,
) {
  const nomination = await prisma.nomination.findUnique({
    where: { id: nominationId },
    include: nominationInclude,
  })

  if (!nomination) {
    return null
  }

  const votedNominationIds = currentUserId
    ? await fetchUserVotes(currentUserId)
    : new Set<string>()

  return mapNomination(nomination, votedNominationIds)
}

async function fetchUserVotes(userId: string) {
  const votes = await prisma.vote.findMany({
    where: { voterId: userId },
    select: { nominationId: true },
  })

  return new Set(votes.map((vote) => vote.nominationId))
}

function mapNomination(
  nomination: NominationRecord,
  votedNominationIds: Set<string>,
) {
  return {
    id: nomination.id,
    reason: nomination.reason,
    createdAt: nomination.createdAt.toISOString(),
    nominator: nomination.nominator,
    nominee: nomination.nominee,
    voteCount: nomination._count.votes,
    hasVoted: votedNominationIds.has(nomination.id),
  }
}
