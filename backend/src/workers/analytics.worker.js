const { consumer } = require("../config/kafka");

const {
    saveClickEvent
} = require("../services/analytics.service");

const connectDB = require("../config/db");


const startAnalyticsWorker = async () => {

    /*
     * MongoDB
     */

    await connectDB();

    console.log(
        "Analytics worker: MongoDB connected"
    );


    /*
     * Kafka
     */

    console.log(
        "Analytics worker connecting..."
    );

    await consumer.connect();

    console.log(
        "Analytics worker connected"
    );


    /*
     * Subscribe
     */

    await consumer.subscribe({
        topic: "url-clicks",
        fromBeginning: false
    });

    console.log(
        "Analytics worker subscribed to url-clicks"
    );


    /*
     * Consume
     */

    await consumer.run({

        eachMessage: async ({
            topic,
            partition,
            message
        }) => {

            try {

                const event =
                    JSON.parse(
                        message.value.toString()
                    );

                console.log(
                    `Event received | Partition: ${partition} | Offset: ${message.offset}`
                );


                /*
                 * Persist event.
                 */

                await saveClickEvent(event);


                /*
                 * IMPORTANT:
                 *
                 * Returning successfully from
                 * eachMessage tells KafkaJS that
                 * processing succeeded.
                 */

            } catch (error) {

                console.error(
                    "Analytics event processing failed:",
                    error
                );

                /*
                 * Throwing causes KafkaJS to treat
                 * this message as failed.
                 */

                throw error;
            }
        }
    });
};


startAnalyticsWorker()
    .catch(error => {

        console.error(
            "Analytics worker failed:",
            error
        );

        process.exit(1);
    });