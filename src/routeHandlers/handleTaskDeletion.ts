import { db } from '../database/db.ts'

export async function handleTaskDeletion(taskId: number) {
  try {
    const result = await db.query(
      `
      DELETE FROM tasks 
      WHERE id = ($1);
      `,
      [taskId]
    )
    return (result.rowCount && result.rowCount > 0)
  }
  catch (err) {
    console.error("An error occured", err)
    throw err
  }

}
