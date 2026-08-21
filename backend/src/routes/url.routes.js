const express = require("express");

const router = express.Router();

const authenticate =
    require("../middleware/auth.middleware");

const {
    createUrl,
    getMyUrls,
    getUrl,
    updateMyUrl,
    deleteMyUrl,
    getAnalytics,
    getAnalyticsByDate,
    accessProtectedUrl
} = require("../controllers/url.controller");


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
 * Get Analytics By Date
 */

router.get(
    "/:id/analytics/date",
    authenticate,
    getAnalyticsByDate
);


/*
 * Get Analytics
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
 * Update URL
 */

router.patch(
    "/:id",
    authenticate,
    updateMyUrl
);


/*
 * Deactivate URL
 */

router.delete(
    "/:id",
    authenticate,
    deleteMyUrl
);


module.exports = router;