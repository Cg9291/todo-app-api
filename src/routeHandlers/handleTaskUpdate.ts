import http from "node:http";
import { db } from "../database/db.ts";

export async function handleTaskUpdate(taskId: number, req: http.IncomingMessage) {
  let reqBody = '';

  try {
    for await (const chunk of req) {
      reqBody += chunk
    }
    const parsedReqBody = JSON.parse(reqBody)
    const { title, description } = parsedReqBody
    //todo: implement dynamic updates(based on params received)
    if (!title || !description) {
      throw Object.assign(new Error("Both title and description are required"), {
        code: "VALIDATION_ERROR"
      });
    }

    const result = await db.query(`
      UPDATE tasks 
        SET title = ($1), description=($2)
        WHERE id=($3)
        RETURNING *;
`, [title, description, taskId])

    return result.rows[0]
  } catch (err) {
    console.error("An error occured", err)
    throw err
  }
}
