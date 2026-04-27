import http from 'node:http'
import { db } from '../../database/db.ts';

export async function handleSessionCreation(userId: number, req: http.IncomingMessage) {

  const currentDate = new Date();
  const relativeExpiry = 60 * 60 * 1000;
  const expiryDate = new Date(currentDate.getTime() + relativeExpiry);
  const lastAccessedDate = currentDate;
  const reqHeaders = req.headers
  const ip = req.socket.remoteAddress
  const userAgent = reqHeaders['user-agent']

  const sessionCreationQuery = `INSERT INTO sessions (user_id,created_at,expires_at,last_accessed_at,ip,user_agent)VALUES($1,$2,$3,$4,$5,$6) RETURNING *`
  const sessionCreationParams = [userId, currentDate, expiryDate, lastAccessedDate, ip, userAgent]

  try {
    const sessionCreationResult = await db.query(sessionCreationQuery, sessionCreationParams)

    const sessionCreationResultRows = sessionCreationResult.rows
    const createdSessionId = sessionCreationResultRows[0].id

    const sessionInfo = {
      id: createdSessionId,
      maxAge: relativeExpiry,
      expires: expiryDate,
      httpOnly: true,
      sameSite: "Strict",
      //todo:maybe add domain as a key
    }
    //todo: add a way to close/delete old sessions for a given user when a new session is created for them
    return sessionInfo
  } catch (err) {
    console.error(err)
    throw err
  }
}
