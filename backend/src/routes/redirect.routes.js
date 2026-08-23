const express = require("express");

const router =
    express.Router();

const {
    redirectToOriginalUrl
} = require("../controllers/url.controller");

const {
    redirectLimiter
} = require(
    "../middleware/rateLimit.middleware"
);


/*
 * =========================
 * Public Short URL Redirect
 * =========================
 *
 * 300 requests / 15 minutes
 * per IP.
 *
 * This is intentionally higher
 * than the normal API limit because
 * redirects are the primary public
 * traffic of LinkForge.
 */

router.get(
    "/:shortCode",
    redirectLimiter,
    redirectToOriginalUrl
);


module.exports = router;