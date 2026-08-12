const mongoose = require("mongoose");

const Session = require("../models/session.model");

const { hashToken } = require("../utils/crypto");

const {
  SESSION_STATUS,
  SESSION_ERRORS,
} = require("../constants/session.constants");

const createSession = async ({
  sessionId,
  userId,
  refreshToken,
  deviceInfo,
  ipAddress,
  userAgent,
  expiresAt,
  dbSession,
}) => {
  const refreshTokenHash = hashToken(refreshToken);

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
        lastUsedAt: new Date(),
      },
    ],
    {
      session: dbSession,
    },
  );

  return session[0];
};

const rotateRefreshToken = async ({
  sessionId,
  userId,
  oldRefreshTokenHash,
  newRefreshTokenHash,
}) => {
  const dbSession = await mongoose.startSession();

  try {
    let updatedSession;

    await dbSession.withTransaction(async () => {
      const session = await Session.findOne({
        _id: sessionId,
        userId,
        status: SESSION_STATUS.ACTIVE,
      }).session(dbSession);

      if (!session) {
        throw new Error(SESSION_ERRORS.NOT_FOUND);
      }

      if (session.expiresAt <= new Date()) {
        throw new Error(SESSION_ERRORS.EXPIRED);
      }

      /*
       * The refresh token presented by the
       * client must be the exact token currently
       * associated with this session.
       */

      if (session.refreshTokenHash !== oldRefreshTokenHash) {
        throw new Error(SESSION_ERRORS.REFRESH_TOKEN_REUSE);
      }

      /*
       * Rotate the token.
       */

      session.refreshTokenHash = newRefreshTokenHash;

      session.lastUsedAt = new Date();

      await session.save({
        session: dbSession,
      });

      updatedSession = session;
    });

    return updatedSession;
  } finally {
    await dbSession.endSession();
  }
};

const revokeSession = async (sessionId) => {
    return Session.findOneAndUpdate(
        {
            _id: sessionId,
            status: SESSION_STATUS.ACTIVE
        },
        {
            $set: {
                status: SESSION_STATUS.REVOKED
            }
        },
        {
            new: true
        }
    );
};


const revokeAllUserSessions = async (userId) => {
    return Session.updateMany(
        {
            userId,
            status: SESSION_STATUS.ACTIVE
        },
        {
            $set: {
                status: SESSION_STATUS.REVOKED
            }
        }
    );
};

module.exports = {
    createSession,
    rotateRefreshToken,
    revokeSession,
    revokeAllUserSessions
};  
