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
    <main className="flex min-h-screen items-start justify-center px-4 py-14">
      <div className="w-full max-w-5xl rounded-2xl bg-white/10 p-6 shadow-xl backdrop-blur md:p-10">
        <h1 className="text-3xl font-semibold text-white md:text-4xl">
          Welcome back, {session.user.name ?? "Aztec member"}
        </h1>
        <p className="mt-2 text-white/70">
          Review nominations, cast your votes, and keep the recognition flowing.
        </p>
        <div className="mt-8">
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
      </div>
    </main>
  )
}
