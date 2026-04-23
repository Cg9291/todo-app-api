import type { ExistingTask } from '../types/types.ts'
import { db } from '../database/db.ts'

export async function handleGetTasks(): Promise<ExistingTask[]> {
  try {
    const result = await db.query(
      `
      SELECT * FROM tasks
      `
    )
    return result.rows
  } catch (err) {
    console.error(`error ${err}`)
    throw err
  }

}
