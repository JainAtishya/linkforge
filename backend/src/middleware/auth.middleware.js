const {
    verifyAccessToken
} = require("../services/token.service");

const ApiError =
    require("../utils/ApiError");

const {
    StatusCodes
} = require("http-status-codes");

const {
    ACCESS_TOKEN_COOKIE
} = require("../utils/cookies");


const authenticate = (
    req,
    res,
    next
) => {

    const token =
        req.cookies?.[
            ACCESS_TOKEN_COOKIE
        ];

    if (!token) {

        return next(
            new ApiError(
                StatusCodes.UNAUTHORIZED,
                "Authentication required"
            )
        );
    }

    try {

        const payload =
            verifyAccessToken(token);

        req.user = payload;

        next();

    } catch (error) {

        return next(
            new ApiError(
                StatusCodes.UNAUTHORIZED,
                "Invalid or expired access token"
            )
        );
    }
};


module.exports = authenticate;