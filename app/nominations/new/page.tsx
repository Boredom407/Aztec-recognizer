import { NominationDashboard } from "@/components/nomination-dashboard"
import { SignInSection } from "@/components/sign-in-section"
import { getServerAuthSession } from "@/lib/auth"
import type { NominationWithMeta } from "@/lib/nominations"
import { prisma } from "@/lib/prisma"

export default async function NewNominationPage() {
  const session = await getServerAuthSession()

  if (!session?.user) {
    return (
      <main className="min-h-screen bg-zinc-100 py-10">
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4">
          <SignInSection />
        </div>
      </main>
    )
  }

  const users = await prisma.user.findMany({
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

  const emptyFeed: NominationWithMeta[] = []

  return (
    <main className="min-h-screen bg-zinc-100 py-10">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4">
        <NominationDashboard
          currentUser={session.user}
          nominations={emptyFeed}
          users={users}
          showFeed={false}
        />
      </div>
    </main>
  )
}
