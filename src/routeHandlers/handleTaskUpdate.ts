import { readFile, writeFile } from "node:fs/promises";
import type { ExistingTask } from "../types/types.ts";
import http from "node:http";

export async function handleTaskUpdate(dataPath: string, taskId: number, req: http.IncomingMessage) {
  let reqBody = '';

  try {
    for await (const chunk of req) {
      reqBody += chunk
    }
    const parsedReqBody = JSON.parse(reqBody)

    const rawData = await readFile(dataPath, 'utf8')
    if (!rawData) {
      return null
    }
    const parsedData = JSON.parse(rawData)

    const foundTask = parsedData.find((task: ExistingTask) => task.id === taskId)

    if (!foundTask) {
      return null
    }

    const foundTaskIndex = parsedData.indexOf(foundTask)

    const updatedTask: ExistingTask = { ...foundTask, ...parsedReqBody }
    parsedData[foundTaskIndex] = updatedTask;

    await writeFile(dataPath, JSON.stringify(parsedData))
    return updatedTask
  } catch (err) {
    console.error("An error occured", err)
    throw err
  }
}
