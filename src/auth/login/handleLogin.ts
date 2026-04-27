import http from 'node:http'
import { db } from '../../database/db.ts';
import { handleSessionCreation } from '../sessions/handleSessionCreation.ts';

export async function handleLogin(req: http.IncomingMessage) {
  let reqBody = "";

  try {
    for await (const chunk of req) {
      reqBody += chunk
    }
    const parsedBody = JSON.parse(reqBody)

    const { email, password } = parsedBody
    if (!email || !password) {
      throw new Error('Both email and password are required');
    }
    //todo:verify that email has UNIQUE constraint in DB 
    const query = `SELECT id,email,password  FROM users WHERE email = $1;`
    const params = [email]
    const queryResult = await db.query(query, params)
    if (queryResult.rows.length === 0) {
      return null
    }
    const foundUser = queryResult.rows[0]
    const session = await handleSessionCreation(foundUser.id, req)
    const { password: _password, ...authenticatedUser } = foundUser
    return { session, authenticatedUser }
  } catch (err) {

  }
}
