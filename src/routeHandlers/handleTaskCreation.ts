import http from 'node:http'
import type { ExistingTask } from '../types/types.ts'
import { db } from "../database/db.ts";
import zod from 'zod';

export const TaskSchema = zod.object({
  title: zod.string("Title is required").trim().min(1, "Title is required"),
  description: zod.string("Description is required").trim().min(1, "Description is required")
})

export async function handleTaskCreation(req: http.IncomingMessage, userId: number): Promise<ExistingTask> {
  try {
    let reqBody = ''
    for await (const chunk of req) {
      reqBody += chunk
    }

    const parsedReqBody = JSON.parse(reqBody)
    const validatedBody = TaskSchema.parse(parsedReqBody)
    console.log({ validatedBody })

    const { title, description } = validatedBody

    const result = await db.query(
      `
      INSERT INTO tasks (title,description,user_id)
      VALUES($1,$2,$3)
      RETURNING id,title,description,user_id
      `,
      [title, description, userId]
    )

    const createdTask = result.rows[0]
    return createdTask
  } catch (err) {
    if (err instanceof zod.ZodError) {
      console.error(err.issues)
    }
    throw err
  }
}
