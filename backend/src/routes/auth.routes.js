const express = require("express");

const {
    registerUser,
    loginUser
} = require("../controllers/auth.controller");

const validate =
    require("../middleware/validate.middleware");

const {
    registerSchema,
    loginSchema
} = require("../validators/auth.validator");

const router = express.Router();

router.post(
    "/register",
    validate(registerSchema),
    registerUser
);

router.post(
    "/login",
    validate(loginSchema),
    loginUser
);

module.exports = router;