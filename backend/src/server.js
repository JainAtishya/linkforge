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

        app.listen(
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

startServer();