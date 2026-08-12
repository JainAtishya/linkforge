const mongoose = require("mongoose");

const { SESSION_STATUS } = require("../constants/session.constants");

const sessionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    refreshTokenHash: {
      type: String,
      required: true,
    },

    status: {
      type: String,
      enum: Object.values(SESSION_STATUS),
      default: SESSION_STATUS.ACTIVE,
      required: true,
    },

    deviceInfo: {
      browser: String,
      os: String,
    },

    ipAddress: {
      type: String,
    },

    userAgent: {
      type: String,
    },

    expiresAt: {
      type: Date,
      required: true,
    },

    lastUsedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  },
);

sessionSchema.index({
  userId: 1,
});

sessionSchema.index({
  refreshTokenHash: 1,
});

module.exports = mongoose.model("Session", sessionSchema);
