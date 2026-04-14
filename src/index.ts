import http from 'node:http'
import { handleResponse } from './responseHandlers/handleResponse.js';
import { handleTaskCreation } from './routeHandlers/handleTaskCreation.js';
import { handleGetTasks } from './routeHandlers/handleGetTasks.js';
import path from "node:path"

const PORT = 3000;

const server = http.createServer(async (req, res) => {
  const baseUrl = `http://${req.headers.host}`
  const requestPath = req.url || '/';
  const method = req.method
  const requestInfo = new URL(requestPath, baseUrl)
  const segments = requestInfo.pathname.split("/").filter(Boolean)

  const __dirname = import.meta.dirname

  if (requestInfo.pathname === "/") {
    if (method === 'GET') {
      const dataPath = path.join(__dirname, '../data', 'todos-list.json')
      const data = await handleGetTasks(dataPath)

      return handleResponse(200, 'application/json', data, res)
    }

    return handleResponse(405, 'application/json', { error: "Only GET method can be performed on this endpoint" }, res)
  }

  if (segments[0].toLowerCase() === "todos") {
    if (method === 'POST') {
      const jsonDBPath = path.join(__dirname, '../data', 'todos-list.json')
      try {
        const parsedBody = await handleTaskCreation(jsonDBPath, req)
        return handleResponse(201, 'application/json', parsedBody, res)
      } catch (err) {
        console.error("Failed to create task", err)
        return handleResponse(500, 'application/json', { error: "Failed to create task" }, res)
      }
    }
    return handleResponse(405, 'application/json', { error: "Method not allowed" }, res)
  }
  handleResponse(400, 'application/json', { error: "Wrong route/buddy" }, res)
})

server.listen(PORT, () => { console.log(`Server running on port:${PORT}`) })
