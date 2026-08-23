const express = require("express");

const cors = require("cors");

const cookieParser = require("cookie-parser");

const healthRoutes =
    require("./routes/health.routes");

const notFoundHandler =
    require("./middleware/notFound.middleware");

const errorHandler =
    require("./middleware/error.middleware");

const logger =
    require("./config/logger");

const authRoutes =
    require("./routes/auth.routes");

const redirectRoutes =
    require("./routes/redirect.routes");

const urlRoutes =
    require("./routes/url.routes");

const {
    authLimiter,
    apiLimiter
} = require("./middleware/rateLimit.middleware");


const app = express();


/*
 * Trust reverse proxy.
 *
 * Required when the application is
 * deployed behind a proxy/load balancer.
 */
app.set(
    "trust proxy",
    1
);


/*
 * =========================
 * Middlewares
 * =========================
 */

app.use(logger);

app.use(
    express.json()
);

app.use(
    cors({
        origin:
            "http://localhost:3000",

        credentials: true
    })
);

app.use(
    cookieParser()
);


/*
 * =========================
 * Routes
 * =========================
 */


/*
 * Public short URL redirects
 *
 * No general API limiter here.
 *
 * Redirect traffic can naturally be
 * much higher than normal API traffic.
 */
app.use(
    "/",
    redirectRoutes
);


/*
 * Authentication
 *
 * Strict rate limiting protects
 * login/register endpoints.
 */
app.use(
    "/api/v1/auth",
    authLimiter,
    authRoutes
);


/*
 * URL APIs
 *
 * General API rate limiting.
 */
app.use(
    "/api/v1/urls",
    apiLimiter,
    urlRoutes
);


/*
 * =========================
 * Root
 * =========================
 */

app.get(
    "/",
    (req, res) => {

        res.json({
            message:
                "LinkForge API running"
        });

    }
);


/*
 * =========================
 * Error testing
 * =========================
 */

app.get(
    "/test-error",
    (req, res) => {

        throw new Error(
            "Testing error"
        );

    }
);


/*
 * =========================
 * Health
 * =========================
 */

app.use(
    "/health",
    healthRoutes
);


/*
 * =========================
 * 404 Handler
 * =========================
 */

app.use(
    notFoundHandler
);


/*
 * =========================
 * Global Error Handler
 * =========================
 */

app.use(
    errorHandler
);


module.exports = app;