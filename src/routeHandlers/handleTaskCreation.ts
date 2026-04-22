import fs from "node:fs/promises";
import http from 'node:http'
import type { ExistingTask } from '../types/types.ts'

export async function handleTaskCreation(path: string, req: http.IncomingMessage): Promise<ExistingTask> {
  try {
    let reqBody = ''
    for await (const chunk of req) {
      reqBody += chunk
    }

    const parsedReqBody = { id: Math.floor(Math.random() * 100), ...JSON.parse(reqBody) }

    const jsonDB = await fs.readFile(path, 'utf8')
    const parsedJsonDB = JSON.parse(jsonDB)

    const updatedDB = [...parsedJsonDB, parsedReqBody]
    await fs.writeFile(path, JSON.stringify(updatedDB), 'utf8')

    return parsedReqBody
  } catch (err) {
    console.error("Error", err)
    throw err
  }
}
