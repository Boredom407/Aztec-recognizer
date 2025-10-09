import Link from "next/link"

import { NominationDashboard } from "@/components/nomination-dashboard"
import { LandingHero } from "@/components/landing-hero"
import { getServerAuthSession } from "@/lib/auth"
import { fetchNominationsPaginated } from "@/lib/nominations"
import { prisma } from "@/lib/prisma"

type HomePageProps = {
  searchParams?: {
    page?: string
    pageSize?: string
  }
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const session = await getServerAuthSession()

  if (!session?.user) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
        <LandingHero />
        <p className="mt-10 text-sm text-white/60">
          Curious who is leading the pack? {" "}
          <Link href="/leaderboard" className="font-semibold text-yellow-300 underline-offset-4 hover:underline">
            View the leaderboard
          </Link>
        </p>
      </main>
    )
  }

  const page = searchParams?.page ? Number(searchParams.page) : 1
  const pageSize = searchParams?.pageSize ? Number(searchParams.pageSize) : 20

  const [paginatedData, users] = await Promise.all([
    fetchNominationsPaginated({
      currentUserId: session.user.id,
      page,
      pageSize,
    }),
    prisma.user.findMany({
      select: {
        id: true,
        name: true,
        image: true,
        points: true,
      },
      orderBy: {
        name: "asc",
      },
    }),
  ])

  return (
    <main className="min-h-screen px-4 py-8 md:py-14">
      <div className="mx-auto w-full max-w-6xl">
        {/* Welcome Header */}
        <div className="mb-8 card-base p-6 md:p-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white md:text-4xl flex items-center gap-3">
                <span className="text-lime-500">👋</span>
                Welcome back, {session.user.name ?? "Aztec member"}
              </h1>
              <p className="mt-2 text-slate-400">
                Review nominations, cast your votes, and celebrate your community.
              </p>
            </div>
            <Link
              href="/leaderboard"
              className="hidden md:flex items-center gap-2 rounded-lg bg-slate-700 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-600 transition-all"
            >
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
              </svg>
              Leaderboard
            </Link>
          </div>
        </div>

        {/* Main Dashboard */}
        <NominationDashboard
          currentUser={session.user}
          nominations={paginatedData.nominations}
          users={users}
          pagination={{
            page: paginatedData.page,
            pageSize: paginatedData.pageSize,
            totalCount: paginatedData.totalCount,
            totalPages: paginatedData.totalPages,
            hasNextPage: paginatedData.hasNextPage,
            hasPreviousPage: paginatedData.hasPreviousPage,
          }}
        />
      </div>
    </main>
  )
}
