import type { ExistingTask } from '../types/types.ts'
import { db } from '../database/db.ts'

export async function handleGetTasks(page?: number, limit?: number): Promise<{ data: ExistingTask[], total: number }> {
  let selectQuery: string;
  let params: number[] = [];

  if (limit === 0 || page === 0) {
    throw new Error("0 is an invalid parameter")
  }

  if (!limit) {
    // the null comparison also covers undefined
    selectQuery = `SELECT * FROM tasks ORDER BY id`
  } else {
    if (!page) {
      // the null comparison also covers undefined

      selectQuery = `SELECT * FROM tasks ORDER BY id LIMIT ($1)`
      params = [limit]
    } else {
      selectQuery = `SELECT * FROM tasks ORDER BY id LIMIT ($1) OFFSET ($2)`
      params = [limit, (page - 1) * limit]
    }
  }

  try {
    const result = await db.query(
      selectQuery, params)

    const total = await db.query(
      `SELECT COUNT(*) AS total FROM tasks`
    );

    const totalRows = total.rows[0].total

    return { data: result.rows, total: totalRows }
  } catch (err) {
    console.error(`error ${err} `)
    throw err
  }

}
