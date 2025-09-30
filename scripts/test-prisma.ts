import { prisma } from "@/lib/prisma"

async function main() {
  const users = await prisma.user.findMany()
  console.log("Users:", users)
}

main()
  .catch((e) => {
    console.error("Error:", e)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
