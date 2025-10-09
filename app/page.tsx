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
      <main className="flex min-h-screen flex-col items-center justify-center">
        <LandingHero />
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
    <main className="min-h-screen px-4 py-8 md:py-12">
      <div className="mx-auto w-full max-w-6xl space-y-8">
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
