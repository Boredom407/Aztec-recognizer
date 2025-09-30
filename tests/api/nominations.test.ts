import { describe, expect, it, beforeEach, beforeAll, vi } from "vitest"

const mockPrisma = {
  user: {
    findUnique: vi.fn(),
  },
  nomination: {
    create: vi.fn(),
  },
}

const getServerAuthSessionMock = vi.fn()
const fetchNominationsWithMetaMock = vi.fn()
const fetchNominationByIdMock = vi.fn()

vi.mock("@/lib/prisma", () => ({
  prisma: mockPrisma,
}))

vi.mock("@/lib/auth", () => ({
  getServerAuthSession: getServerAuthSessionMock,
}))

vi.mock("@/lib/nominations", () => ({
  fetchNominationsWithMeta: fetchNominationsWithMetaMock,
  fetchNominationById: fetchNominationByIdMock,
}))

let GET: typeof import("../../app/api/nominations/route").GET
let POST: typeof import("../../app/api/nominations/route").POST

beforeAll(async () => {
  const mod = await import("../../app/api/nominations/route")
  GET = mod.GET
  POST = mod.POST
})

describe("/api/nominations", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("returns nominations for the current session", async () => {
    getServerAuthSessionMock.mockResolvedValue({ user: { id: "u1" } })
    fetchNominationsWithMetaMock.mockResolvedValue([{ id: "nom-1" }])

    const response = await GET()
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(fetchNominationsWithMetaMock).toHaveBeenCalledWith({ currentUserId: "u1" })
    expect(data).toEqual({ nominations: [{ id: "nom-1" }] })
  })

  it("requires authentication for POST", async () => {
    getServerAuthSessionMock.mockResolvedValue(null)

    const request = new Request("http://localhost/api/nominations", {
      method: "POST",
      body: JSON.stringify({ nomineeId: "u2" }),
      headers: { "Content-Type": "application/json" },
    })

    const response = await POST(request)
    expect(response.status).toBe(401)
  })

  it("rejects self nominations", async () => {
    getServerAuthSessionMock.mockResolvedValue({ user: { id: "u1" } })

    const request = new Request("http://localhost/api/nominations", {
      method: "POST",
      body: JSON.stringify({ nomineeId: "u1" }),
      headers: { "Content-Type": "application/json" },
    })

    const response = await POST(request)
    expect(response.status).toBe(400)
    const payload = await response.json()
    expect(payload.error).toMatch(/cannot nominate yourself/i)
  })

  it("returns 404 when nominee cannot be found", async () => {
    getServerAuthSessionMock.mockResolvedValue({ user: { id: "u1" } })
    mockPrisma.user.findUnique.mockResolvedValue(null)

    const request = new Request("http://localhost/api/nominations", {
      method: "POST",
      body: JSON.stringify({ nomineeId: "missing" }),
      headers: { "Content-Type": "application/json" },
    })

    const response = await POST(request)
    expect(response.status).toBe(404)
  })

  it("creates a nomination and returns formatted payload", async () => {
    getServerAuthSessionMock.mockResolvedValue({ user: { id: "u1" } })
    mockPrisma.user.findUnique.mockResolvedValue({ id: "u2" })
    mockPrisma.nomination.create.mockResolvedValue({ id: "nom-1" })
    fetchNominationByIdMock.mockResolvedValue({ id: "nom-1", voteCount: 0 })

    const request = new Request("http://localhost/api/nominations", {
      method: "POST",
      body: JSON.stringify({ nomineeId: "u2", reason: "Great" }),
      headers: { "Content-Type": "application/json" },
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(201)
    expect(mockPrisma.nomination.create).toHaveBeenCalledWith({
      data: {
        nomineeId: "u2",
        nominatorId: "u1",
        reason: "Great",
      },
    })
    expect(data).toEqual({ nomination: { id: "nom-1", voteCount: 0 } })
  })
})
