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
  skip?: number
}

export async function fetchNominationsWithMeta({
  currentUserId,
  where,
  orderBy,
  take,
  skip,
}: FetchNominationsOptions = {}) {
  const nominations = await prisma.nomination.findMany({
    include: nominationInclude,
    where,
    orderBy: orderBy ?? { createdAt: "desc" },
    ...(typeof take === "number" ? { take } : {}),
    ...(typeof skip === "number" ? { skip } : {}),
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

export type PaginatedNominations = {
  nominations: NominationWithMeta[]
  page: number
  pageSize: number
  totalCount: number
  totalPages: number
  hasNextPage: boolean
  hasPreviousPage: boolean
}

const DEFAULT_PAGE_SIZE = 20
const MAX_PAGE_SIZE = 100

export async function fetchNominationsPaginated({
  currentUserId,
  where,
  orderBy,
  page = 1,
  pageSize = DEFAULT_PAGE_SIZE,
}: {
  currentUserId?: string
  where?: Prisma.NominationWhereInput
  orderBy?:
    | Prisma.NominationOrderByWithRelationInput
    | Prisma.NominationOrderByWithRelationInput[]
  page?: number
  pageSize?: number
}): Promise<PaginatedNominations> {
  const sanitizedPage = Math.max(1, Math.floor(page))
  const sanitizedPageSize = Math.max(1, Math.min(MAX_PAGE_SIZE, Math.floor(pageSize)))
  const skip = (sanitizedPage - 1) * sanitizedPageSize

  const [nominations, totalCount] = await Promise.all([
    fetchNominationsWithMeta({
      currentUserId,
      where,
      orderBy,
      take: sanitizedPageSize,
      skip,
    }),
    prisma.nomination.count({ where }),
  ])

  const totalPages = Math.ceil(totalCount / sanitizedPageSize)

  return {
    nominations,
    page: sanitizedPage,
    pageSize: sanitizedPageSize,
    totalCount,
    totalPages,
    hasNextPage: sanitizedPage < totalPages,
    hasPreviousPage: sanitizedPage > 1,
  }
}
