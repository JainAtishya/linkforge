const express = require("express");

const {
    registerUser,
    loginUser,
    refreshAccessToken,
    logoutUser,
    logoutAllUsers,
    googleAuth,
    googleCallback,
    getCurrentUser
} = require("../controllers/auth.controller");

const validate =
    require("../middleware/validate.middleware");

const {
    registerSchema,
    loginSchema
} = require("../validators/auth.validator");

const authenticate =
    require("../middleware/auth.middleware");

const {
    authLimiter
} = require("../middleware/rateLimit.middleware");

const router = express.Router();


/*
 * =========================
 * Get Current User
 * =========================
 *
 * No authLimiter.
 *
 * /auth/me is called by AuthProvider on every route
 * transition to verify session state. Applying the strict
 * authLimiter (10 req/15min) here would cause legitimate
 * users to exhaust the auth budget during normal navigation,
 * locking them out of login and register endpoints.
 */
router.get(
    "/me",
    authenticate,
    getCurrentUser
);


/*
 * =========================
 * Register
 * =========================
 *
 * authLimiter: 10 req/15min per IP.
 * Prevents account-creation spam.
 */
router.post(
    "/register",
    authLimiter,
    validate(registerSchema),
    registerUser
);


/*
 * =========================
 * Login
 * =========================
 *
 * authLimiter: 10 req/15min per IP.
 * Prevents brute-force credential attacks.
 */
router.post(
    "/login",
    authLimiter,
    validate(loginSchema),
    loginUser
);


/*
 * =========================
 * Refresh Access Token
 * =========================
 *
 * authLimiter: 10 req/15min per IP.
 *
 * Refresh is a sensitive auth operation that should
 * be rate limited. Under normal usage, a user's
 * access token expires every 15 minutes, so at most
 * one refresh is expected per window per client.
 *
 * The Axios interceptor in client.js deduplicates
 * concurrent refresh calls via a shared refreshPromise,
 * so multiple parallel 401s result in a single refresh.
 */
router.post(
    "/refresh",
    authLimiter,
    refreshAccessToken
);


/*
 * =========================
 * Logout
 * =========================
 *
 * No authLimiter.
 * Logging out is low-risk and must not be blocked.
 */
router.post(
    "/logout",
    logoutUser
);


/*
 * =========================
 * Logout All Devices
 * =========================
 *
 * No authLimiter.
 * Protected by the authenticate middleware.
 * Low risk — the user must already have a valid session.
 */
router.post(
    "/logout-all",
    authenticate,
    logoutAllUsers
);


/*
 * =========================
 * Google OAuth — Initiate
 * =========================
 *
 * authLimiter: 10 req/15min per IP.
 * Prevents abuse of the OAuth initiation flow.
 */
router.get(
    "/google",
    authLimiter,
    googleAuth
);


/*
 * =========================
 * Google OAuth — Callback
 * =========================
 *
 * No authLimiter.
 *
 * This endpoint is called by Google's servers during the
 * OAuth redirect, not by the user directly. Rate limiting
 * it could break the OAuth login flow.
 */
router.get(
    "/google/callback",
    googleCallback
);


module.exports = router;