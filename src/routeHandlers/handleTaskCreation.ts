import http from 'node:http'
import type { ExistingTask } from '../types/types.ts'
import { db } from "../database/db.ts";

export async function handleTaskCreation(req: http.IncomingMessage, userId: number): Promise<ExistingTask> {
  try {
    let reqBody = ''
    for await (const chunk of req) {
      reqBody += chunk
    }

    const parsedReqBody = JSON.parse(reqBody)
    const result = await db.query(
      `
      INSERT INTO tasks (title,description,user_id)
      VALUES($1, $2,$3)
      RETURNING id,title,description,user_id
      `,
      [parsedReqBody.title, parsedReqBody.description, userId]
    )

    const createdTask = result.rows[0]
    return createdTask
  } catch (err) {
    console.error("Error", err)
    throw err
  }
}
