const {
    OAuth2Client
} = require("google-auth-library");

const {
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    GOOGLE_REDIRECT_URI
} = require("./env");

const googleClient =
    new OAuth2Client(
        GOOGLE_CLIENT_ID,
        GOOGLE_CLIENT_SECRET,
        GOOGLE_REDIRECT_URI
    );

module.exports = {
    googleClient
};