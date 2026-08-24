const mongoose = require("mongoose");
const { consumer } = require("../config/kafka");
const { saveClickEvent } = require("../services/analytics.service");
const connectDB = require("../config/db");

let isShuttingDown = false;
let isRunning = false;

const startAnalyticsWorker = async () => {
    if (isRunning) return;
    isRunning = true;
    isShuttingDown = false;

    // Reuse existing MongoDB connection if already established by server.js
    if (mongoose.connection.readyState !== 1) {
        await connectDB();
        console.log("Analytics worker: MongoDB connected");
    }

    while (!isShuttingDown) {
        try {
            console.log("Analytics worker connecting...");
            await consumer.connect();
            console.log("Analytics worker connected");

            await consumer.subscribe({
                topic: "url-clicks",
                fromBeginning: false
            });
            console.log("Analytics worker subscribed to url-clicks");

            await consumer.run({
                eachMessage: async ({ topic, partition, message }) => {
                    try {
                        const event = JSON.parse(message.value.toString());
                        console.log(`Event received | Partition: ${partition} | Offset: ${message.offset}`);
                        await saveClickEvent(event);
                    } catch (error) {
                        console.error("Analytics event processing failed:", error);
                        throw error;
                    }
                }
            });

            // Normal exit from consumer.run (e.g. clean shutdown)
            break;
        } catch (error) {
            if (isShuttingDown) break;
            
            console.error("Analytics worker failed, retrying in 5s:", error.message);
            // Delay before retrying
            await new Promise(resolve => setTimeout(resolve, 5000));
        }
    }
    
    isRunning = false;
};

const stopAnalyticsWorker = async () => {
    isShuttingDown = true;
    try {
        await consumer.disconnect();
        console.log("Analytics worker disconnected cleanly");
    } catch (error) {
        console.error("Error disconnecting Analytics worker:", error.message);
    }
};

if (require.main === module) {
    startAnalyticsWorker()
        .catch(error => {
            console.error("Analytics worker failed:", error);
            process.exit(1);
        });
}

module.exports = { startAnalyticsWorker, stopAnalyticsWorker };