import { describe, expect, it, beforeEach, beforeAll, vi } from "vitest"

const getServerAuthSessionMock = vi.fn()
const castVoteMock = vi.fn()
const removeVoteMock = vi.fn()

vi.mock("@/lib/auth", () => ({
  getServerAuthSession: getServerAuthSessionMock,
}))

vi.mock("@/lib/votes", () => ({
  castVote: castVoteMock,
  removeVote: removeVoteMock,
  VoteError: class extends Error {
    status = 400
    constructor(message: string, status = 400) {
      super(message)
      this.status = status
    }
  },
}))

let POST: typeof import("../../app/api/votes/route").POST
let DELETE: typeof import("../../app/api/votes/route").DELETE
let VoteErrorClass: typeof import("@/lib/votes").VoteError

beforeAll(async () => {
  const votesModule = await import("@/lib/votes")
  VoteErrorClass = votesModule.VoteError
  const routeModule = await import("../../app/api/votes/route")
  POST = routeModule.POST
  DELETE = routeModule.DELETE
})

describe("/api/votes", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("requires authentication", async () => {
    getServerAuthSessionMock.mockResolvedValue(null)

    const request = new Request("http://localhost/api/votes", {
      method: "POST",
      body: JSON.stringify({ nominationId: "nom-1" }),
      headers: { "Content-Type": "application/json" },
    })

    const response = await POST(request)
    expect(response.status).toBe(401)
  })

  it("returns a 201 with nomination payload on success", async () => {
    getServerAuthSessionMock.mockResolvedValue({ user: { id: "u1" } })
    castVoteMock.mockResolvedValue({ id: "nom-1", voteCount: 3 })

    const request = new Request("http://localhost/api/votes", {
      method: "POST",
      body: JSON.stringify({ nominationId: "nom-1" }),
      headers: { "Content-Type": "application/json" },
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(201)
    expect(castVoteMock).toHaveBeenCalledWith({ nominationId: "nom-1", voterId: "u1" })
    expect(data).toEqual({ nomination: { id: "nom-1", voteCount: 3 } })
  })

  it("translates VoteError responses", async () => {
    getServerAuthSessionMock.mockResolvedValue({ user: { id: "u1" } })
    castVoteMock.mockRejectedValue(new VoteErrorClass("Already voted", 409))

    const request = new Request("http://localhost/api/votes", {
      method: "POST",
      body: JSON.stringify({ nominationId: "nom-1" }),
      headers: { "Content-Type": "application/json" },
    })

    const response = await POST(request)
    expect(response.status).toBe(409)
  })

  it("allows removing a vote", async () => {
    getServerAuthSessionMock.mockResolvedValue({ user: { id: "u1" } })
    removeVoteMock.mockResolvedValue({ id: "nom-1", voteCount: 1 })

    const request = new Request("http://localhost/api/votes", {
      method: "DELETE",
      body: JSON.stringify({ nominationId: "nom-1" }),
      headers: { "Content-Type": "application/json" },
    })

    const response = await DELETE(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(removeVoteMock).toHaveBeenCalledWith({ nominationId: "nom-1", voterId: "u1" })
    expect(data).toEqual({ nomination: { id: "nom-1", voteCount: 1 } })
  })
})
