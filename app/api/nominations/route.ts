import { NextResponse } from "next/server"
import { Prisma } from "@prisma/client"
import { z } from "zod"

import { getServerAuthSession } from "@/lib/auth"
import { fetchNominationById, fetchNominationsWithMeta } from "@/lib/nominations"
import { prisma } from "@/lib/prisma"
import { checkRateLimit, RateLimitError } from "@/lib/rate-limit"

// Schema to validate and type the JSON body
const BodySchema = z.object({
  nomineeId: z.string().trim().min(1, "Nominee is required"),
  reason: z
    .string()
    .trim()
    .max(500, "Reason is too long (max 500 characters)")
    .optional()
    .transform((v) => (v && v.length ? v : undefined)), // normalize empty string -> undefined
})

export async function GET(request: Request) {
  const session = await getServerAuthSession()

  // Rate limit reads (optional, but prevents abuse)
  if (session?.user?.id) {
    try {
      checkRateLimit(session.user.id, "reads")
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
  }

  // Parse pagination parameters from URL
  const { searchParams } = new URL(request.url)
  const page = searchParams.get("page")
  const pageSize = searchParams.get("pageSize")

  // If pagination params exist, use paginated fetch
  if (page || pageSize) {
    const { fetchNominationsPaginated } = await import("@/lib/nominations")
    const result = await fetchNominationsPaginated({
      currentUserId: session?.user?.id,
      page: page ? Number(page) : undefined,
      pageSize: pageSize ? Number(pageSize) : undefined,
    })
    return NextResponse.json(result)
  }

  // Otherwise return all nominations (for backwards compatibility)
  const nominations = await fetchNominationsWithMeta({
    currentUserId: session?.user?.id,
  })
  return NextResponse.json({ nominations })
}

export async function POST(request: Request) {
  const session = await getServerAuthSession()

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Rate limit nominations
  try {
    checkRateLimit(session.user.id, "nominations")
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
    parsed = BodySchema.safeParse(body)
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 })
  }

  if (!parsed.success) {
    const issue = parsed.error.issues[0]
    return NextResponse.json({ error: issue.message }, { status: 400 })
  }

  const { nomineeId, reason } = parsed.data

  if (nomineeId === session.user.id) {
    return NextResponse.json(
      { error: "You cannot nominate yourself" },
      { status: 400 },
    )
  }

  const nominee = await prisma.user.findUnique({ where: { id: nomineeId } })
  if (!nominee) {
    return NextResponse.json({ error: "Nominee not found" }, { status: 404 })
  }

  try {
    const nomination = await prisma.nomination.create({
      data: {
        nomineeId,
        nominatorId: session.user.id,
        reason: reason ?? null,
      },
    })

    const formatted = await fetchNominationById(nomination.id, session.user.id)
    return NextResponse.json({ nomination: formatted }, { status: 201 })
  } catch (error) {
    // Handle duplicate nomination error
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        { error: "You have already nominated this person" },
        { status: 409 },
      )
    }

    throw error
  }
}
