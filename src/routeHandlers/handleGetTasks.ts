import fs from 'node:fs/promises'

export async function handleGetTasks(dataPath: string) {

  try {
    const rawResource = await fs.readFile(dataPath, 'utf8')
    const parseResource = JSON.parse(rawResource)

    return parseResource
  } catch (err) {
    console.error(`error ${err}`)
    return []
  }

}
