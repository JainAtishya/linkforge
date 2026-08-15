const {
    redisClient
} = require("../config/redis");

const DEFAULT_CACHE_TTL = 60 * 60; // 1 hour


const getCachedUrl = async (shortCode) => {

    if (!redisClient.isReady) {
        return null;
    }

    const key = `shorturl:${shortCode}`;

    const cached = await redisClient.get(key);

    if (!cached) {
        return null;
    }

    try {

        return JSON.parse(cached);

    } catch (error) {

        /*
         * Old cache entry from the previous format.
         * Remove it so MongoDB can repopulate
         * the cache using the new format.
         */

        await redisClient.del(key);

        return null;
    }
};


const cacheUrl = async (
    shortCode,
    urlId,
    originalUrl,
    ttl = DEFAULT_CACHE_TTL
) => {

    if (!redisClient.isReady) {
        return;
    }

    const key = `shorturl:${shortCode}`;

    const value = JSON.stringify({
        urlId: urlId.toString(),
        originalUrl
    });

    await redisClient.setEx(
        key,
        ttl,
        value
    );
};


const deleteCachedUrl = async (shortCode) => {

    if (!redisClient.isReady) {
        return;
    }

    const key = `shorturl:${shortCode}`;

    await redisClient.del(key);
};


const invalidateUrlCache = async (shortCode) => {

    if (!redisClient.isReady) {
        return;
    }

    const key = `shorturl:${shortCode}`;

    await redisClient.del(key);
};


module.exports = {
    getCachedUrl,
    cacheUrl,
    deleteCachedUrl,
    DEFAULT_CACHE_TTL,
    invalidateUrlCache
};