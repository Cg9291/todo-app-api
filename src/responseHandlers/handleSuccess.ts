export function handleSuccess(statusCode: number, contentType: string, body, res: http.ServerResponse<http.IncomingMessage> & { req: http.IncomingMessage; }) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', contentType);
  return res.end(JSON.stringify(body, null, 2))
}
