import { handleResponse } from '../responseHandlers/handleResponse.js';
export function handleValidationError(err, res) {
    const errorMessages = err.issues.map((error) => error.message);
    return handleResponse(400, 'application/json', { error: "Validation failed", details: errorMessages }, res);
}
