const mongoose = require("mongoose");

const User = require("../models/user.model");

const { hashPassword, comparePassword } = require("../utils/crypto");

const { SESSION_ERRORS } = require("../constants/session.constants");

const {
  verifyRefreshToken,
  generateAccessToken,
  generateRefreshToken,
} = require("./token.service");

const {
  exchangeCodeForTokens,
  verifyGoogleIdToken,
} = require("./google.service");

const {
  createSession,
  rotateRefreshToken,
  revokeSession,
  revokeAllUserSessions,
} = require("./session.service");

const ApiError = require("../utils/ApiError");

const { StatusCodes } = require("http-status-codes");

const { getRefreshTokenExpiryDate } = require("../utils/date");

const { hashToken } = require("../utils/crypto");

const register = async ({
  name,
  email,
  password,
  deviceInfo,
  ipAddress,
  userAgent,
}) => {
  const existingUser = await User.findOne({ email });

  if (existingUser) {
    throw new ApiError(StatusCodes.CONFLICT, "User already exists");
  }

  const passwordHash = await hashPassword(password);

  const dbSession = await mongoose.startSession();

  let result;

  try {
    await dbSession.withTransaction(async () => {
      /*
       * Generate the session ID first.
       * The refresh token will contain this ID.
       */

      const sessionId = new mongoose.Types.ObjectId();

      /*
       * Create the user inside
       * the MongoDB transaction.
       */

      const user = new User({
        name,
        email,
        passwordHash,
      });

      await user.save({
        session: dbSession,
      });

      /*
       * Generate tokens.
       */

      const accessToken = generateAccessToken(user);

      const refreshToken = generateRefreshToken(user, sessionId);

      /*
       * Create the session inside
       * the same transaction.
       */

      const expiresAt = getRefreshTokenExpiryDate();

      const session = await createSession({
        sessionId,

        userId: user._id,

        refreshToken,

        deviceInfo,

        ipAddress,

        userAgent,

        expiresAt,

        dbSession,
      });

      result = {
        user,
        accessToken,
        refreshToken,
        session,
      };
    });

    return result;
  } finally {
    await dbSession.endSession();
  }
};

const login = async ({ email, password, deviceInfo, ipAddress, userAgent }) => {
  const user = await User.findOne({
    email,
  });

  if (!user) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, "Invalid email or password");
  }

  const passwordMatches = await comparePassword(password, user.passwordHash);

  if (!passwordMatches) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, "Invalid email or password");
  }

  const dbSession = await mongoose.startSession();

  let result;

  try {
    await dbSession.withTransaction(async () => {
      const sessionId = new mongoose.Types.ObjectId();

      const accessToken = generateAccessToken(user);

      const refreshToken = generateRefreshToken(user, sessionId);

      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

      const session = await createSession({
        sessionId,
        userId: user._id,
        refreshToken,
        deviceInfo,
        ipAddress,
        userAgent,
        expiresAt,
        dbSession,
      });

      result = {
        user,
        accessToken,
        refreshToken,
        session,
      };
    });

    return result;
  } finally {
    await dbSession.endSession();
  }
};

const refresh = async (refreshToken) => {
  let payload;

  /*
   * 1. Verify JWT signature and expiration.
   */

  try {
    payload = verifyRefreshToken(refreshToken);
  } catch (error) {
    throw new ApiError(
      StatusCodes.UNAUTHORIZED,
      "Invalid or expired refresh token",
    );
  }

  /*
   * 2. Validate required claims.
   */

  if (!payload.sub || !payload.sid) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, "Invalid refresh token");
  }

  /*
   * 3. Find the user.
   */

  const user = await User.findById(payload.sub);

  if (!user) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, "Invalid refresh token");
  }

  /*
   * 4. Generate replacement tokens.
   *
   * IMPORTANT:
   * Same session ID.
   */

  const newAccessToken = generateAccessToken(user);

  const newRefreshToken = generateRefreshToken(user, payload.sid);

  /*
   * 5. Hash old + new refresh tokens.
   */

  const oldRefreshTokenHash = hashToken(refreshToken);

  const newRefreshTokenHash = hashToken(newRefreshToken);

  /*
   * 6. Atomically rotate the token.
   */

  try {
    await rotateRefreshToken({
      sessionId: payload.sid,
      userId: payload.sub,
      oldRefreshTokenHash,
      newRefreshTokenHash,
    });
  } catch (error) {
    if (error.message === SESSION_ERRORS.REFRESH_TOKEN_REUSE) {
      await revokeSession(payload.sid);

      throw new ApiError(
        StatusCodes.UNAUTHORIZED,
        "Refresh token reuse detected",
      );
    }

    if (error.message === SESSION_ERRORS.EXPIRED) {
      throw new ApiError(StatusCodes.UNAUTHORIZED, "Session expired");
    }

    throw new ApiError(StatusCodes.UNAUTHORIZED, "Invalid refresh session");
  }

  return {
    user,
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
  };
};

const logout = async (refreshToken) => {
  if (!refreshToken) {
    return;
  }

  let payload;

  try {
    payload = verifyRefreshToken(refreshToken);
  } catch (error) {
    /*
     * Even if the refresh token is already
     * expired/invalid, logout should still
     * clear the client's cookies.
     */
    return;
  }

  if (!payload.sid) {
    return;
  }

  await revokeSession(payload.sid);
};

const logoutAll = async (userId) => {
  await revokeAllUserSessions(userId);
};

const googleLogin = async (code) => {
  /*
   * 1. Exchange Google's authorization
   *    code for Google tokens.
   */

  const tokens = await exchangeCodeForTokens(code);

  if (!tokens.id_token) {
    throw new ApiError(
      StatusCodes.UNAUTHORIZED,
      "Google authentication failed",
    );
  }

  /*
   * 2. Verify Google's ID token.
   */

  const googleUser = await verifyGoogleIdToken(tokens.id_token);

  /*
   * 3. Validate the information we need.
   */

  if (!googleUser.sub || !googleUser.email || !googleUser.email_verified) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, "Invalid Google account");
  }

  const googleId = googleUser.sub;

  const email = googleUser.email.toLowerCase();

  const name = googleUser.name || "LinkForge User";

  /*
   * 4. First try to find the Google identity.
   */

  let user = await User.findOne({
    googleId,
  });

  /*
   * Existing Google-linked account.
   */

  if (!user) {
    /*
     * 5. No Google identity found.
     *
     * Check whether a LinkForge account
     * already exists with this verified email.
     */

    user = await User.findOne({
      email,
    });

    if (user) {
      /*
       * Existing local account.
       *
       * Link Google to it.
       */

      if (!user.googleId) {
        user.googleId = googleId;
        user.emailVerified = true;

        await user.save();
      } else if (user.googleId !== googleId) {
        throw new ApiError(
          StatusCodes.CONFLICT,
          "This email is already linked to another Google account",
        );
      }
    } else {
      /*
       * 6. Completely new Google user.
       */

      user = await User.create({
        name,
        email,
        googleId,
        authProvider: "GOOGLE",
        emailVerified: true,
      });
    }
  }

  /*
   * 7. Create a LinkForge session.
   */

  const sessionId = new mongoose.Types.ObjectId();

  const accessToken = generateAccessToken(user);

  const refreshToken = generateRefreshToken(user, sessionId.toString());

  await createSession({
    sessionId,
    userId: user._id,
    refreshToken,
    ipAddress: null,
    userAgent: null,
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  });

  return {
    user,
    accessToken,
    refreshToken,
  };
};

module.exports = {
  register,
  login,
  refresh,
  logout,
  logoutAll,
  googleLogin,
};
