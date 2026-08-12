const mongoose = require("mongoose");

const shortUrlSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true
        },

        originalUrl: {
            type: String,
            required: true,
            trim: true
        },

        shortCode: {
            type: String,
            required: true,
            unique: true,
            index: true
        },

        isActive: {
            type: Boolean,
            default: true,
            required: true
        },

        expiresAt: {
            type: Date,
            default: null
        }
    },
    {
        timestamps: true
    }
);

shortUrlSchema.index({
    shortCode: 1,
    isActive: 1
});

shortUrlSchema.index({
    userId: 1,
    createdAt: -1
});

module.exports = mongoose.model(
    "ShortUrl",
    shortUrlSchema
);