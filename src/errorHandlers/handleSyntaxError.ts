import http from 'node:http'
import { handleResponse } from "../responseHandlers/handleResponse.js";

export function handleSyntaxError(res: http.ServerResponse) {
  return handleResponse(400, 'application/json', {
    error: 'Invalid JSON body'
  }, res);
}
