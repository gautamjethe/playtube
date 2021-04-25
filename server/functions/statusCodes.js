exports.ok = () => {
    //The request was successfully completed.
    return 200
}

exports.created = () => {
    //A new resource was successfully created.
    return 200
}

exports.invalid = () => {
    //The request was invalid.
    return 400
}

exports.unauthorized = () => {
    //The request did not include an authentication token or the authentication token was expired.
    return 401
}

exports.forbidden = () => {
    //The client did not have permission to access the requested resource.
    return 403
}

exports.notFound = () => {
    //The requested resource was not found.
    return 404
}

exports.mehodNotAllowed = () => {
    //The HTTP method in the request was not supported by the resource. For example, the DELETE method cannot be used with the Agent API.
    return 405
}

exports.serverError = () => {
    //The request was not completed due to an internal error on the server side.
    return 500
}

exports.serviceUnavailable = () => {
    //The server was unavailable.
    return 503
}