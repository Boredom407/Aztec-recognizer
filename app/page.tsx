import { NominationDashboard } from "@/components/nomination-dashboard"
import { SignInSection } from "@/components/sign-in-section"
import { getServerAuthSession } from "@/lib/auth"
import { fetchNominationsWithMeta } from "@/lib/nominations"
import { prisma } from "@/lib/prisma"

export default async function HomePage() {
  const session = await getServerAuthSession()

  const [nominations, users] = await Promise.all([
    fetchNominationsWithMeta({ currentUserId: session?.user?.id }),
    session?.user
      ? prisma.user.findMany({
          select: {
            id: true,
            name: true,
            image: true,
            points: true,
          },
          orderBy: {
            name: "asc",
          },
        })
      : Promise.resolve([]),
  ])

  return (
    <main className="min-h-screen bg-zinc-100 py-10">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4">
        {session?.user ? (
          <NominationDashboard
            currentUser={session.user}
            nominations={nominations}
            users={users}
          />
        ) : (
          <SignInSection />
        )}
      </div>
    </main>
  )
}
