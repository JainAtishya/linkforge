const ApiError = require("../utils/ApiError");

const {
    StatusCodes
} = require("http-status-codes");

const {
    NODE_ENV
} = require("../config/env");


const errorHandler = (
    err,
    req,
    res,
    next
) => {

    // Always log unexpected errors during development
    if (NODE_ENV !== "production") {
        console.error("ERROR:", err);
    }

    const error =
        err instanceof ApiError
            ? err
            : new ApiError(
                StatusCodes.INTERNAL_SERVER_ERROR,
                "Internal Server Error"
            );

    return res
        .status(error.statusCode)
        .json({
            success: false,
            message: error.message,
            errors: error.errors || []
        });
};


module.exports = errorHandler;