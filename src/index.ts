import http from 'node:http'
import { handleResponse } from './responseHandlers/handleResponse.ts';
import { handleTaskCreation } from './routeHandlers/handleTaskCreation.ts';
import { handleGetTasks } from './routeHandlers/handleGetTasks.ts';
import path from "node:path"
import { handleTaskUpdate } from './routeHandlers/handleTaskUpdate.ts';
import { handleTaskDeletion } from './routeHandlers/handleDeleteTask.ts';
import type { ExistingTask } from './types/types.ts';

const PORT = 3000;

const server = http.createServer(async (req, res) => {
  const baseUrl = `http://${req.headers.host}`
  const requestPath = req.url || '/';
  const method = req.method
  const requestInfo = new URL(requestPath, baseUrl)
  const queryObject = Object.fromEntries(requestInfo.searchParams)
  const segments = requestInfo.pathname.split("/").filter(Boolean)
  console.log({ queryObject })
  const __dirname = import.meta.dirname
  const dataPath = path.join(__dirname, '../data', 'todos-list.json')
  console.log({ requestInfo })
  if (requestInfo.pathname === "/") {
    //todo: add redirection to todos/
    if (method === 'GET') {
      const data = await handleGetTasks(dataPath)

      return handleResponse(200, 'application/json', data, res)
    }

    return handleResponse(405, 'application/json', { error: "Only GET method can be performed on this endpoint" }, res)
  }

  if (segments[0]?.toLowerCase() === "todos") {
    if (!segments[1]) {
      if (method === "GET") {
        const data = await handleGetTasks(dataPath)

        if (Object.keys(queryObject).length === 0) {
          return handleResponse(200, 'application/json', data, res)
        }
        const { page, limit } = queryObject
        //todo: handle case where any of the params is falsey 
        console.log({ limit, page })
        const offset: number = (page - 1) * limit
        const filteredData = data.filter((task: ExistingTask) => {
          return data.indexOf(task) >= offset && data.indexOf(task) <= offset + limit - 1
        })
        console.log({ filteredData })
        return handleResponse(200, 'application/json', filteredData, res)
      }

      if (method === 'POST') {
        try {
          const parsedBody = await handleTaskCreation(dataPath, req)
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
      const updatedTask = await handleTaskUpdate(
        dataPath,
        parsedTodoId,
        req
      )

      if (!updatedTask) {
        return handleResponse(500, 'application/json', { error: "Something went wrong, resource could not be updated" }, res)
      }
      return handleResponse(200, 'application/json', { message: "Resource was successfully updated", updatedTask }, res)
    }

    if (method === "DELETE") {
      const updatedData = await handleTaskDeletion(dataPath, parsedTodoId)

      if (!updatedData) {
        return handleResponse(500, 'application/json', { error: "Something went wrong, resource could not be deleted" }, res)
      }

      return handleResponse(200, 'application/json', { message: "Resource was successfully deleted", updatedData, /* taskId: todoId */ }, res)
    }

    return handleResponse(405, 'application/json', { error: "Method not allowed" }, res)
  }
  handleResponse(404, 'application/json', { error: "Wrong route/buddy" }, res)
})

server.listen(PORT, () => { console.log(`Server running on port:${PORT}`) })
