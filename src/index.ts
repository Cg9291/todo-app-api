import http from 'node:http'
import { handleResponse } from './responseHandlers/handleResponse.ts';
import { handleTaskCreation } from './routeHandlers/handleTaskCreation.ts';
import { handleGetTasks } from './routeHandlers/handleGetTasks.ts';
import { handleTaskUpdate } from './routeHandlers/handleTaskUpdate.ts';
import { handleTaskDeletion } from './routeHandlers/handleTaskDeletion.ts';
import { handleUserRegistration } from './auth/registration/handleUserRegistration.ts';
import { verifyIsNumber } from './utilities/verifyIsNumber.ts';
import { handleVerifySession } from './auth/sessions/handleVerifySession.ts';
import { handleLogin } from './auth/login/handleLogin.ts';

const PORT = 3000;

const server = http.createServer(async (req, res) => {
  const baseUrl = `http://${req.headers.host}`
  const requestPath = req.url || '/';
  const method = req.method
  const requestInfo = new URL(requestPath, baseUrl)
  const queryObject = Object.fromEntries(requestInfo.searchParams)
  const segments = requestInfo.pathname.split("/").filter(Boolean)

  const sessionId = req.headers["session-id"]
  // console.log({ sessionId })
  let authenticatedSession;

  if (requestInfo.pathname === "/register") {
    if (method === "POST") {
      try {
        const { session, _createdUser } = await handleUserRegistration(req)
        const { id, maxAge, expires, httpOnly, sameSite } = session

        res.statusCode = 201;
        res.setHeader('Set-Cookie', `sessionId=${id};Max-Age=${maxAge},expires=${expires},httpOnly=${httpOnly},SameSite=${sameSite},Path="/"`)

        return res.end(JSON.stringify({ ..._createdUser }, null, 2))
      } catch (err) {
        return handleResponse(500, 'application/json', { error: "Could not complete registration" }, res)
      }

    }
  }

  if (requestInfo.pathname === "/login") {
    if (method === "POST") {
      try {
        const loginResult = await handleLogin(req)
        if (!loginResult) {
          return handleResponse(401, 'application/json', { error: 'Invalid credentials' }, res);
        }

        const { session, authenticatedUser } = loginResult

        // if (!session) {
        //   return handleResponse(500, "application/json", { error: "Could not log user in" }, res)
        // }
        const { id, maxAge, expires, httpOnly, sameSite } = session

        res.statusCode = 200;
        res.setHeader('Set-Cookie', `sessionId=${id};Max-Age=${maxAge},expires=${expires},httpOnly=${httpOnly},SameSite=${sameSite},Path="/"`)

        return res.end(JSON.stringify({ ...authenticatedUser }, null, 2))
      } catch (err) {
        //todo: maybe consider adding session info to the response as well(here and in register)
        return handleResponse(500, "application/json", { error: "Could not log user in" }, res)
      }
    }
  }

  try {
    authenticatedSession = await handleVerifySession(Number(sessionId))
  } catch (err) {
    return handleResponse(500, 'application/json', { error: "Something went wrong during authentication check" }, res)
  }

  if (authenticatedSession) {
    const userId = authenticatedSession["user_id"]

    if (requestInfo.pathname === "/") {
      if (method === 'GET') {
        res.writeHead(301, { 'location': 'todos/' })
        return res.end()
      }

      return handleResponse(405, 'application/json', { error: "Only GET method can be performed on this endpoint" }, res)
    }

    if (segments[0]?.toLowerCase() === "todos") {
      if (!segments[1]) {
        if (method === "GET") {
          try {
            if (Object.keys(queryObject).length === 0) {
              const data = await handleGetTasks(userId)
              return handleResponse(200, 'application/json', data, res)
            }

            const { page, limit } = queryObject
            const hasPage = page !== undefined;
            const hasLimit = limit !== undefined;

            if (!hasPage && !hasLimit) {
              const data = await handleGetTasks(userId);
              return handleResponse(200, 'application/json', data, res);
            }

            if (!hasPage && hasLimit) {
              if (!verifyIsNumber(limit)) {
                return handleResponse(400, 'application/json', { error: 'limit must be a positive integer' }, res)
              };

              const data = await handleGetTasks(1, Number(limit));

              return handleResponse(200, 'application/json', { data: data.data, page: 1, limit: Number(limit), total: Number(data.total) }, res);
            }

            if (hasPage && !hasLimit) {
              return handleResponse(400, 'application/json', { error: "limit is required when page is provided" }, res);
            }

            if (!verifyIsNumber(page!) || !verifyIsNumber(limit!)) {
              return handleResponse(400, 'application/json', { error: 'page and limit must be positive integers' }, res);
            }
            const data = await handleGetTasks(Number(page), Number(limit))
            return handleResponse(200, 'application/json', { data: data.data, page: Number(page), limit: Number(limit), total: Number(data.total) }, res)
          } catch (err) {
            console.error(err)
            return handleResponse(500, 'application/json', { error: 'Failed to fetch tasks' }, res)
          }
        }

        if (method === 'POST') {
          try {
            const parsedBody = await handleTaskCreation(req, authenticatedSession["user_id"])
            return handleResponse(201, 'application/json', parsedBody, res)
          } catch (err) {
            console.error("Failed to create task", err)
            return handleResponse(500, 'application/json', { error: "Failed to create task" }, res)
          }
        }

        return handleResponse(405, 'application/json', { error: "Method not allowed" }, res)
      }

      const todoId = segments[1]
      const parsedTodoId = Number(todoId)

      if (isNaN(parsedTodoId)) {
        return handleResponse(400, 'application/json', { error: "The id path parameter should be a number" }, res)
      }

      if (method === "PUT") {
        try {
          const updatedTask = await handleTaskUpdate(
            parsedTodoId,
            userId,
            req
          )
          if (!updatedTask) {
            return handleResponse(404, 'application/json', { error: "Could not find task" }, res)
          }

          return handleResponse(200, 'application/json', { message: "Resource was successfully updated", updatedTask }, res)
        } catch (err) {
          const e = err as Error & { code?: string }

          if (e.code === "VALIDATION_ERROR") {
            return handleResponse(400, 'application/json', { error: e.message }, res)
          }

          if (e instanceof SyntaxError) {
            return handleResponse(400, 'application/json', { error: 'Invalid JSON body' }, res);
          }

          return handleResponse(500, 'application/json', { error: 'Failed to update task' }, res);
        }
      }

      if (method === "DELETE") {
        try {
          const deleted = await handleTaskDeletion(parsedTodoId, userId)

          if (!deleted) {
            return handleResponse(404, 'application/json', { error: "Task not found" }, res)
          }

          res.statusCode = 204;
          return res.end()
        } catch (err) {
          return handleResponse(500, 'application/json', { error: "Failed to delete task" }, res)
        }
      }

      return handleResponse(405, 'application/json', { error: "Method not allowed" }, res)
    }
  } else {
    return handleResponse(401, 'application/json', { error: "Invalid or expired session" }, res)
  }

  handleResponse(404, 'application/json', { error: "Wrong route/buddy" }, res)
})

server.listen(PORT, () => { console.log(`Server running on port:${PORT}`) })
