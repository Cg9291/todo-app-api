import http from 'node:http'
import { db } from '../database/db.ts'
import { handleSessionCreation } from '../auth/handleSessionCreation.ts'

interface RegistrationBody {
  firstname: string,
  lastname: string,
  email: string,
  password: string
}

export async function handleUserRegistration(req: http.IncomingMessage) {
  let reqBody = ""

  try {
    for await (const chunk of req) {
      reqBody += chunk
    }
    const parsedBody = JSON.parse(reqBody)

    const { firstname, lastname, email, password } = parsedBody
    if (!firstname || !lastname || !email || !password) {
      throw new Error("All of first name, last name, email & password are required");

    }
    //todo: add password hashing & salting
    const checkIfAlreadyExistsResult = await db.query('SELECT * FROM users WHERE email = ($1) ', [email]);

    if (checkIfAlreadyExistsResult.rows.length !== 0) {
      throw new Error("User already exists")
    }

    const userCreationQuery = `INSERT INTO users (first_name,last_name,email,password)VALUES($1, $2, $3, $4) RETURNING *`

    const userCreationParams = [firstname, lastname, email, password]
    const userCreationResult = await db.query(userCreationQuery, userCreationParams)
    const userCreationResultRows = userCreationResult.rows
    const createdUser = userCreationResultRows[0]
    const { password: _password, ..._createdUser } = createdUser


    const session = await handleSessionCreation(createdUser.id, req)
    return { session, _createdUser }
  } catch (err) {
    throw err
  }
  // const parsedBody: RegistrationBody = JSON.parse(reqBody)
  // if (!parsedBody.password || !parsedBody.email) {
  //   throw new Error("Both the password and the email field must be present")
  // }
  // let { email, password } = parsedBody
  //
  // email = email.trim()
}
