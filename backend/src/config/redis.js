const { createClient } = require("redis");

const redisClient = createClient({
    url: process.env.REDIS_URL,

    socket: {
        reconnectStrategy: (retries) => {
            const delay = Math.min(
                1000 * Math.pow(2, retries),
                30000
            );

            console.log(
                `Redis reconnect attempt ${retries + 1}. Retrying in ${delay}ms`
            );

            return delay;
        }
    }
});

redisClient.on("error", (error) => {
    console.error(
        "Redis Client Error:",
        error.message
    );
});

redisClient.on("connect", () => {
    console.log("Redis connecting...");
});

redisClient.on("ready", () => {
    console.log("Redis ready");
});

redisClient.on("reconnecting", () => {
    console.log("Redis reconnecting...");
});

redisClient.on("end", () => {
    console.log("Redis connection closed");
});

const connectRedis = async () => {
    await redisClient.connect();
};

module.exports = {
    redisClient,
    connectRedis
};