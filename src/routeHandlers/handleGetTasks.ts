import fs from 'node:fs/promises'
import type { ExistingTask } from '../types/types.ts'

export async function handleGetTasks(dataPath: string): Promise<ExistingTask[]> {

  try {
    const rawResource = await fs.readFile(dataPath, 'utf8')
    const parseResource = JSON.parse(rawResource)

    return parseResource
  } catch (err) {
    console.error(`error ${err}`)
    return []
  }

}
