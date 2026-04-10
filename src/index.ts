import http from 'node:http'
import fs from 'node:fs/promises'
import path from 'node:path';
import { handleSuccess } from './responseHandlers/handleSuccess.js';
const PORT = 3000;

const server = http.createServer(async (req, res) => {
  const baseUrl = `http://${req.headers.host}`
  const requestPath = req.url;
  const method = req.method
  const requestInfo = new URL(requestPath, baseUrl)
  const segments = requestInfo.pathname.split("/").filter(Boolean)
  console.log({ path: requestPath, method, requestInfo })


  if (requestInfo.pathname === "/") {
    if (method === 'GET') {
      const __dirname = import.meta.dirname
      const dataPath = path.join(__dirname, '../data', 'todos-list.json')
      let rawResource = await fs.readFile(dataPath, 'utf8')
      rawResource = JSON.parse(rawResource)
      console.log({ dataPath, rawResource })
      return handleSuccess(200, 'application/json', rawResource, res)
      // res.statusCode = 200
      // res.setHeader("Content-Type", "application/json")
      // return res.end(rawResource)
    }
    res.statusCode = 405;
    res.setHeader('Content-Type', 'application/json')
    return res.end(JSON.stringify({ error: "Only GET method can be perfomed on this endpoint" }))
  }

  if (segments[0].toLowerCase() === "todos") {
    if (method === 'POST') {
      let body = ''
      for await (const chunk of req) {
        body += chunk
      }
      const __dirname = import.meta.dirname
      const dataPath = path.join(__dirname, '../data', 'todos-list.json')
      let rawResource = await fs.readFile(dataPath, 'utf8')
      rawResource = JSON.parse(rawResource)
      console.log({ body })
      let parsedBody = JSON.parse(body)
      parsedBody = { id: Math.floor(Math.random() * 100), ...parsedBody }
      try {
        let updatedResource = [...rawResource, parsedBody]
        updatedResource = JSON.stringify(updatedResource)
        console.log({ rawResource, parsedBody, updatedResource })
        await fs.writeFile(dataPath, updatedResource, 'utf8')
        console.log("You successfully wrote to data")
      } catch (err) {
        console.log("There has been an error writing to the file", err)
      }
      return handleSuccess(200, 'application/json', parsedBody, res)
      // res.statusCode = 200
      // res.setHeader('Content-Type', 'application/json')
      // return res.end(JON.stringify(parsedBody))
    }
  }
  res.statusCode = 400;
  res.setHeader('Content-Type', 'application/json')
  return res.end(JSON.stringify({ error: "Wrong route/buddy" }))
})

server.listen(PORT, () => { `Server running on port:${PORT}` })
