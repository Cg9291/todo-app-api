import http from 'node:http'
import type { ExistingTask } from '../types/types.ts'
import { db } from "../database/db.ts";

export async function handleTaskCreation(req: http.IncomingMessage): Promise<ExistingTask> {
  try {
    let reqBody = ''
    for await (const chunk of req) {
      reqBody += chunk
    }

    const parsedReqBody = JSON.parse(reqBody)
    const result = await db.query(
      `
      INSERT INTO tasks (title,description)
      VALUES($1, $2)
      RETURNING id,title,description
      `,
      [parsedReqBody.title, parsedReqBody.description]
    )

    const createdTask = result.rows[0]
    return createdTask
  } catch (err) {
    console.error("Error", err)
    throw err
  }
}
