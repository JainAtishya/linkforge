const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");

const healthRoutes = require("./routes/health.routes");

const notFoundHandler = require("./middleware/notFound.middleware");

const errorHandler = require("./middleware/error.middleware");

const logger = require("./config/logger");

const authRoutes = require("./routes/auth.routes");

const redirectRoutes =
    require("./routes/redirect.routes");

const urlRoutes =
    require("./routes/url.routes");

const app = express();


// Middlewares

app.use(logger);

app.use(express.json());

app.use(
    cors({
        origin:"http://localhost:3000",
        credentials:true
    })
);

app.use(cookieParser());


// Routes

app.use(
    "/",
    redirectRoutes
);

app.use(
    "/api/v1/auth",
    authRoutes
);

app.use(
    "/api/v1/urls",
    urlRoutes
);

app.get("/",(req,res)=>{

    res.json({
        message:"LinkForge API running"
    });

});

// for testing
app.get("/test-error",(req,res)=>{

    throw new Error("Testing error");

});


app.use("/health",healthRoutes);


// 404 Handler

app.use(notFoundHandler);


// Global Error Handler

app.use(errorHandler);



module.exports = app;