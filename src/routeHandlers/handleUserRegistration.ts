import http from 'node:http'
import { db } from '../database/db.ts'

interface RegistrationBody {
  email: string,
  password: string
}
export async function handleUserRegistration(req: http.IncomingMessage) {
  let reqBody = ""
  try {
    for await (const chunk of req) {
      reqBody += chunk
    }

    const result = await db.query('SELECT current_database()');
    const tasksTable = await db.query('SELECT * FROM tasks;')
    console.log(result.rows[0]);
    console.log(tasksTable.rows[0])

  } catch (err) {
    throw err
  }
  const parsedBody: RegistrationBody = JSON.parse(reqBody)
  if (!parsedBody.password || !parsedBody.email) {
    throw new Error("Both the password and the email field must be present")
  }
  let { email, password } = parsedBody

  email = email.trim()
  console.log({ email, password })
}
