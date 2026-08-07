const express = require("express");

const {
    registerUser
} = require("../controllers/auth.controller");

const validate = require("../middleware/validate.middleware");

const {
    registerSchema
} = require("../validators/auth.validator");

const router = express.Router();

router.post(
    "/register",
    validate(registerSchema),
    registerUser
);

module.exports = router;