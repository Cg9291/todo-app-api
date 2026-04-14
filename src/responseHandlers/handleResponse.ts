import http from 'node:http'

export function handleResponse(statusCode: number, contentType: string, body: unknown, res: http.ServerResponse<http.IncomingMessage> & { req: http.IncomingMessage; }) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', contentType);
  return res.end(JSON.stringify(body, null, 2))
}
