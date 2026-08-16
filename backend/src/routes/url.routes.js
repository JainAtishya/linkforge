const express = require("express");

const router =
    express.Router();

const authenticate =
    require("../middleware/auth.middleware");

const {
    createUrl,
    getMyUrls,
    getUrl,
    updateMyUrl,
    deleteMyUrl,
    getAnalytics,
    getAnalyticsByDate
} = require("../controllers/url.controller");

router.post(
    "/",
    authenticate,
    createUrl
);

router.get(
    "/",
    authenticate,
    getMyUrls
);

router.get(
    "/:id/analytics/date",
    authenticate,
    getAnalyticsByDate
);

router.get(
    "/:id/analytics",
    authenticate,
    getAnalytics
);

router.get(
    "/:id",
    authenticate,
    getUrl
);


router.patch(
    "/:id",
    authenticate,
    updateMyUrl
);


router.delete(
    "/:id",
    authenticate,
    deleteMyUrl
);

module.exports = router;