/**
 * Standardizes API responses across the application.
 */
const success = (res, data, message = "Success", statusCode = 200) => {
    return res.status(statusCode).json(data);
};

const error = (res, message = "An internal server error occurred.", statusCode = 500, err = null) => {
    if (err) {
        console.error(`[API ERROR] ${message}:`, err);
    }
    return res.status(statusCode).json({ message });
};

const badRequest = (res, message = "Bad Request") => {
    return error(res, message, 400);
};

const unauthorized = (res, message = "Unauthorized") => {
    return error(res, message, 401);
};

const forbidden = (res, message = "Forbidden") => {
    return error(res, message, 403);
};

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
