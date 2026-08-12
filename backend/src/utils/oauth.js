const crypto = require("crypto");

const OAUTH_STATE_COOKIE = "oauth_state";

const generateOAuthState = () => {
    return crypto.randomBytes(32).toString("hex");
};

const setOAuthStateCookie = (res, state) => {
    res.cookie(OAUTH_STATE_COOKIE, state, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite:
            process.env.NODE_ENV === "production"
                ? "none"
                : "lax",
        maxAge: 10 * 60 * 1000,
        path: "/"
    });
};

const clearOAuthStateCookie = (res) => {
    res.clearCookie(OAUTH_STATE_COOKIE, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite:
            process.env.NODE_ENV === "production"
                ? "none"
                : "lax",
        path: "/"
    });
};

module.exports = {
    OAUTH_STATE_COOKIE,
    generateOAuthState,
    setOAuthStateCookie,
    clearOAuthStateCookie
};