# Testing & QA

## Commands

| Command | Description |
| ------- | ----------- |
| `pnpm lint` | ESLint across the workspace |
| `pnpm test:unit` | Vitest suite for helpers and API routes (Prisma/NextAuth mocked) |
| `pnpm test:e2e` | Playwright smoke covering sign-in, nominations, and votes |

## Vitest (unit & integration)

- Runs entirely in Node with Prisma/NextAuth mocked; no database required.
- Coverage can be generated with `pnpm test:unit -- --coverage` (reports land in `coverage/`).

## Playwright (end-to-end)

- Launches `pnpm dev` with `AUTH_TEST_MODE=true` so the API returns a deterministic session.
- Seeds fixture users and nominations through Prisma; tests skip gracefully if the database is unreachable (Neon branches can hibernate).
- Requires Playwright browsers: `pnpm exec playwright install chromium`.
- Linux hosts need system deps: `pnpm exec playwright install-deps` (or install `libnspr4`, `libnss3`, `libasound2`).

## Troubleshooting

- Run `pnpm tsx scripts/test-prisma.ts` to wake a hibernating database before executing E2E.
- Clear Playwright fixtures with `pnpm exec playwright test --reporter=list --project=chromium` to re-run a specific project.
