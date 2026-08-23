const { rateLimit } = require("express-rate-limit");

/*
 * =========================
 * Common rate-limit handler
 * =========================
 */

const rateLimitHandler = (req, res) => {
    return res.status(429).json({
        success: false,
        message:
            "Too many requests. Please try again later."
    });
};


/*
 * =========================
 * Authentication limiter
 * =========================
 *
 * Protects:
 *
 * /login
 * /register
 *
 * These endpoints are attractive
 * targets for brute-force attacks.
 */

const authLimiter = rateLimit({

    windowMs:
        15 * 60 * 1000,

    limit: 10,

    standardHeaders:
        "draft-8",

    legacyHeaders:
        false,

    handler:
        rateLimitHandler
});


/*
 * =========================
 * Password access limiter
 * =========================
 *
 * Protects password-protected
 * short URLs from password
 * guessing attacks.
 */

const passwordLimiter = rateLimit({

    windowMs:
        15 * 60 * 1000,

    limit: 10,

    standardHeaders:
        "draft-8",

    legacyHeaders:
        false,

    handler:
        rateLimitHandler
});


/*
 * =========================
 * General API limiter
 * =========================
 *
 * Applies to authenticated
 * API operations.
 */

const apiLimiter = rateLimit({

    windowMs:
        15 * 60 * 1000,

    limit: 100,

    standardHeaders:
        "draft-8",

    legacyHeaders:
        false,

    handler:
        rateLimitHandler
});


/*
 * =========================
 * Redirect limiter
 * =========================
 *
 * Redirects naturally receive
 * much more traffic than API
 * requests, so this limit is
 * intentionally higher.
 */

const redirectLimiter = rateLimit({

    windowMs:
        15 * 60 * 1000,

    limit: 300,

    standardHeaders:
        "draft-8",

    legacyHeaders:
        false,

    handler:
        rateLimitHandler
});


module.exports = {

    authLimiter,

    passwordLimiter,

    apiLimiter,

    redirectLimiter

};