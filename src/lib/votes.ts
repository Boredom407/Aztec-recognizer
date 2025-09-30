import { Prisma } from "@prisma/client"

import { fetchNominationById } from "@/lib/nominations"
import { prisma } from "@/lib/prisma"

export async function castVote({
  nominationId,
  voterId,
}: {
  nominationId: string
  voterId: string
}) {
  const sanitizedNominationId = nominationId.trim()

  if (!sanitizedNominationId) {
    throw new VoteError("Nomination id is required", 400)
  }

  const nomination = await prisma.nomination.findUnique({
    where: { id: sanitizedNominationId },
    select: {
      id: true,
      nomineeId: true,
      nominatorId: true,
    },
  })

  if (!nomination) {
    throw new VoteError("Nomination not found", 404)
  }

  if (nomination.nominatorId === voterId || nomination.nomineeId === voterId) {
    throw new VoteError("You cannot vote on your own nomination", 400)
  }

  try {
    await prisma.vote.create({
      data: {
        nominationId: sanitizedNominationId,
        voterId,
      },
    })
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw new VoteError("You have already voted for this nomination", 409)
    }

    throw error
  }

  return fetchNominationById(sanitizedNominationId, voterId)
}

export async function removeVote({
  nominationId,
  voterId,
}: {
  nominationId: string
  voterId: string
}) {
  const sanitizedNominationId = nominationId.trim()

  if (!sanitizedNominationId) {
    throw new VoteError("Nomination id is required", 400)
  }

  try {
    await prisma.vote.delete({
      where: {
        nominationId_voterId: {
          nominationId: sanitizedNominationId,
          voterId,
        },
      },
    })
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return fetchNominationById(sanitizedNominationId, voterId)
    }

    throw error
  }

  return fetchNominationById(sanitizedNominationId, voterId)
}

export class VoteError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.status = status
    this.name = "VoteError"
  }
}
