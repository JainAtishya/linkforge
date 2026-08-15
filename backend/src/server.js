const app = require("./app");

const connectDB = require("./config/db");

const { PORT } = require("./config/env");

const {
    connectProducer
} = require("./services/kafka.service");

const {
    connectRedis
} = require("./config/redis");

const startServer = async () => {

    try {

        // MongoDB is required
        await connectDB();

        // Redis is optional
        connectRedis()
            .catch(error => {
                console.error(
                    "Redis startup failed:",
                    error.message
                );
            });

        // Kafka is optional
        connectProducer()
            .catch(error => {
                console.error(
                    "Kafka startup failed:",
                    error.message
                );
            });

        // Start API immediately
        app.listen(PORT, () => {
            console.log(
                `Server running on port ${PORT}`
            );
        });

    } catch (error) {

        console.error(
            "Failed to start server:",
            error
        );

        process.exit(1);
    }
};

startServer();