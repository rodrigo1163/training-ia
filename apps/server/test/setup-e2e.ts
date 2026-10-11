import { execSync } from 'node:child_process'
import { randomUUID } from 'node:crypto'
import { PrismaPg } from '@prisma/adapter-pg'
import { config } from 'dotenv'
import { afterAll, beforeAll } from 'vitest'
import { PrismaClient } from 'prisma/generated/prisma/client.js'
import { DomainEvents } from '@/core/events/domain-events'

config({ path: '.env', override: true })
config({ path: '.env.test', override: true })

let prisma: PrismaClient

function generateUniqueDatabaseURL(schemaId: string) {
	if (!process.env.DATABASE_URL) {
		throw new Error('Please provider a DATABASE_URL environment variable.')
	}

	const url = new URL(process.env.DATABASE_URL)

	url.searchParams.set('schema', schemaId)

	return url.toString()
}

const schemaId = randomUUID()

beforeAll(async () => {
	const databaseURL = generateUniqueDatabaseURL(schemaId)

	process.env.DATABASE_URL = databaseURL

	DomainEvents.shouldRun = false

	prisma = new PrismaClient({
		adapter: new PrismaPg(
			{ connectionString: databaseURL },
			{ schema: schemaId },
		),
	})

	execSync('pnpm prisma migrate deploy')
})

afterAll(async () => {
	await prisma.$executeRawUnsafe(`DROP SCHEMA IF EXISTS "${schemaId}" CASCADE`)
	await prisma.$disconnect()
})
