import { pool } from './client'

export async function enableVectorExtension(): Promise<void> {
  await pool.query('CREATE EXTENSION IF NOT EXISTS vector')
}
