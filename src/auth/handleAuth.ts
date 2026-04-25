import { db } from "../database/db.ts";

export async function handleAuth(sessionId: number) {
  const sessionCheckQuery = `SELECT * FROM sessions WHERE id = ($1)`
  const params = [sessionId]
  try {
    const sessionCheckResult = await db.query(sessionCheckQuery, params)
    const session = sessionCheckResult.rows[0]

    console.log({ session })

    return session
  } catch (err) {
    throw (err)
  }

}
