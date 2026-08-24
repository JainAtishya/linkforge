const mongoose = require("mongoose");
const app = require("./app");
const connectDB = require("./config/db");
const { PORT } = require("./config/env");

const {
    connectProducer,
    disconnectProducer
} = require("./services/kafka.service");

const {
    connectRedis
} = require("./config/redis");

const {
    startAnalyticsWorker,
    stopAnalyticsWorker
} = require("./workers/analytics.worker");

let server;

const startServer = async () => {
    try {
        await connectDB();

        connectRedis()
            .catch(error => {
                console.error(
                    "Redis startup failed:",
                    error.message
                );
            });

        connectProducer()
            .catch(error => {
                console.error(
                    "Kafka startup failed:",
                    error.message
                );
            });

        // Start the analytics consumer in the background
        startAnalyticsWorker()
            .catch(error => {
                console.error(
                    "Analytics worker background startup failed:",
                    error.message
                );
            });

        server = app.listen(
            PORT,
            "0.0.0.0",
            () => {
                console.log(
                    `Server running on port ${PORT}`
                );
            }
        );

    } catch (error) {
        console.error(
            "Failed to start server:",
            error
        );

        process.exit(1);
    }
};

let isShuttingDown = false;
const gracefulShutdown = async (signal) => {
    if (isShuttingDown) return;
    isShuttingDown = true;
    console.log(`\n${signal} received. Shutting down gracefully...`);

    const cleanup = async () => {
        await stopAnalyticsWorker();
        await disconnectProducer();
        
        try {
            if (mongoose.connection.readyState === 1) {
                await mongoose.connection.close();
                console.log("MongoDB connection closed.");
            }
        } catch (err) {
            console.error("Error closing MongoDB:", err.message);
        }
        
        process.exit(0);
    };

    if (server) {
        server.close(async () => {
            console.log("HTTP server closed.");
            await cleanup();
        });
    } else {
        await cleanup();
    }
};

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

startServer();