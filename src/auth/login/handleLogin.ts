import http from 'node:http'
import { db } from '../../database/db.ts';
import { handleSessionCreation } from '../sessions/handleSessionCreation.ts';
import zod from 'zod';

const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d).{8,72}$/

const UserLoginSchema = zod.object({
  email: zod.string("Email is required").trim().min(1, "Email is required").email("Email must be a valid email"),
  password: zod.string("Password is required").trim().min(8, "Password must be at least 8 characters long").max(72, "Password cannot be longer than 72 characters long")  //todo: add back below version of validation(includes numbers in regex)
  // password: zod.string("Password is required").trim().min(8, "Password must be at least 8 characters long").max(72, "Password cannot be longer than 72 characters long").regex(passwordRegex, "Password must be 8 to 72 characters long and include at least one letter and one number."),
  // confirmPassword: zod.regex(passwordRegex)
})

export async function handleLogin(req: http.IncomingMessage) {
  let reqBody = "";

  try {
    for await (const chunk of req) {
      reqBody += chunk
    }
    const parsedBody = JSON.parse(reqBody)
    const validatedBody = UserLoginSchema.parse(parsedBody)

    const { email, password } = validatedBody

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
    if (err instanceof zod.ZodError) {
      console.error(err.issues)
    }
    throw err
  }
}
