import { Prisma } from "@prisma/client"
import { describe, expect, it, beforeEach, beforeAll, vi } from "vitest"

vi.mock("@prisma/client", () => {
  class PrismaClientKnownRequestError extends Error {
    code: string

    constructor(message: string, options: { code: string }) {
      super(message)
      this.code = options.code
    }
  }

  return {
    Prisma: {
      PrismaClientKnownRequestError,
    },
  }
})

const mockPrisma = {
  nomination: {
    findUnique: vi.fn(),
  },
  vote: {
    create: vi.fn(),
    delete: vi.fn(),
  },
}

const fetchNominationByIdMock = vi.fn()

vi.mock("@/lib/prisma", () => ({
  prisma: mockPrisma,
}))

vi.mock("@/lib/nominations", () => ({
  fetchNominationById: fetchNominationByIdMock,
}))

let castVote: typeof import("@/lib/votes").castVote
let removeVote: typeof import("@/lib/votes").removeVote

beforeAll(async () => {
  const votesModule = await import("@/lib/votes")
  castVote = votesModule.castVote
  removeVote = votesModule.removeVote
})

describe("castVote", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("throws when nomination id is missing", async () => {
    await expect(
      castVote({ nominationId: "   ", voterId: "user-1" }),
    ).rejects.toMatchObject({ message: "Nomination id is required", status: 400 })
  })

  it("throws when nomination cannot be found", async () => {
    mockPrisma.nomination.findUnique.mockResolvedValue(null)

    await expect(
      castVote({ nominationId: "nom-1", voterId: "user-1" }),
    ).rejects.toMatchObject({ message: "Nomination not found", status: 404 })
  })

  it("prevents self voting for nominator or nominee", async () => {
    mockPrisma.nomination.findUnique.mockResolvedValue({
      id: "nom-1",
      nominatorId: "user-1",
      nomineeId: "user-2",
    })

    await expect(
      castVote({ nominationId: "nom-1", voterId: "user-1" }),
    ).rejects.toMatchObject({ message: "You cannot vote on your own nomination", status: 400 })

    mockPrisma.nomination.findUnique.mockResolvedValue({
      id: "nom-1",
      nominatorId: "user-3",
      nomineeId: "user-1",
    })

    await expect(
      castVote({ nominationId: "nom-1", voterId: "user-1" }),
    ).rejects.toMatchObject({ message: "You cannot vote on your own nomination", status: 400 })
  })

  it("translates duplicate votes into VoteError", async () => {
    mockPrisma.nomination.findUnique.mockResolvedValue({
      id: "nom-1",
      nominatorId: "user-2",
      nomineeId: "user-3",
    })

    const error = new Prisma.PrismaClientKnownRequestError("duplicate", {
      code: "P2002",
      clientVersion: "6.16.2",
    })

    mockPrisma.vote.create.mockRejectedValue(error)

    await expect(
      castVote({ nominationId: "nom-1", voterId: "user-1" }),
    ).rejects.toMatchObject({ message: "You have already voted for this nomination", status: 409 })
  })

  it("returns the formatted nomination when vote succeeds", async () => {
    const formatted = { id: "nom-1", voteCount: 5 }
    mockPrisma.nomination.findUnique.mockResolvedValue({
      id: "nom-1",
      nominatorId: "user-2",
      nomineeId: "user-3",
    })
    mockPrisma.vote.create.mockResolvedValue({ id: "vote-1" })
    fetchNominationByIdMock.mockResolvedValue(formatted)

    const result = await castVote({ nominationId: "nom-1", voterId: "user-1" })

    expect(mockPrisma.vote.create).toHaveBeenCalledWith({
      data: {
        nominationId: "nom-1",
        voterId: "user-1",
      },
    })
    expect(fetchNominationByIdMock).toHaveBeenCalledWith("nom-1", "user-1")
    expect(result).toEqual(formatted)
  })
})

describe("removeVote", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("throws when nomination id is missing", async () => {
    await expect(
      removeVote({ nominationId: "", voterId: "user-1" }),
    ).rejects.toMatchObject({ message: "Nomination id is required", status: 400 })
  })

  it("returns formatted nomination when delete succeeds", async () => {
    const formatted = { id: "nom-1", voteCount: 2 }
    mockPrisma.vote.delete.mockResolvedValue({})
    fetchNominationByIdMock.mockResolvedValue(formatted)

    const result = await removeVote({ nominationId: "nom-1", voterId: "user-1" })

    expect(mockPrisma.vote.delete).toHaveBeenCalledWith({
      where: {
        nominationId_voterId: {
          nominationId: "nom-1",
          voterId: "user-1",
        },
      },
    })
    expect(result).toEqual(formatted)
  })

  it("swallows not found deletions and returns latest nomination", async () => {
    const prismaError = new Prisma.PrismaClientKnownRequestError("missing", {
      code: "P2025",
      clientVersion: "6.16.2",
    })
    mockPrisma.vote.delete.mockRejectedValue(prismaError)
    fetchNominationByIdMock.mockResolvedValue(null)

    const result = await removeVote({ nominationId: "nom-1", voterId: "user-1" })

    expect(result).toBeNull()
  })
})
