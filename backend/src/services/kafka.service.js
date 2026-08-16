const crypto = require("crypto");

const {
    producer
} = require("../config/kafka");

let producerConnected = false;


/*
 * Connect Kafka producer
 */

const connectProducer = async () => {

    if (producerConnected) {
        return;
    }

    console.log(
        "Kafka producer connecting..."
    );

    try {

        await producer.connect();

        producerConnected = true;

        console.log(
            "Kafka producer ready"
        );

    } catch (error) {

        producerConnected = false;

        console.error(
            "Kafka producer connection failed:",
            error.message
        );
    }
};


/*
 * Publish URL click event
 */

const publishUrlClicked = async ({
    urlId,
    shortCode,
    ipAddress,
    userAgent,
    referrer,
    device,
    browser
}) => {

    const event = {

        eventId:
            crypto.randomUUID(),

        eventType:
            "URL_CLICKED",

        urlId:
            urlId.toString(),

        shortCode,

        timestamp:
            new Date().toISOString(),

        ipAddress,

        userAgent,

        referrer,

        device,

        browser
    };


    /*
     * Kafka isn't connected.
     *
     * Don't break the redirect.
     */

    if (!producerConnected) {

        console.error(
            "Kafka unavailable. URL click event not published."
        );

        return;
    }


    try {

        await producer.send({

            topic:
                "url-clicks",

            messages: [
                {
                    value:
                        JSON.stringify(event)
                }
            ]
        });

    } catch (error) {

        console.error(
            "Kafka publish failed:",
            error.message
        );
    }
};

module.exports = {
    connectProducer,
    publishUrlClicked
};