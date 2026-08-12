const express = require("express");

const {
    registerUser,
    loginUser,
    refreshAccessToken,
    logoutUser,
    logoutAllUsers,
    googleAuth,
    googleCallback
} = require("../controllers/auth.controller");

const validate =
    require("../middleware/validate.middleware");

const {
    registerSchema,
    loginSchema
} = require("../validators/auth.validator");

const authenticate =
    require("../middleware/auth.middleware");

const router = express.Router();


router.get(
    "/me",
    authenticate,
    (req, res) => {

        return res.json({
            success: true,
            message: "Authentication successful",
            user: req.user
        });
    }
);

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

router.post(
    "/refresh",
    refreshAccessToken
);

router.post(
    "/logout",
    logoutUser
);

router.post(
    "/logout-all",
    authenticate,
    logoutAllUsers
);

router.get(
    "/google",
    googleAuth
);

router.get(
    "/google/callback",
    googleCallback
);


module.exports = router;