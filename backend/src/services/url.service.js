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

const {
    getCachedUrl,
    cacheUrl,
    DEFAULT_CACHE_TTL
} = require("./cache.service");

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

const getOriginalUrl = async (shortCode) => {

    let cachedUrl = null;

    /*
     * 1. Try Redis.
     *
     * Redis is a cache, so a Redis failure
     * should not break redirects.
     */

    try {
        cachedUrl =
            await getCachedUrl(shortCode);
    } catch (error) {
        console.error(
            "Redis GET failed:",
            error.message
        );
    }


    /*
     * 2. Cache HIT
     */

    if (cachedUrl) {
        console.log("REDIS CACHE HIT");

        return cachedUrl;
    }


    /*
     * 3. Cache MISS
     *
     * Go to MongoDB.
     */

    console.log("REDIS CACHE MISS");

    const shortUrl =
        await ShortUrl.findOne({
            shortCode,
            isActive: true
        }).lean();


    if (!shortUrl) {
        throw new ApiError(
            StatusCodes.NOT_FOUND,
            "Short URL not found"
        );
    }


    /*
     * 4. Check expiration.
     */

    if (
        shortUrl.expiresAt &&
        shortUrl.expiresAt <= new Date()
    ) {
        throw new ApiError(
            StatusCodes.GONE,
            "Short URL has expired"
        );
    }


    /*
     * 5. Calculate cache TTL.
     */

    let cacheTtl =
        DEFAULT_CACHE_TTL;


    if (shortUrl.expiresAt) {

        const secondsUntilExpiry =
            Math.floor(
                (
                    shortUrl.expiresAt.getTime() -
                    Date.now()
                ) / 1000
            );

        cacheTtl =
            Math.min(
                DEFAULT_CACHE_TTL,
                secondsUntilExpiry
            );
    }


    /*
     * 6. Cache the valid URL.
     */

    if (cacheTtl > 0) {

        try {
            await cacheUrl(
                shortCode,
                shortUrl.originalUrl,
                cacheTtl
            );
        } catch (error) {
            console.error(
                "Redis SET failed:",
                error.message
            );
        }
    }


    /*
     * 7. Return the URL.
     */

    return shortUrl.originalUrl;
};

module.exports = {
    createShortUrl,
    getOriginalUrl
};