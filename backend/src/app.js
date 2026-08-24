const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const helmet = require("helmet");
const path = require("path");

const healthRoutes = require("./routes/health.routes");
const notFoundHandler = require("./middleware/notFound.middleware");
const errorHandler = require("./middleware/error.middleware");
const logger = require("./config/logger");

const authRoutes = require("./routes/auth.routes");
const redirectRoutes = require("./routes/redirect.routes");
const urlRoutes = require("./routes/url.routes");

const {
    apiLimiter
} = require("./middleware/rateLimit.middleware");

const app = express();

/**
 * =========================
 * Proxy Configuration
 * =========================
 *
 * Required when deployed behind
 * a reverse proxy/load balancer.
 *
 * Set to 1 (number), not true (boolean).
 *
 * Setting true would allow any client to spoof
 * X-Forwarded-For and bypass IP-based rate limiting.
 *
 * Setting 1 trusts exactly one hop — Render's load
 * balancer — and reads req.ip from the first value
 * in X-Forwarded-For.
 *
 * express-rate-limit v8's trustProxy validation only
 * throws for trust proxy === true, not for numbers.
 * This setting is correct and compatible with v8.
 */
app.set("trust proxy", 1);

/**
 * =========================
 * CORS Configuration
 * =========================
 *
 * In production, the frontend and backend share the
 * same origin, so browser requests do not trigger CORS.
 *
 * This config is retained for local development where
 * the frontend runs on a separate port (5173).
 */
const allowedOrigins = [
    "http://localhost:5173",
    process.env.FRONTEND_URL
].filter(Boolean);

app.use(
    cors({
        origin: (origin, callback) => {
            // Allow requests without an Origin header
            // such as health checks or server-to-server requests.
            if (!origin) {
                return callback(null, true);
            }

            if (allowedOrigins.includes(origin)) {
                return callback(null, true);
            }

            return callback(
                new Error("Not allowed by CORS")
            );
        },
        credentials: true
    })
);

/**
 * =========================
 * Middlewares
 * =========================
 */
app.use(logger);

app.use(
    helmet({
        strictTransportSecurity:
            process.env.NODE_ENV === "production"
    })
);

app.use(express.json());

app.use(cookieParser());


/**
 * =========================
 * IP Diagnostic Logging
 * =========================
 *
 * Set LOG_IP_DIAGNOSTICS=true in the Render backend
 * environment to verify that req.ip correctly reflects
 * the real client IP address behind Render's proxy.
 *
 * express-rate-limit v8 uses ipKeyGenerator(req.ip, ipv6Subnet)
 * as its default key. With trust proxy set to 1, Express reads
 * req.ip from X-Forwarded-For — one hop back from the server,
 * which is the real client IP on Render.
 *
 * req.ips contains the full chain of forwarded IPs.
 * x-forwarded-for is the raw header value from Render.
 *
 * Disable by removing LOG_IP_DIAGNOSTICS or setting it to false
 * once you have confirmed IP keying is working correctly.
 */
if (process.env.LOG_IP_DIAGNOSTICS === "true") {
    app.use((req, res, next) => {
        console.log("[IP-DIAG]", {
            path: req.path,
            "req.ip": req.ip,
            "req.ips": req.ips,
            "x-forwarded-for":
                req.headers["x-forwarded-for"] ?? null,
            "x-real-ip":
                req.headers["x-real-ip"] ?? null
        });
        next();
    });
}


/**
 * =========================
 * Health
 * =========================
 *
 * IMPORTANT:
 * Must come BEFORE redirectRoutes because
 * redirectRoutes handles "/:shortCode" which
 * would otherwise intercept /health.
 */
app.use(
    "/health",
    healthRoutes
);


/**
 * =========================
 * Authentication
 * =========================
 *
 * authLimiter is applied per-route inside auth.routes.js
 * rather than here at the router level.
 *
 * Previously, applying authLimiter at the router level
 * caused all /api/v1/auth/* routes — including /auth/me
 * (called on every page load by AuthProvider) and
 * /auth/refresh (called by the Axios 401 interceptor) —
 * to share the same strict 10 req/15min bucket.
 *
 * Legitimate users exhausted that limit during normal
 * dashboard usage, locking them out of login and register.
 *
 * authLimiter now applies only to the sensitive endpoints:
 * /auth/login, /auth/register, /auth/google, /auth/refresh.
 */
app.use(
    "/api/v1/auth",
    authRoutes
);


/**
 * =========================
 * URL APIs
 * =========================
 *
 * General API rate limiting.
 */
app.use(
    "/api/v1/urls",
    apiLimiter,
    urlRoutes
);


/**
 * =========================
 * Static Frontend Files
 * =========================
 *
 * Serves the React production build from frontend/dist/.
 *
 * express.static only serves files that physically exist
 * in the dist directory:
 *   /assets/index-[hash].js
 *   /assets/index-[hash].css
 *   /favicon.ico
 *   /index.html  (served for the root "/" path by default)
 *
 * Short codes (e.g., /OA7cqb8z) are not files on disk,
 * so they pass through to the redirectRoutes handler below.
 *
 * Relative to this file (backend/src/app.js):
 *   ../../frontend/dist  →  frontend/dist/
 */
const distPath = path.resolve(
    __dirname,
    "../../frontend/dist"
);

app.use(
    express.static(distPath)
);


/**
 * =========================
 * SPA Routes (Single-Segment)
 * =========================
 *
 * These known React Router paths are explicitly served
 * index.html BEFORE reaching redirectRoutes.
 *
 * Without this guard, redirectRoutes' /:shortCode pattern
 * would match /login, /dashboard, etc. and trigger a
 * MongoDB lookup instead of loading the React app.
 *
 * Multi-segment React routes do NOT need to be listed here
 * because router.get("/:shortCode") only matches paths with
 * exactly one segment:
 *
 *   /dashboard/urls       — 2 segments → safe, handled below
 *   /dashboard/analytics  — 2 segments → safe, handled below
 *   /protected/:shortCode — 2 segments → safe, handled below
 */
const SPA_ROUTES = [
    "/",
    "/login",
    "/register",
    "/dashboard",
    "/url-unavailable"
];

app.get(
    SPA_ROUTES,
    (req, res) => {
        res.sendFile(
            path.join(distPath, "index.html")
        );
    }
);


/**
 * =========================
 * Public Short URL Redirects
 * =========================
 *
 * At this point, any remaining single-segment path is a
 * potential short code (e.g., /OA7cqb8z, /leetcode).
 *
 * redirectRoutes performs the MongoDB lookup and issues
 * the 302 redirect to the original URL.
 *
 * Error cases (expired, deactivated, not-found, protected)
 * redirect to ${FRONTEND_URL}/url-unavailable or
 * ${FRONTEND_URL}/protected/:shortCode — which re-enter
 * this server and are served as React pages.
 *
 * No general API limiter here — redirect traffic can
 * naturally be much higher than normal API traffic.
 * redirectRoutes applies its own redirectLimiter internally.
 */
app.use(
    "/",
    redirectRoutes
);


/**
 * =========================
 * SPA Fallback (Multi-Segment)
 * =========================
 *
 * Handles React Router deep links with multiple segments
 * that are not API routes and not matched by redirectRoutes.
 *
 * Reached by:
 *   /dashboard/urls
 *   /dashboard/analytics
 *   /protected/:shortCode   (React renders the password form)
 *
 * API paths (/api/*) are explicitly excluded so that
 * unmatched API routes fall through to the 404 handler.
 */
app.use((req, res, next) => {
    if (req.path.startsWith("/api/")) {
        return next();
    }

    res.sendFile(
        path.join(distPath, "index.html")
    );
});


/**
 * =========================
 * 404 Handler
 * =========================
 *
 * Only reached by unmatched /api/* routes.
 * All other unmatched paths are served the React SPA
 * by the fallback above.
 */
app.use(
    notFoundHandler
);


/**
 * =========================
 * Global Error Handler
 * =========================
 */
app.use(
    errorHandler
);


module.exports = app;