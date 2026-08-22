const express =
    require("express");

const router =
    express.Router();

const authenticate =
    require("../middleware/auth.middleware");

const {
    createUrl,
    getMyUrls,
    getUrl,
    updateMyUrl,
    requestDeleteUrl,
    restoreDeletedUrl,
    getAnalytics,
    getAnalyticsByDate,
    accessProtectedUrl
} =
    require("../controllers/url.controller");


/*
 * Create Short URL
 */
router.post(
    "/",
    authenticate,
    createUrl
);


/*
 * Get My URLs
 */
router.get(
    "/",
    authenticate,
    getMyUrls
);


/*
 * Analytics By Date
 */
router.get(
    "/:id/analytics/date",
    authenticate,
    getAnalyticsByDate
);


/*
 * Analytics
 */
router.get(
    "/:id/analytics",
    authenticate,
    getAnalytics
);


/*
 * Get Single URL
 */
router.get(
    "/:id",
    authenticate,
    getUrl
);


/*
 * Access Password-Protected URL
 *
 * No authentication required.
 */
router.post(
    "/access/:shortCode",
    accessProtectedUrl
);


/*
 * Update / Activate / Deactivate URL
 */
router.patch(
    "/:id",
    authenticate,
    updateMyUrl
);


/*
 * Request permanent deletion.
 *
 * URL is NOT deleted immediately.
 * It enters a 30-day grace period.
 */
router.post(
    "/:id/delete",
    authenticate,
    requestDeleteUrl
);


/*
 * Cancel deletion request.
 */
router.post(
    "/:id/restore",
    authenticate,
    restoreDeletedUrl
);


module.exports = router;