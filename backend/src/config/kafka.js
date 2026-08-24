const { Kafka } = require("kafkajs");

const {
    KAFKA_BROKER,
    KAFKA_USERNAME,
    KAFKA_PASSWORD
} = require("./env");

const kafkaOptions = {
    clientId: "linkforge",

    brokers: [
        KAFKA_BROKER || "localhost:9092"
    ],

    retry: {
        retries: 3,
        initialRetryTime: 300,
        maxRetryTime: 3000
    }
};

if (KAFKA_USERNAME && KAFKA_PASSWORD) {
    kafkaOptions.ssl = {
        rejectUnauthorized: false
    };
    kafkaOptions.sasl = {
        mechanism: "plain",
        username: KAFKA_USERNAME,
        password: KAFKA_PASSWORD
    };
}

const kafka = new Kafka(kafkaOptions);

const producer = kafka.producer();

const consumer = kafka.consumer({
    groupId: "linkforge-analytics"
});

module.exports = {
    kafka,
    producer,
    consumer
};
