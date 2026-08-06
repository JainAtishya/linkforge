const mongoose = require("mongoose");
const { AUTH_PROVIDERS } = require("../constants/auth.constants");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    passwordHash: {
      type: String,
    },

    authProvider: {
      type: String,

      enum: Object.values(AUTH_PROVIDERS),

      default: AUTH_PROVIDERS.LOCAL,
    },

    emailVerified: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("User", userSchema);
