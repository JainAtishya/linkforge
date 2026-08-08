const {
    REFRESH_TOKEN_EXPIRY
} = require("../config/env");

const {
    getDurationInMs
} = require("./duration");

const getRefreshTokenExpiryDate = () => {

    return new Date(
        Date.now() +
        getDurationInMs(
            REFRESH_TOKEN_EXPIRY
        )
    );
};

module.exports = {
    getRefreshTokenExpiryDate
};