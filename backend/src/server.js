const app = require("./app");

const connectDB = require("./config/db");

const {PORT}=require("./config/env");

const {
    connectRedis
} = require("./config/redis");

const startServer = async () => {
    try {
        await connectDB();
        await connectRedis();

        app.listen(PORT, () => {
            console.log(
                `Server running on port ${PORT}`
            );
        });

    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

startServer();