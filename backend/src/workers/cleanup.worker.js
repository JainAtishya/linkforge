const connectDB =
    require("../config/db");

const {
    connectRedis
} = require("../config/redis");

const {
    cleanupDeletedUrls
} = require("../services/cleanup.service");


const startCleanupWorker =
    async () => {

        try {

            /*
             * MongoDB is required.
             */
            await connectDB();

            console.log(
                "Cleanup worker: MongoDB connected"
            );


            /*
             * Redis is optional.
             *
             * Cleanup can still proceed if
             * Redis is unavailable.
             */
            try {

                await connectRedis();

                console.log(
                    "Cleanup worker: Redis ready"
                );

            } catch (error) {

                console.error(
                    "Cleanup worker: Redis unavailable:",
                    error.message
                );
            }


            console.log(
                "Cleanup worker: starting cleanup"
            );


            const result =
                await cleanupDeletedUrls();


            console.log(
                `Cleanup worker completed. Deleted ${result.deletedCount} URL(s).`
            );


            /*
             * Job is complete.
             *
             * Production scheduler will start
             * another process tomorrow.
             */
            process.exit(0);

        } catch (error) {

            console.error(
                "Cleanup worker failed:",
                error
            );

            process.exit(1);
        }
    };


startCleanupWorker();