import { NextRequest, NextResponse } from "next/server"

import { getServerAuthSession } from "@/lib/auth"
import { VoteError, castVote, removeVote } from "@/lib/votes"

type RouteContext = {
  params: Promise<{
    nominationId: string
  }>
}

async function resolveNominationId(context: RouteContext) {
  const { nominationId } = await context.params
  return nominationId?.trim() ?? ""
}

export async function POST(_: NextRequest, context: RouteContext) {
  const session = await getServerAuthSession()

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const nominationId = await resolveNominationId(context)

  if (!nominationId) {
    return NextResponse.json(
      { error: "Missing nomination id" },
      { status: 400 },
    )
  }

  try {
    const nomination = await castVote({
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

export async function DELETE(_: NextRequest, context: RouteContext) {
  const session = await getServerAuthSession()

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const nominationId = await resolveNominationId(context)

  if (!nominationId) {
    return NextResponse.json(
      { error: "Missing nomination id" },
      { status: 400 },
    )
  }

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
