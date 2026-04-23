import http from 'node:http'
import { handleResponse } from './responseHandlers/handleResponse.ts';
import { handleTaskCreation } from './routeHandlers/handleTaskCreation.ts';
import { handleGetTasks } from './routeHandlers/handleGetTasks.ts';
import { handleTaskUpdate } from './routeHandlers/handleTaskUpdate.ts';
import { handleTaskDeletion } from './routeHandlers/handleTaskDeletion.ts';
import type { ExistingTask } from './types/types.ts';
import { handleUserRegistration } from './routeHandlers/handleUserRegistration.ts';

const PORT = 3000;

const server = http.createServer(async (req, res) => {
  const baseUrl = `http://${req.headers.host}`
  const requestPath = req.url || '/';
  const method = req.method
  const requestInfo = new URL(requestPath, baseUrl)
  const queryObject = Object.fromEntries(requestInfo.searchParams)
  const segments = requestInfo.pathname.split("/").filter(Boolean)
  // console.log({ queryObject })
  // console.log({ requestInfo })


  if (requestInfo.pathname === "/register") {
    if (method === "POST") {
      await handleUserRegistration(req)
    }
  }

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
        const data = await handleGetTasks()
        const total = data.length
        const response = { data, total }

        if (Object.keys(queryObject).length === 0) {
          return handleResponse(200, 'application/json', response, res)
        }
        let { page, limit } = queryObject
        //todo: add dynamic parameter extraction and checks 

        const verifyIsNumber = (param: string) => {
          return Number.isInteger(Number(param)) && (Number(param)) > 0
        }

        let filteredData;
        let filteredTotal;
        let filteredResponse;

        const filterData = (_limit: number, _page: number = 1) => {
          const _filteredData = data.filter((task: ExistingTask) => {
            const limit = _limit >= 1 ? _limit : 1
            const page = _page >= 1 ? _page : 1

            const offset = (page - 1) * limit
            const taskIndex = data.indexOf(task)

            return taskIndex >= offset && taskIndex <= offset + limit - 1
          })

          return _filteredData
        }

        if (!limit) {
          return handleResponse(200, 'application/json', response, res)
        }

        if (!page) {
          if (!verifyIsNumber(limit)) {
            return handleResponse(400, 'application/json', { error: "Query param 'limit' must be a positive integer" }, res)
          }

          filteredData = filterData(Number(limit))
          filteredTotal = filteredData.length
          filteredResponse = { data: filteredData, page: 1, limit: Number(limit), total: filteredTotal }

          return handleResponse(200, 'application/json', filteredResponse, res)
        }

        if (!verifyIsNumber(limit) || !verifyIsNumber(page)) {
          return handleResponse(400, 'application/json', { error: "All query parameters must be a positive integer" }, res)
        }

        filteredData = filterData(Number(limit), Number(page))
        filteredTotal = filteredData.length
        filteredResponse = { data: filteredData, page: Number(page), limit: Number(limit), total: filteredTotal }


        return handleResponse(200, 'application/json', filteredResponse, res)
      }

      if (method === 'POST') {
        try {
          const parsedBody = await handleTaskCreation(req)
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
        const deleted = await handleTaskDeletion(parsedTodoId)

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

  handleResponse(404, 'application/json', { error: "Wrong route/buddy" }, res)
})

server.listen(PORT, () => { console.log(`Server running on port:${PORT}`) })
