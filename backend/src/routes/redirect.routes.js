const express = require("express");

const router = express.Router();

const {
    redirectToOriginalUrl
} = require("../controllers/url.controller");


router.get(
    "/:shortCode",
    redirectToOriginalUrl
);


module.exports = router;