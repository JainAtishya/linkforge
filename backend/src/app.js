const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const healthRoutes=require("./routes/health.routes");


const app = express();


// Middlewares

app.use(express.json());

app.use(
    cors({
        origin:"http://localhost:3000",
        credentials:true
    })
);

app.use(cookieParser());


// Routes

app.get("/", (req,res)=>{
    res.status(200).json({
        message:"LinkForge API running"
    });
});

app.use("/health", healthRoutes);

module.exports = app;