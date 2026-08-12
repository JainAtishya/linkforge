const {
    googleClient
} = require("../config/google");

const {
    GOOGLE_CLIENT_ID
} = require("../config/env");


const GOOGLE_SCOPES = [
    "openid",
    "email",
    "profile"
];


const generateGoogleAuthUrl = (
    state
) => {

    return googleClient.generateAuthUrl({
        access_type: "offline",

        scope: GOOGLE_SCOPES,

        include_granted_scopes: true,

        state
    });
};


const exchangeCodeForTokens = async (
    code
) => {

    const {
        tokens
    } = await googleClient.getToken(
        code
    );

    return tokens;
};


const verifyGoogleIdToken = async (
    idToken
) => {

    const ticket =
        await googleClient.verifyIdToken({
            idToken,
            audience: GOOGLE_CLIENT_ID
        });

    return ticket.getPayload();
};


module.exports = {
    generateGoogleAuthUrl,
    exchangeCodeForTokens,
    verifyGoogleIdToken
};