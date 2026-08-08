const {
    NODE_ENV,
    ACCESS_TOKEN_EXPIRY,
    REFRESH_TOKEN_EXPIRY
} = require("../config/env");

const {
    getDurationInMs
} = require("./duration");

const isProduction =
    NODE_ENV === "production";

const ACCESS_TOKEN_COOKIE = "accessToken";
const REFRESH_TOKEN_COOKIE = "refreshToken";

const setAuthCookies = (
    res,
    accessToken,
    refreshToken
) => {

    res.cookie(
        ACCESS_TOKEN_COOKIE,
        accessToken,
        {
            httpOnly: true,
            secure: isProduction,
            sameSite: isProduction
                ? "none"
                : "lax",
            path: "/",
            maxAge:
                getDurationInMs(
                    ACCESS_TOKEN_EXPIRY
                )
        }
    );

    res.cookie(
        REFRESH_TOKEN_COOKIE,
        refreshToken,
        {
            httpOnly: true,
            secure: isProduction,
            sameSite: isProduction
                ? "none"
                : "lax",
            path: "/",
            maxAge:
                getDurationInMs(
                    REFRESH_TOKEN_EXPIRY
                )
        }
    );
};

module.exports = {
    setAuthCookies,
    ACCESS_TOKEN_COOKIE,
    REFRESH_TOKEN_COOKIE
};