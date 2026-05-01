import { db } from '../database/db.js'

export async function handleTaskDeletion(taskId: number, userId: number) {
  try {
    const result = await db.query(
      `
      DELETE FROM tasks 
      WHERE id = ($1) AND user_id=($2);
      `,
      [taskId, userId]
    )
    return (result.rowCount && result.rowCount > 0)
  }
  catch (err) {
    console.error("An error occured", err)
    throw err
  }

}
