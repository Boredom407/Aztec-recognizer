import { NextResponse } from "next/server"
import { z } from "zod"

import { getServerAuthSession } from "@/lib/auth"
import { VoteError, castVote, removeVote } from "@/lib/votes"
import { checkRateLimit, RateLimitError } from "@/lib/rate-limit"

// Schema to validate vote payload
const VotePayloadSchema = z.object({
  nominationId: z.string().trim().min(1, "Nomination ID is required"),
})

export async function POST(request: Request) {
  const session = await getServerAuthSession()

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Rate limit votes
  try {
    checkRateLimit(session.user.id, "votes")
  } catch (error) {
    if (error instanceof RateLimitError) {
      return NextResponse.json(
        { error: error.message },
        {
          status: error.status,
          headers: {
            "Retry-After": String(Math.ceil((error.resetAt - Date.now()) / 1000)),
          },
        },
      )
    }
    throw error
  }

  // Parse & validate JSON body
  let parsed
  try {
    const body = await request.json()
    parsed = VotePayloadSchema.safeParse(body)
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 })
  }

  if (!parsed.success) {
    const issue = parsed.error.issues[0]
    return NextResponse.json({ error: issue.message }, { status: 400 })
  }

  const { nominationId } = parsed.data

  try {
    const nomination = await castVote({
      nominationId,
      voterId: session.user.id,
    })

    return NextResponse.json({ nomination }, { status: 201 })
  } catch (error) {
    if (error instanceof VoteError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }

    throw error
  }
}

export async function DELETE(request: Request) {
  const session = await getServerAuthSession()

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Rate limit vote removals (use same limit as votes)
  try {
    checkRateLimit(session.user.id, "votes")
  } catch (error) {
    if (error instanceof RateLimitError) {
      return NextResponse.json(
        { error: error.message },
        {
          status: error.status,
          headers: {
            "Retry-After": String(Math.ceil((error.resetAt - Date.now()) / 1000)),
          },
        },
      )
    }
    throw error
  }

  // Parse & validate JSON body
  let parsed
  try {
    const body = await request.json()
    parsed = VotePayloadSchema.safeParse(body)
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 })
  }

  if (!parsed.success) {
    const issue = parsed.error.issues[0]
    return NextResponse.json({ error: issue.message }, { status: 400 })
  }

  const { nominationId } = parsed.data

  try {
    const nomination = await removeVote({
      nominationId,
      voterId: session.user.id,
    })

    return NextResponse.json({ nomination })
  } catch (error) {
    if (error instanceof VoteError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }

    throw error
  }
}
