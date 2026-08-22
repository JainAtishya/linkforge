const ShortUrl =
    require("../models/shortUrl.model");

const {
    generateShortCode
} = require("../utils/shortCode");

const {
    validateUrl,
    validateCustomAlias
} = require("../validators/url.validator");

const {
    hashPassword,
    comparePassword
} = require("../utils/crypto");

const ApiError =
    require("../utils/ApiError");

const {
    StatusCodes
} = require("http-status-codes");

const {
    getCachedUrl,
    cacheUrl,
    DEFAULT_CACHE_TTL,
    invalidateUrlCache
} = require("./cache.service");


/*
 * Create Short URL
 */
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
     * Validate custom alias
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
     * Validate expiration
     */
    if (expiresAt) {

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

        expiresAt = expiry;
    }


    /*
     * Prepare password protection
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
     * Custom alias
     */
    if (customAlias) {

        try {

            return await ShortUrl.create({
                userId,
                originalUrl,
                shortCode: customAlias,
                expiresAt: expiresAt || null,
                isPasswordProtected,
                passwordHash
            });

        } catch (error) {

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
     * Generate random short code
     */
    for (
        let attempt = 0;
        attempt < 3;
        attempt++
    ) {

        const shortCode =
            generateShortCode();

        try {

            return await ShortUrl.create({
                userId,
                originalUrl,
                shortCode,
                expiresAt: expiresAt || null,
                isPasswordProtected,
                passwordHash
            });

        } catch (error) {

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

/*
 * Get original URL
 */
const getOriginalUrl = async (
    shortCode
) => {

    /*
     * Redis is the fast path.
     *
     * Only active, public URLs are stored
     * in Redis.
     */
    try {

        const cachedUrl =
            await getCachedUrl(
                shortCode
            );

        if (cachedUrl) {

            console.log(
                "REDIS CACHE HIT"
            );

            return cachedUrl;
        }

        console.log(
            "REDIS CACHE MISS"
        );

    } catch (error) {

        /*
         * Redis is optional.
         * If Redis fails, continue with MongoDB.
         */
        console.error(
            "Redis GET failed:",
            error.message
        );
    }


    /*
     * Redis MISS
     *
     * Now check MongoDB for the current
     * state of the URL.
     */
    const shortUrl =
        await ShortUrl.findOne({
            shortCode
        }).lean();


    /*
     * URL does not exist.
     */
    if (!shortUrl) {

        throw new ApiError(
            StatusCodes.NOT_FOUND,
            "Short URL not found"
        );
    }


    /*
     * URL has been deactivated.
     *
     * This also covers URLs that are
     * waiting for permanent deletion.
     */
    if (!shortUrl.isActive) {

        throw new ApiError(
            StatusCodes.GONE,
            "Short URL has been deactivated"
        );
    }


    /*
     * URL has expired.
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
     * Password-protected URLs should
     * never be placed in the public
     * redirect cache.
     */
    if (shortUrl.isPasswordProtected) {

        throw new ApiError(
            StatusCodes.UNAUTHORIZED,
            "Password required"
        );
    }


    /*
     * Calculate Redis TTL.
     *
     * Never cache longer than the
     * URL's actual expiration time.
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
     * Cache the valid public URL.
     */
    if (cacheTtl > 0) {

        try {

            await cacheUrl(
                shortCode,
                shortUrl._id,
                shortUrl.originalUrl,
                cacheTtl
            );

        } catch (error) {

            /*
             * Redis failure should never
             * break URL redirection.
             */
            console.error(
                "Redis SET failed:",
                error.message
            );
        }
    }


    /*
     * Return URL information.
     */
    return {
        urlId:
            shortUrl._id,

        originalUrl:
            shortUrl.originalUrl
    };
};


/*
 * Get access information for a URL.
 */
const getUrlAccessInfo = async (
    shortCode
) => {

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


/*
 * Verify protected URL password.
 */
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


    if (!shortUrl.isPasswordProtected) {

        throw new ApiError(
            StatusCodes.BAD_REQUEST,
            "This URL is not password protected"
        );
    }


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
        urlId:
            shortUrl._id,

        originalUrl:
            shortUrl.originalUrl,

        shortCode:
            shortUrl.shortCode
    };
};


/*
 * Get user's URLs.
 *
 * Includes:
 * - active
 * - deactivated
 * - expired
 * - pending deletion
 */
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
            userId
        })
            .sort({
                createdAt: -1
            })
            .skip(skip)
            .limit(limit)
            .lean(),

        ShortUrl.countDocuments({
            userId
        })

    ]);


    return {
        urls,
        total,
        page,
        limit
    };
};


/*
 * Get one URL owned by user.
 */
const getUrlById = async (
    urlId,
    userId
) => {

    const shortUrl =
        await ShortUrl.findOne({
            _id: urlId,
            userId
        }).lean();


    if (!shortUrl) {

        throw new ApiError(
            StatusCodes.NOT_FOUND,
            "Short URL not found"
        );
    }


    return shortUrl;
};


/*
 * Update URL.
 *
 * Handles:
 * - original URL
 * - expiration
 * - active/deactive state
 */
const updateUrl = async (
    urlId,
    userId,
    {
        originalUrl,
        expiresAt,
        isActive
    }
) => {

    const shortUrl =
        await ShortUrl.findOne({
            _id: urlId,
            userId
        });


    if (!shortUrl) {

        throw new ApiError(
            StatusCodes.NOT_FOUND,
            "Short URL not found"
        );
    }


    /*
     * Do not allow modifications to
     * a URL that is already pending deletion.
     *
     * User must restore it first.
     */
    if (shortUrl.deletionRequestedAt) {

        throw new ApiError(
            StatusCodes.CONFLICT,
            "URL is pending deletion. Restore it first."
        );
    }


    /*
     * Update original URL.
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
     * Update expiration.
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
     * Update active state.
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
         * Expired URLs cannot be activated.
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


    await shortUrl.save();


    /*
     * Invalidate Redis.
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


/*
 * Request permanent deletion.
 *
 * This does NOT delete the URL.
 * It starts the 30-day grace period.
 */
const requestUrlDeletion = async (
    urlId,
    userId
) => {

    const shortUrl =
        await ShortUrl.findOne({
            _id: urlId,
            userId
        });


    if (!shortUrl) {

        throw new ApiError(
            StatusCodes.NOT_FOUND,
            "Short URL not found"
        );
    }


    if (shortUrl.deletionRequestedAt) {

        return shortUrl;
    }


    shortUrl.deletionRequestedAt =
        new Date();

    /*
     * Deletion immediately disables
     * the redirect.
     */
    shortUrl.isActive =
        false;


    await shortUrl.save();


    /*
     * Remove stale Redis entry.
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


/*
 * Restore URL from pending deletion.
 */
const restoreUrl = async (
    urlId,
    userId
) => {

    const shortUrl =
        await ShortUrl.findOne({
            _id: urlId,
            userId
        });


    if (!shortUrl) {

        throw new ApiError(
            StatusCodes.NOT_FOUND,
            "Short URL not found"
        );
    }


    if (
        !shortUrl.deletionRequestedAt
    ) {

        throw new ApiError(
            StatusCodes.BAD_REQUEST,
            "URL is not pending deletion"
        );
    }


    /*
     * Do not restore an expired URL.
     */
    if (
        shortUrl.expiresAt &&
        shortUrl.expiresAt <= new Date()
    ) {

        throw new ApiError(
            StatusCodes.BAD_REQUEST,
            "Cannot restore an expired URL"
        );
    }


    shortUrl.deletionRequestedAt =
        null;

    shortUrl.isActive =
        true;


    await shortUrl.save();


    /*
     * Remove any stale cache.
     * It will be recreated on first access.
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
    requestUrlDeletion,
    restoreUrl,
    getUrlAccessInfo,
    verifyUrlPassword
};