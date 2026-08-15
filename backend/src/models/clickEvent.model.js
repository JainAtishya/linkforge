const mongoose = require("mongoose");

const clickEventSchema = new mongoose.Schema(
    {
        eventId: {
            type: String,
            required: true,
            unique: true,
            index: true
        },

        urlId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "ShortUrl",
            required: true,
            index: true
        },

        shortCode: {
            type: String,
            required: true,
            index: true
        },

        timestamp: {
            type: Date,
            default: Date.now,
            index: true
        },

        ipAddress: {
            type: String
        },

        userAgent: {
            type: String
        },

        referrer: {
            type: String
        },

        country: {
            type: String
        },

        device: {
            type: String,
            enum: [
                "desktop",
                "mobile",
                "tablet",
                "unknown"
            ],
            default: "unknown"
        },

        browser: {
            type: String
        }
    },
    {
        timestamps: true
    }
);

clickEventSchema.index({
    urlId: 1,
    timestamp: -1
});

module.exports = mongoose.model(
    "ClickEvent",
    clickEventSchema
);