import http from 'node:http'
import { db } from '../database/db.ts'

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
    console.log({ parsedBody })

    const { firstname, lastname, email, password } = parsedBody
    if (!firstname || !lastname || !email || !password) {
      throw new Error("All of first name, last name, email & password are required");

    }

    const checkIfAlreadyExistsResult = await db.query('SELECT * FROM users WHERE email = ($1) ', [email]);

    if (checkIfAlreadyExistsResult.rows.length !== 0) {
      throw new Error("User already exists")
    }

    const userInsertionQuery = `INSERT INTO users (first_name,last_name,email,password)VALUES($1, $2, $3, $4) RETURNING *`

    const userInsertionParams = [firstname, lastname, email, password]
    const userInsertionResult = await db.query(userInsertionQuery, userInsertionParams)
    const userInsertionResultRows = userInsertionResult.rows
    const createdUserId = userInsertionResultRows[0].id
    console.log({ result: userInsertionResult, resultRows: userInsertionResultRows, createdUserId })


    const currentDate = new Date();
    const relativeExpiry = 60 * 60 * 1000;
    const expiryDate = new Date(currentDate.getTime() + relativeExpiry);
    const lastAccessedDate = currentDate;
    const reqHeaders = req.headers
    const ip = req.socket.remoteAddress
    const userAgent = reqHeaders['user-agent']

    const sessionCreationQuery = `INSERT INTO sessions (user_id,created_at,expires_at,last_accessed_at,ip,user_agent)VALUES($1,$2,$3,$4,$5,$6) RETURNING *`
    const sessionCreationParams = [createdUserId, currentDate, expiryDate, lastAccessedDate, ip, userAgent]
    const sessionCreationResult = await db.query(sessionCreationQuery, sessionCreationParams)

    const sessionCreationResultRows = sessionCreationResult.rows
    const createdSessionId = sessionCreationResultRows[0].id
    console.log({ sessionCreationResultRows })

    const sessionInfo = {
      id: createdSessionId,
      maxAge: relativeExpiry,
      expires: expiryDate,
      httpOnly: true,
      sameSite: "Strict",
      //todo:maybe add domain as a key
    }
    return sessionInfo
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
