import http from "node:http";
import { db } from "../database/db.ts";
import { TaskSchema } from "./handleTaskCreation.ts";
import zod from "zod";


export async function handleTaskUpdate(taskId: number, userId: number, req: http.IncomingMessage) {
  let reqBody = '';
  console.log({ taskId })
  try {
    for await (const chunk of req) {
      reqBody += chunk
    }
    const parsedReqBody = JSON.parse(reqBody)
    const validatedBody = TaskSchema.parse(parsedReqBody)
    const { title, description } = validatedBody

    //todo: implement dynamic updates(based on params received)


    const result = await db.query(`
      UPDATE tasks 
        SET title = ($1), description=($2)
        WHERE (id=($3) AND user_id=($4))
        RETURNING *;
`, [title, description, taskId, userId])

    const updatedTask = result.rows[0]
    return updatedTask
  } catch (err) {
    if (err instanceof zod.ZodError) {
      console.error(err.issues)
    }
    throw err
  }
}
