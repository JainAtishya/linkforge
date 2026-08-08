const Session = require("../models/session.model");

const {
    hashToken
} = require("../utils/crypto");

const {
    SESSION_STATUS
} = require("../constants/session.constants");

const createSession = async ({
    sessionId,
    userId,
    refreshToken,
    deviceInfo,
    ipAddress,
    userAgent,
    expiresAt,
    dbSession
}) => {

    const refreshTokenHash =
        hashToken(refreshToken);

    const session = await Session.create(
        [
            {
                _id: sessionId,

                userId,

                refreshTokenHash,

                deviceInfo,

                ipAddress,

                userAgent,

                status: SESSION_STATUS.ACTIVE,

                expiresAt,

                lastUsedAt: new Date()
            }
        ],
        {
            session: dbSession
        }
    );

    return session[0];
};

module.exports = {
    createSession
};