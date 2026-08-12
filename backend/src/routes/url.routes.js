const express = require("express");

const router =
    express.Router();

const authenticate =
    require("../middleware/auth.middleware");

const {
    createUrl
} = require("../controllers/url.controller");

router.post(
    "/",
    authenticate,
    createUrl
);

module.exports = router;