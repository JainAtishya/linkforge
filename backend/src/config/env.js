require("dotenv").config();

module.exports = {
    PORT: process.env.PORT || 5000,

    NODE_ENV: process.env.NODE_ENV || "development",

    MONGO_URI: process.env.MONGO_URI,

    ACCESS_TOKEN_SECRET: process.env.ACCESS_TOKEN_SECRET,

    REFRESH_TOKEN_SECRET: process.env.REFRESH_TOKEN_SECRET,

    ACCESS_TOKEN_EXPIRY:
        process.env.ACCESS_TOKEN_EXPIRY || "15m",

    REFRESH_TOKEN_EXPIRY:
        process.env.REFRESH_TOKEN_EXPIRY || "30d",

    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,

    GOOGLE_CLIENT_SECRET:
        process.env.GOOGLE_CLIENT_SECRET,

    GOOGLE_REDIRECT_URI:
        process.env.GOOGLE_REDIRECT_URI,

    APP_BASE_URL: process.env.APP_BASE_URL,

    FRONTEND_URL:process.env.FRONTEND_URL,
};