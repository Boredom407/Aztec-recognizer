import { NextRequest, NextResponse } from "next/server"

import { fetchLeaderboard } from "@/lib/leaderboard"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const page = parseOptionalNumber(searchParams.get("page"))
  const pageSize = parseOptionalNumber(searchParams.get("pageSize"))

  const leaderboard = await fetchLeaderboard({ page, pageSize })

  return NextResponse.json(leaderboard)
}

function parseOptionalNumber(value: string | null) {
  if (!value) {
    return undefined
  }

  const parsed = Number(value)

  if (Number.isNaN(parsed) || !Number.isFinite(parsed)) {
    return undefined
  }

  return parsed
}
