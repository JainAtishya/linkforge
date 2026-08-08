const {
    register,
    login
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


module.exports = {
    registerUser,
    loginUser
};