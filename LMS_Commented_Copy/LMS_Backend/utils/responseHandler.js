/**
 * API RESPONSE HANDLER
 * Standardizes the way the server talks back to the frontend.
 * This ensures that every response (Success or Error) has a consistent format.
 */

/**
 * SUCCESS RESPONSE
 * Used when a request is fulfilled correctly (e.g., fetching a profile).
 * Defaults to HTTP 200 OK.
 */
const success = (res, data, message = "Success", statusCode = 200) => {
    return res.status(statusCode).json(data);
};

/**
 * GENERIC ERROR RESPONSE
 * Used for server failures. It logs the technical error for the developer
 * but sends a user-friendly message to the client.
 */
const error = (res, message = "An internal server error occurred.", statusCode = 500, err = null) => {
    if (err) {
        console.error(`[CRITICAL API ERROR] ${message}:`, err);
    }
    return res.status(statusCode).json({ message });
};

/**
 * BAD REQUEST (400)
 * Used when the user sends invalid data (e.g., missing email in login).
 */
const badRequest = (res, message = "Bad Request") => {
    return error(res, message, 400);
};

/**
 * UNAUTHORIZED (401)
 * Used when a user is not logged in or their token is invalid.
 */
const unauthorized = (res, message = "Unauthorized") => {
    return error(res, message, 401);
};

/**
 * FORBIDDEN (403)
 * Used when a logged-in user tries to access something they don't have
 * permission for (e.g., a student trying to delete a course).
 */
const forbidden = (res, message = "Forbidden") => {
    return error(res, message, 403);
};

/**
 * NOT FOUND (404)
 * Used when a requested resource (User, Course, File) does not exist.
 */
const notFound = (res, message = "Not Found") => {
    return error(res, message, 404);
};

module.exports = {
    success,
    error,
    badRequest,
    unauthorized,
    forbidden,
    notFound
};
