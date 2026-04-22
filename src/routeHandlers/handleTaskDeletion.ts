import { readFile, writeFile } from 'node:fs/promises'
import type { ExistingTask } from '../types/types.ts'

export async function handleTaskDeletion(dataPath: string, taskId: number) {

  try {
    const rawData = await readFile(dataPath, 'utf8')
    if (!rawData) {
      return null
    }
    const parsedData = JSON.parse(rawData)

    const foundTask = parsedData.find((task: ExistingTask) => task.id === taskId)
    if (!foundTask) {
      return null
    }
    const foundTaskIndex = parsedData.indexOf(foundTask);

    const updatedData = parsedData.filter((task: ExistingTask) => {
      return parsedData.indexOf(task) !== foundTaskIndex;
    })

    await writeFile(dataPath, JSON.stringify(updatedData))
    return updatedData
  } catch (err) {
    console.error("An error occured", err)
    throw err
  }

}
