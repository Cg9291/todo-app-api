import http from 'node:http'
import zod from 'zod'
import { handleResponse } from '../responseHandlers/handleResponse.ts'

export function handleValidationError(err: zod.ZodError, res: http.ServerResponse) {
  const errorMessages = err.issues.map((error) => error.message)

  return handleResponse(400, 'application/json', { error: "Validation failed", details: errorMessages }, res)
}
