import { describe, expect, it, beforeEach, beforeAll, vi } from "vitest"

const mockPrisma = {
  nomination: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
  },
  vote: {
    findMany: vi.fn(),
  },
}

vi.mock("@/lib/prisma", () => ({
  prisma: mockPrisma,
}))

let fetchNominationsWithMeta: typeof import("@/lib/nominations").fetchNominationsWithMeta
let fetchNominationById: typeof import("@/lib/nominations").fetchNominationById

beforeAll(async () => {
  const nominationsModule = await import("@/lib/nominations")
  fetchNominationsWithMeta = nominationsModule.fetchNominationsWithMeta
  fetchNominationById = nominationsModule.fetchNominationById
})

describe("fetchNominationsWithMeta", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("maps nomination data and flags voted nominations", async () => {
    const now = new Date()
    mockPrisma.nomination.findMany.mockResolvedValue([
      {
        id: "nom-1",
        reason: "Great work",
        createdAt: now,
        nominator: { id: "u1", name: "Alice", image: null },
        nominee: { id: "u2", name: "Bob", image: null, points: 10 },
        _count: { votes: 3 },
      },
    ])
    mockPrisma.vote.findMany.mockResolvedValue([
      { nominationId: "nom-1" },
    ])

    const result = await fetchNominationsWithMeta({ currentUserId: "u3" })

    expect(mockPrisma.nomination.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: { createdAt: "desc" },
      }),
    )
    expect(result).toEqual([
      {
        id: "nom-1",
        reason: "Great work",
        createdAt: now.toISOString(),
        nominator: { id: "u1", name: "Alice", image: null },
        nominee: { id: "u2", name: "Bob", image: null, points: 10 },
        voteCount: 3,
        hasVoted: true,
      },
    ])
  })

  it("applies custom filters and limit", async () => {
    mockPrisma.nomination.findMany.mockResolvedValue([])
    mockPrisma.vote.findMany.mockResolvedValue([])

    await fetchNominationsWithMeta({
      currentUserId: "u1",
      where: { nomineeId: "target" },
      orderBy: { createdAt: "asc" },
      take: 5,
    })

    expect(mockPrisma.nomination.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { nomineeId: "target" },
        orderBy: { createdAt: "asc" },
        take: 5,
      }),
    )
  })
})

describe("fetchNominationById", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("returns null when nomination is missing", async () => {
    mockPrisma.nomination.findUnique.mockResolvedValue(null)

    expect(await fetchNominationById("missing", "user"))
      .toBeNull()
  })

  it("returns mapped nomination when found", async () => {
    const now = new Date()
    mockPrisma.nomination.findUnique.mockResolvedValue({
      id: "nom-1",
      reason: "Nice",
      createdAt: now,
      nominator: { id: "u1", name: "Alice", image: null },
      nominee: { id: "u2", name: "Bob", image: null, points: 3 },
      _count: { votes: 2 },
    })
    mockPrisma.vote.findMany.mockResolvedValue([{ nominationId: "nom-1" }])

    const result = await fetchNominationById("nom-1", "u2")

    expect(result).toEqual({
      id: "nom-1",
      reason: "Nice",
      createdAt: now.toISOString(),
      nominator: { id: "u1", name: "Alice", image: null },
      nominee: { id: "u2", name: "Bob", image: null, points: 3 },
      voteCount: 2,
      hasVoted: true,
    })
  })
})
