export function handleSuccess(statusCode, contentType, body, res) {
    res.statusCode = statusCode;
    res.setHeader('Content-Type', contentType);
    return res.end(JSON.stringify(body, null, 2));
}
