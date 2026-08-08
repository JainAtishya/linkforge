const mongoose = require("mongoose");

const User = require("../models/user.model");

const { hashPassword, comparePassword } = require("../utils/crypto");

const {
  generateAccessToken,
  generateRefreshToken,
} = require("./token.service");

const { createSession } = require("./session.service");

const ApiError = require("../utils/ApiError");

const { StatusCodes } = require("http-status-codes");

const { getRefreshTokenExpiryDate } = require("../utils/date");

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

module.exports = {
  register,
  login,
};
