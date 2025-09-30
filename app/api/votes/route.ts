import { NextResponse } from "next/server"

import { getServerAuthSession } from "@/lib/auth"
import { VoteError, castVote, removeVote } from "@/lib/votes"

export async function POST(request: Request) {
  const session = await getServerAuthSession()

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  let payload: unknown

  try {
    payload = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 })
  }

  const nominationId = getNominationIdFromPayload(payload)

  if (!nominationId) {
    return NextResponse.json(
      { error: "Nomination id is required" },
      { status: 400 },
    )
  }

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

  let payload: unknown

  try {
    payload = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 })
  }

  const nominationId = getNominationIdFromPayload(payload)

  if (!nominationId) {
    return NextResponse.json(
      { error: "Nomination id is required" },
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

function getNominationIdFromPayload(payload: unknown) {
  if (
    payload &&
    typeof payload === "object" &&
    "nominationId" in payload &&
    typeof (payload as { nominationId: unknown }).nominationId === "string"
  ) {
    return (payload as { nominationId: string }).nominationId
  }

  return ""
}
