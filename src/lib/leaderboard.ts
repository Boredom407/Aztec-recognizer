import { Prisma } from "@prisma/client"

import { prisma } from "@/lib/prisma"

type LeaderboardQueryRow = {
  id: string
  name: string | null
  image: string | null
  nominationCount: bigint | number | string
  voteCount: bigint | number | string
  recognitionPoints: bigint | number | string
}

export type LeaderboardEntry = {
  userId: string
  name: string | null
  image: string | null
  nominationCount: number
  voteCount: number
  recognitionPoints: number
}

export type LeaderboardResult = {
  entries: LeaderboardEntry[]
  page: number
  pageSize: number
  totalNominees: number
  totalPages: number
}

const DEFAULT_PAGE_SIZE = 10
const MAX_PAGE_SIZE = 50

export async function fetchLeaderboard({
  page,
  pageSize,
}: {
  page?: number
  pageSize?: number
} = {}): Promise<LeaderboardResult> {
  const sanitizedPage = sanitizeInteger(page, 1)
  const sanitizedPageSize = sanitizeInteger(pageSize, DEFAULT_PAGE_SIZE, 1, MAX_PAGE_SIZE)
  const offset = (sanitizedPage - 1) * sanitizedPageSize

  const entriesRaw = await prisma.$queryRaw<LeaderboardQueryRow[]>(Prisma.sql`
    WITH vote_counts AS (
      SELECT "nominationId", COUNT(*)::int AS "voteCount"
      FROM "Vote"
      GROUP BY "nominationId"
    ),
    nominee_totals AS (
      SELECT
        n."nomineeId",
        COUNT(*)::int AS "nominationCount",
        COALESCE(SUM(vc."voteCount"), 0)::int AS "voteCount"
      FROM "Nomination" n
      LEFT JOIN vote_counts vc ON vc."nominationId" = n."id"
      GROUP BY n."nomineeId"
    )
    SELECT
      u."id",
      u."name",
      u."image",
      nominee_totals."nominationCount",
      nominee_totals."voteCount",
      (nominee_totals."nominationCount" + nominee_totals."voteCount")::int AS "recognitionPoints"
    FROM nominee_totals
    JOIN "User" u ON u."id" = nominee_totals."nomineeId"
    ORDER BY "recognitionPoints" DESC, nominee_totals."voteCount" DESC, u."name" ASC NULLS LAST
    LIMIT ${sanitizedPageSize}
    OFFSET ${offset}
  `)

  const totalNomineesResult = await prisma.$queryRaw<{ count: bigint | number | string }[]>(
    Prisma.sql`SELECT COUNT(DISTINCT "nomineeId") AS count FROM "Nomination"`
  )

  const totalNominees = totalNomineesResult.length
    ? toNumber(totalNomineesResult[0].count)
    : 0
  const totalPages = totalNominees === 0
    ? 0
    : Math.ceil(totalNominees / sanitizedPageSize)

  const entries: LeaderboardEntry[] = entriesRaw.map((row) => ({
    userId: row.id,
    name: row.name,
    image: row.image,
    nominationCount: toNumber(row.nominationCount),
    voteCount: toNumber(row.voteCount),
    recognitionPoints: toNumber(row.recognitionPoints),
  }))

  return {
    entries,
    page: sanitizedPage,
    pageSize: sanitizedPageSize,
    totalNominees,
    totalPages,
  }
}

function sanitizeInteger(
  value: number | undefined,
  defaultValue: number,
  min = 1,
  max = Number.MAX_SAFE_INTEGER,
) {
  if (typeof value !== "number" || Number.isNaN(value) || !Number.isFinite(value)) {
    return defaultValue
  }

  const normalized = Math.floor(value)

  if (normalized < min) {
    return min
  }

  if (normalized > max) {
    return max
  }

  return normalized
}

function toNumber(value: bigint | number | string) {
  if (typeof value === "number") {
    return value
  }

  if (typeof value === "bigint") {
    return Number(value)
  }

  return Number.parseInt(value, 10)
}
