import { NextResponse } from "next/server"
import { z } from "zod"

import { getServerAuthSession } from "@/lib/auth"
import { fetchNominationById, fetchNominationsWithMeta } from "@/lib/nominations"
import { prisma } from "@/lib/prisma"

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

export async function GET() {
  const session = await getServerAuthSession()
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

  const nomination = await prisma.nomination.create({
    data: {
      nomineeId,
      nominatorId: session.user.id,
      reason: reason ?? null,
    },
  })

  const formatted = await fetchNominationById(nomination.id, session.user.id)
  return NextResponse.json({ nomination: formatted }, { status: 201 })
}
