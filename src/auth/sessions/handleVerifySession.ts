import { db } from "../../database/db.js";

export async function handleVerifySession(sessionId: number) {
  const sessionCheckQuery = `SELECT * FROM sessions WHERE id = ($1)`
  const params = [sessionId]
  try {
    const sessionCheckResult = await db.query(sessionCheckQuery, params)
    const session = sessionCheckResult.rows[0]
    if (sessionCheckResult.rows.length === 0) {
      return null
    }

    const sessionExpiry = session["expires_at"].getTime()
    const currentDateInMs = new Date().getTime()

    if (sessionExpiry <= currentDateInMs) {
      return null
    }

    return session
  } catch (err) {
    console.error(err)
    throw err
  }

}
