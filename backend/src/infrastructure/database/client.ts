import { drizzle } from 'drizzle-orm/node-postgres'
import pg from 'pg'
import * as schema from './schema'
import { config } from '../../config'

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL || config.DATABASE_URL,
  max: 10,
})

export const db = drizzle(pool, { schema })
export { pool }
