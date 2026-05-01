import { handleResponse } from "../responseHandlers/handleResponse.js";
export function handleSyntaxError(res) {
    return handleResponse(400, 'application/json', {
        error: 'Invalid JSON body'
    }, res);
}
