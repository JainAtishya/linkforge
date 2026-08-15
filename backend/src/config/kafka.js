const { Kafka } = require("kafkajs");

const kafka = new Kafka({
    clientId: "linkforge",

    brokers: [
        process.env.KAFKA_BROKER || "localhost:9092"
    ],

    retry: {
        retries: 3,
        initialRetryTime: 300,
        maxRetryTime: 3000
    }
});

const producer = kafka.producer();

const consumer = kafka.consumer({
    groupId: "linkforge-analytics"
});

module.exports = {
    kafka,
    producer,
    consumer
};