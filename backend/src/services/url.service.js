const ShortUrl =
    require("../models/shortUrl.model");

const {
    generateShortCode
} = require("../utils/shortCode");

const {
    validateUrl
} = require("../validators/url.validator");

const ApiError = require("../utils/ApiError");

const {
    StatusCodes
} = require("http-status-codes");

const createShortUrl = async ({
    userId,
    originalUrl,
    expiresAt
}) => {

    /*
     * Validate URL
     */

    if (!validateUrl(originalUrl)) {
        throw new ApiError(
            StatusCodes.BAD_REQUEST,
            "Invalid URL"
        );
    }


    /*
     * Validate expiration if provided
     */

    if (expiresAt) {

        const expiry =
            new Date(expiresAt);

        if (
            Number.isNaN(expiry.getTime()) ||
            expiry <= new Date()
        ) {
            throw new ApiError(
                StatusCodes.BAD_REQUEST,
                "Invalid expiration date"
            );
        }

        expiresAt = expiry;
    }


    /*
     * Generate + insert.
     *
     * MongoDB's unique index protects us
     * against concurrent collisions.
     */

    for (let attempt = 0; attempt < 3; attempt++) {

        const shortCode =
            generateShortCode();

        try {

            const shortUrl =
                await ShortUrl.create({
                    userId,
                    originalUrl,
                    shortCode,
                    expiresAt: expiresAt || null
                });

            return shortUrl;

        } catch (error) {

            /*
             * Duplicate shortCode.
             *
             * Generate another one and retry.
             */

            if (
                error.code === 11000 &&
                error.keyPattern?.shortCode
            ) {
                continue;
            }

            throw error;
        }
    }

    throw new ApiError(
        StatusCodes.INTERNAL_SERVER_ERROR,
        "Unable to generate unique short URL"
    );
};

module.exports = {
    createShortUrl
};