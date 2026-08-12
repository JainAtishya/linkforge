const {
    register,
    login,
    refresh,
    logout,
    logoutAll
} = require("../services/auth.service");

const asyncHandler =
    require("../utils/asyncHandler");

const ApiResponse =
    require("../utils/ApiResponse");

const {
    toUserResponse
} = require("../mappers/user.mapper");

const {
    setAuthCookies
} = require("../utils/cookies");

const {
    StatusCodes
} = require("http-status-codes");

const ApiError =
    require("../utils/ApiError");

const {
    REFRESH_TOKEN_COOKIE,
    clearAuthCookies
} = require("../utils/cookies");

const registerUser = asyncHandler(
    async (req, res) => {

        const {
            name,
            email,
            password
        } = req.validatedData;

        const result = await register({
            name,
            email,
            password,

            deviceInfo: {
                browser: req.headers["sec-ch-ua"],
                os: req.headers["sec-ch-ua-platform"]
            },

            ipAddress:
                req.ip,

            userAgent:
                req.headers["user-agent"]
        });

        setAuthCookies(
            res,
            result.accessToken,
            result.refreshToken
        );

        return res
            .status(StatusCodes.CREATED)
            .json(
                new ApiResponse(
                    StatusCodes.CREATED,

                    {
                        user:
                            toUserResponse(
                                result.user
                            )
                    },

                    "User registered successfully"
                )
            );
    }
);


const loginUser = asyncHandler(
    async (req, res) => {

        const {
            email,
            password
        } = req.validatedData;

        const result = await login({
            email,
            password,

            deviceInfo: {
                browser:
                    req.headers["sec-ch-ua"],

                os:
                    req.headers["sec-ch-ua-platform"]
            },

            ipAddress:
                req.ip,

            userAgent:
                req.headers["user-agent"]
        });

        setAuthCookies(
            res,
            result.accessToken,
            result.refreshToken
        );

        return res
            .status(StatusCodes.OK)
            .json(
                new ApiResponse(
                    StatusCodes.OK,
                    {
                        user:
                            toUserResponse(
                                result.user
                            )
                    },
                    "Login successful"
                )
            );
    }
);


const refreshAccessToken = asyncHandler(
    async (req, res) => {

        const refreshToken =
            req.cookies?.refreshToken;

        if (!refreshToken) {

            throw new ApiError(
                StatusCodes.UNAUTHORIZED,
                "Refresh token required"
            );
        }

        const result =
            await refresh(
                refreshToken
            );

        setAuthCookies(
            res,
            result.accessToken,
            result.refreshToken
        );

        return res
            .status(StatusCodes.OK)
            .json(
                new ApiResponse(
                    StatusCodes.OK,
                    {
                        user:
                            toUserResponse(
                                result.user
                            )
                    },
                    "Token refreshed successfully"
                )
            );
    }
);


const logoutUser = asyncHandler(
    async (req, res) => {

        const refreshToken =
            req.cookies?.[
                REFRESH_TOKEN_COOKIE
            ];

        await logout(refreshToken);

        clearAuthCookies(res);

        return res
            .status(StatusCodes.OK)
            .json(
                new ApiResponse(
                    StatusCodes.OK,
                    null,
                    "Logged out successfully"
                )
            );
    }
);


const logoutAllUsers = asyncHandler(
    async (req, res) => {

        const userId =
            req.user.sub;

        await logoutAll(userId);

        clearAuthCookies(res);

        return res
            .status(StatusCodes.OK)
            .json(
                new ApiResponse(
                    StatusCodes.OK,
                    null,
                    "Logged out from all devices"
                )
            );
    }
);


module.exports = {
    registerUser,
    loginUser,
    refreshAccessToken,
    logoutUser,
    logoutAllUsers
};