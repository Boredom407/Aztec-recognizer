import { test, expect } from "@playwright/test"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

const TEST_USER = {
  id: "test-user",
  name: "Test User",
  email: "test@example.com",
}
const NOMINEE_USER = {
  id: "nominee-user",
  name: "Nominee User",
  email: "nominee@example.com",
}
const HELPER_USER = {
  id: "helper-user",
  name: "Helper User",
  email: "helper@example.com",
}

let seededNominationId: string
let dbAvailable = false

test.beforeAll(async () => {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    try {
      await prisma.$connect()
      dbAvailable = true
      break
    } catch (error) {
      if (attempt === 4) {
        console.warn("Skipping e2e tests because the database is unreachable", error)
      } else {
        await new Promise((resolve) => setTimeout(resolve, 2000))
      }
    }
  }

  if (!dbAvailable) {
    return
  }

  await prisma.vote.deleteMany({
    where: {
      OR: [
        { voterId: TEST_USER.id },
        { voterId: HELPER_USER.id },
      ],
    },
  })

  await prisma.nomination.deleteMany({
    where: {
      OR: [
        { nominatorId: { in: [TEST_USER.id, HELPER_USER.id] } },
        { nomineeId: { in: [TEST_USER.id, HELPER_USER.id] } },
        { nomineeId: NOMINEE_USER.id },
      ],
    },
  })

  await prisma.user.upsert({
    where: { id: TEST_USER.id },
    update: {
      name: TEST_USER.name,
      email: TEST_USER.email,
    },
    create: {
      id: TEST_USER.id,
      name: TEST_USER.name,
      email: TEST_USER.email,
    },
  })

  await prisma.user.upsert({
    where: { id: NOMINEE_USER.id },
    update: {
      name: NOMINEE_USER.name,
      email: NOMINEE_USER.email,
    },
    create: {
      id: NOMINEE_USER.id,
      name: NOMINEE_USER.name,
      email: NOMINEE_USER.email,
    },
  })

  await prisma.user.upsert({
    where: { id: HELPER_USER.id },
    update: {
      name: HELPER_USER.name,
      email: HELPER_USER.email,
    },
    create: {
      id: HELPER_USER.id,
      name: HELPER_USER.name,
      email: HELPER_USER.email,
    },
  })

  const seededNomination = await prisma.nomination.create({
    data: {
      nominatorId: HELPER_USER.id,
      nomineeId: TEST_USER.id,
      reason: "Seed nomination for voting",
    },
  })

  seededNominationId = seededNomination.id
})

test.afterAll(async () => {
  if (!dbAvailable) {
    return
  }
  await prisma.vote.deleteMany({
    where: {
      OR: [
        { voterId: TEST_USER.id },
        { voterId: HELPER_USER.id },
      ],
    },
  })
  await prisma.nomination.deleteMany({
    where: {
      OR: [
        { nominatorId: { in: [TEST_USER.id, HELPER_USER.id] } },
        { nomineeId: { in: [TEST_USER.id, HELPER_USER.id] } },
        { nomineeId: NOMINEE_USER.id },
      ],
    },
  })
  await prisma.$disconnect()
})

test("user can create nominations and vote/unvote", async ({ page }) => {
  test.skip(!dbAvailable, "Database unavailable for e2e run")

  await page.goto("/")

  await expect(page.getByText("Signed in as")).toBeVisible()

  await page.selectOption('[data-testid="nomination-select"]', NOMINEE_USER.id)
  await page.fill('[data-testid="nomination-reason"]', "Recognizing outstanding collaboration")

  await Promise.all([
    page.waitForResponse((response) =>
      response.url().includes("/api/nominations") && response.request().method() === "POST",
    ),
    page.getByRole("button", { name: "Submit nomination" }).click(),
  ])

  const newCard = page
    .locator('[data-testid^="nomination-card-"]')
    .filter({ hasText: "Recognizing outstanding collaboration" })

  await expect(newCard).toBeVisible()

  await newCard.getByRole("button", { name: /vote/i }).click()
  await expect(page.getByText("You cannot vote on your own nomination")).toBeVisible()

  const voteButton = page.getByTestId('vote-button-' + seededNominationId)

  await voteButton.click()
  await expect(voteButton).toHaveText(/Voted/i)

  await voteButton.click()
  await expect(voteButton).toHaveText("Vote")
})
