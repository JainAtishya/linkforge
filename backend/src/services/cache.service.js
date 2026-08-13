const {
    redisClient
} = require("../config/redis");

const DEFAULT_CACHE_TTL = 60 * 60; // 1 hour

const getCachedUrl = async (shortCode) => {

    if (!redisClient.isReady) {
        return null;
    }

    const key = `shorturl:${shortCode}`;

    return await redisClient.get(key);
};

const cacheUrl = async (
    shortCode,
    originalUrl,
    ttl = DEFAULT_CACHE_TTL
) => {

    if (!redisClient.isReady) {
        return;
    }

    const key = `shorturl:${shortCode}`;

    await redisClient.setEx(
        key,
        ttl,
        originalUrl
    );
};

const deleteCachedUrl = async (shortCode) => {

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
    DEFAULT_CACHE_TTL
};