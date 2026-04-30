import http from 'node:http'
import { db } from '../../database/db.ts'
import { handleSessionCreation } from '../sessions/handleSessionCreation.ts'
import * as zod from 'zod'
import bcrypt from "bcrypt";

const nameRegex = /^\p{L}+(?:[ '-]\p{L}+)*$/u;
const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d).{8,72}$/

const UserRegistrationSchema = zod.object({
  firstname: zod.string("First name is required").trim().min(1, "First name must be at least 1 character long").max(50, "First name must not be longer than 50 characters").regex(nameRegex, "First name must only contain characters from a to z"),
  lastname: zod.string("Last name is required").trim().min(1, "Last name must be at least 1 character long").max(50, "Last name must not be longer than 50 characters").regex(nameRegex),
  email: zod.email("Email must be a valid email"),
  password: zod.string().trim().min(8, "Password must be at least 8 characters long").max(72, "Password cannot be longer than 72 characters long").regex(passwordRegex),
  // confirmPassword: zod.regex(passwordRegex)
})

export async function handleUserRegistration(req: http.IncomingMessage) {
  let reqBody = ""

  try {
    for await (const chunk of req) {
      reqBody += chunk
    }
    const parsedBody = JSON.parse(reqBody)
    const validatedBody = UserRegistrationSchema.parse(parsedBody)

    const { firstname, lastname, email, password } = validatedBody

    const checkIfAlreadyExistsResult = await db.query('SELECT * FROM users WHERE email = ($1) ', [email]);

    if (checkIfAlreadyExistsResult.rows.length !== 0) {
      throw Object.assign(new Error("User already exists"), {
        code: "USER_ALREADY_EXISTS"
      });
    }

    const userCreationQuery = `INSERT INTO users (first_name,last_name,email,password)VALUES($1, $2, $3, $4) RETURNING *`

    const encryptedPassword = await bcrypt.hash(password, 10)
    const userCreationParams = [firstname, lastname, email, encryptedPassword]
    const userCreationResult = await db.query(userCreationQuery, userCreationParams)
    const createdUser = userCreationResult.rows[0]
    const { password: _password, ..._createdUser } = createdUser


    const session = await handleSessionCreation(createdUser.id, req)
    return { session, _createdUser }
  } catch (err) {
    if (err instanceof zod.ZodError) {
      console.error(err.issues)
    }
    throw err
  }

}
