const ShortUrl =
    require("../models/shortUrl.model");

const {
    invalidateUrlCache
} = require("./cache.service");


const DELETION_GRACE_PERIOD_DAYS = 30;


/*
 * Permanently delete URLs whose
 * deletion grace period has ended.
 */
const cleanupDeletedUrls = async () => {

    const cutoffDate =
        new Date(
            Date.now() -
            DELETION_GRACE_PERIOD_DAYS *
            24 *
            60 *
            60 *
            1000
        );


    /*
     * Find only URLs explicitly scheduled
     * for deletion 30+ days ago.
     *
     * Expired/deactivated URLs are NOT
     * automatically deleted.
     */
    const urlsToDelete =
        await ShortUrl.find({
            deletionRequestedAt: {
                $ne: null,
                $lte: cutoffDate
            }
        })
        .select(
            "_id shortCode deletionRequestedAt"
        )
        .lean();


    if (urlsToDelete.length === 0) {

        console.log(
            "Cleanup worker: no URLs eligible for deletion"
        );

        return {
            deletedCount: 0
        };
    }


    /*
     * Invalidate Redis entries first.
     *
     * They should normally already be gone
     * because deletion requests invalidate
     * Redis immediately, but this gives us
     * an additional safety layer.
     */
    for (const url of urlsToDelete) {

        try {

            await invalidateUrlCache(
                url.shortCode
            );

        } catch (error) {

            /*
             * Redis failure must not prevent
             * permanent database cleanup.
             */
            console.error(
                `Cleanup worker: Redis invalidation failed for ${url.shortCode}:`,
                error.message
            );
        }
    }


    const ids =
        urlsToDelete.map(
            (url) => url._id
        );


    /*
     * Delete only the URLs we selected.
     */
    const result =
        await ShortUrl.deleteMany({
            _id: {
                $in: ids
            },

            deletionRequestedAt: {
                $ne: null,
                $lte: cutoffDate
            }
        });


    console.log(
        `Cleanup worker: permanently deleted ${result.deletedCount} URL(s)`
    );


    return {
        deletedCount:
            result.deletedCount
    };
};


module.exports = {
    cleanupDeletedUrls
};