const ShortUrl = require("../models/shortUrl.model");

const { generateShortCode } = require("../utils/shortCode");

const {
    validateUrl,
    validateCustomAlias
} = require("../validators/url.validator");

const {
    hashPassword,
    comparePassword
} = require("../utils/crypto");

const ApiError = require("../utils/ApiError");

const {
    StatusCodes
} = require("http-status-codes");

const {
    getCachedUrl,
    cacheUrl,
    DEFAULT_CACHE_TTL,
    invalidateUrlCache,
} = require("./cache.service");


const createShortUrl = async ({
    userId,
    originalUrl,
    expiresAt,
    customAlias,
    password
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
     * Validate custom alias if provided.
     */

    if (customAlias !== undefined) {

        if (!validateCustomAlias(customAlias)) {

            throw new ApiError(
                StatusCodes.BAD_REQUEST,
                "Invalid custom alias"
            );
        }
    }


    /*
     * Validate expiration if provided.
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
     * Prepare password protection.
     */

    let passwordHash = null;

    const isPasswordProtected =
        typeof password === "string" &&
        password.length > 0;


    if (isPasswordProtected) {

        if (password.length < 4) {

            throw new ApiError(
                StatusCodes.BAD_REQUEST,
                "Password must be at least 4 characters long"
            );
        }

        if (password.length > 100) {

            throw new ApiError(
                StatusCodes.BAD_REQUEST,
                "Password cannot exceed 100 characters"
            );
        }

        passwordHash =
            await hashPassword(password);
    }


    /*
     * Determine short code.
     *
     * Custom aliases are used directly.
     * Otherwise generate a random code.
     */

    if (customAlias) {

        try {

            const shortUrl =
                await ShortUrl.create({
                    userId,
                    originalUrl,
                    shortCode: customAlias,
                    expiresAt: expiresAt || null,
                    isPasswordProtected,
                    passwordHash
                });

            return shortUrl;

        } catch (error) {

            /*
             * Custom alias already exists.
             */

            if (
                error.code === 11000 &&
                error.keyPattern?.shortCode
            ) {

                throw new ApiError(
                    StatusCodes.CONFLICT,
                    "Custom alias is already in use"
                );
            }

            throw error;
        }
    }


    /*
     * Generate random short code.
     *
     * MongoDB's unique index protects us
     * against concurrent collisions.
     */

    for (
        let attempt = 0;
        attempt < 3;
        attempt++
    ) {

        const shortCode =
            generateShortCode();

        try {

            const shortUrl =
                await ShortUrl.create({
                    userId,
                    originalUrl,
                    shortCode,
                    expiresAt: expiresAt || null,
                    isPasswordProtected,
                    passwordHash
                });

            return shortUrl;

        } catch (error) {

            /*
             * Duplicate generated shortCode.
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

    /*
     * Check MongoDB first for URL state.
     *
     * Protected URLs must never bypass
     * password verification through Redis.
     */

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
     * Check expiration.
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
     * Protected URLs are NOT redirected
     * through the normal Redis path.
     */

    if (shortUrl.isPasswordProtected) {

        throw new ApiError(
            StatusCodes.UNAUTHORIZED,
            "Password required"
        );
    }


    /*
     * Only unprotected URLs use Redis.
     */

    let cachedUrl = null;

    try {

        cachedUrl =
            await getCachedUrl(
                shortCode
            );

    } catch (error) {

        console.error(
            "Redis GET failed:",
            error.message
        );
    }


    if (cachedUrl) {

        console.log(
            "REDIS CACHE HIT"
        );

        return cachedUrl;
    }


    console.log(
        "REDIS CACHE MISS"
    );


    /*
     * Cache the unprotected URL.
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


    if (cacheTtl > 0) {

        try {

            await cacheUrl(
                shortCode,
                shortUrl._id,
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


    return {

        urlId:
            shortUrl._id,

        originalUrl:
            shortUrl.originalUrl

    };
};


const getUrlAccessInfo = async (shortCode) => {

    const shortUrl =
        await ShortUrl.findOne({
            shortCode,
            isActive: true
        });

    if (!shortUrl) {

        throw new ApiError(
            StatusCodes.NOT_FOUND,
            "Short URL not found"
        );
    }


    /*
     * Check expiration.
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


    return shortUrl;
};

const verifyUrlPassword = async (
    shortCode,
    password
) => {

    if (
        typeof password !== "string" ||
        password.length === 0
    ) {

        throw new ApiError(
            StatusCodes.BAD_REQUEST,
            "Password is required"
        );
    }


    const shortUrl =
        await getUrlAccessInfo(
            shortCode
        );


    /*
     * URL is not password protected.
     */

    if (!shortUrl.isPasswordProtected) {

        throw new ApiError(
            StatusCodes.BAD_REQUEST,
            "This URL is not password protected"
        );
    }


    /*
     * Verify password against
     * stored bcrypt hash.
     */

    const passwordMatches =
        await comparePassword(
            password,
            shortUrl.passwordHash
        );


    if (!passwordMatches) {

        throw new ApiError(
            StatusCodes.UNAUTHORIZED,
            "Incorrect password"
        );
    }


    return {
        urlId: shortUrl._id,
        originalUrl: shortUrl.originalUrl,
        shortCode: shortUrl.shortCode
    };
};

const getUserUrls = async (
    userId,
    page,
    limit
) => {

    const skip =
        (page - 1) * limit;


    const [
        urls,
        total
    ] = await Promise.all([

        ShortUrl.find({
            userId,
        })
            .sort({
                createdAt: -1
            })
            .skip(skip)
            .limit(limit)
            .lean(),

        ShortUrl.countDocuments({
            userId,
        }),

    ]);


    return {
        urls,
        total,
        page,
        limit,
    };
};


const getUrlById = async (
    urlId,
    userId
) => {

    const shortUrl =
        await ShortUrl.findOne({
            _id: urlId,
            userId,
        }).lean();


    if (!shortUrl) {

        throw new ApiError(
            StatusCodes.NOT_FOUND,
            "Short URL not found"
        );
    }


    return shortUrl;
};


const updateUrl = async (
    urlId,
    userId,
    {
        originalUrl,
        expiresAt,
        isActive
    }
) => {

    /*
     * Find the URL AND verify ownership.
     */

    const shortUrl =
        await ShortUrl.findOne({
            _id: urlId,
            userId,
        });


    if (!shortUrl) {

        throw new ApiError(
            StatusCodes.NOT_FOUND,
            "Short URL not found"
        );
    }


    /*
     * Validate original URL if provided.
     */

    if (
        originalUrl !== undefined
    ) {

        if (!validateUrl(originalUrl)) {

            throw new ApiError(
                StatusCodes.BAD_REQUEST,
                "Invalid URL"
            );
        }

        shortUrl.originalUrl =
            originalUrl;
    }


    /*
     * Validate expiration if provided.
     */

    if (
        expiresAt !== undefined
    ) {

        if (expiresAt === null) {

            shortUrl.expiresAt =
                null;

        } else {

            const expiry =
                new Date(expiresAt);


            if (
                Number.isNaN(
                    expiry.getTime()
                ) ||
                expiry <= new Date()
            ) {

                throw new ApiError(
                    StatusCodes.BAD_REQUEST,
                    "Invalid expiration date"
                );
            }


            shortUrl.expiresAt =
                expiry;
        }
    }


    /*
     * Update active state if provided.
     */

    if (
        isActive !== undefined
    ) {

        if (
            typeof isActive !== "boolean"
        ) {

            throw new ApiError(
                StatusCodes.BAD_REQUEST,
                "isActive must be a boolean"
            );
        }


        /*
         * An expired URL cannot be activated.
         */

        if (
            isActive &&
            shortUrl.expiresAt &&
            shortUrl.expiresAt <= new Date()
        ) {

            throw new ApiError(
                StatusCodes.BAD_REQUEST,
                "Cannot activate an expired URL"
            );
        }


        shortUrl.isActive =
            isActive;
    }


    /*
     * Save MongoDB changes.
     */

    await shortUrl.save();


    /*
     * Invalidate Redis.
     *
     * We don't update the cache directly.
     * We simply remove the stale value.
     */

    try {

        await invalidateUrlCache(
            shortUrl.shortCode
        );

    } catch (error) {

        console.error(
            "Redis cache invalidation failed:",
            error.message
        );
    }


    return shortUrl;
};


const deleteUrl = async (
    urlId,
    userId
) => {

    const shortUrl =
        await ShortUrl.findOne({
            _id: urlId,
            userId,
        });


    if (!shortUrl) {

        throw new ApiError(
            StatusCodes.NOT_FOUND,
            "Short URL not found"
        );
    }


    /*
     * Already inactive.
     */

    if (!shortUrl.isActive) {

        return shortUrl;
    }


    shortUrl.isActive =
        false;


    await shortUrl.save();


    /*
     * Remove stale redirect cache.
     */

    try {

        await invalidateUrlCache(
            shortUrl.shortCode
        );

    } catch (error) {

        console.error(
            "Redis cache invalidation failed:",
            error.message
        );
    }


    return shortUrl;
};


module.exports = {
    createShortUrl,
    getOriginalUrl,
    getUserUrls,
    getUrlById,
    updateUrl,
    deleteUrl,
    getUrlAccessInfo,
    verifyUrlPassword
};