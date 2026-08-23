const mongoose = require("mongoose");

const ClickEvent =
    require("../models/clickEvent.model");

const ApiError =
    require("../utils/ApiError");

const {
    StatusCodes
} = require("http-status-codes");


/*
 * Save click event
 */

const saveClickEvent = async (event) => {

    try {

        await ClickEvent.create({
            eventId:
                event.eventId,

            urlId:
                event.urlId,

            shortCode:
                event.shortCode,

            timestamp:
                event.timestamp,

            ipAddress:
                event.ipAddress,

            userAgent:
                event.userAgent,

            referrer:
                event.referrer,

            device:
                event.device,

            browser:
                event.browser,

            country:
                event.country
        });


        console.log(
            `Click event saved: ${event.eventId}`
        );


    } catch (error) {

        /*
         * Duplicate event.
         */

        if (
            error.code === 11000 &&
            error.keyPattern?.eventId
        ) {

            console.log(
                `Duplicate event ignored: ${event.eventId}`
            );

            return;
        }


        throw error;
    }
};


/*
 * Get analytics for one URL
 *
 * Supported periods:
 *
 * 7d
 * 30d
 * 90d
 */

const getUrlAnalytics = async (
    urlId,
    userId,
    period = "7d"
) => {

    /*
     * Verify that the URL belongs
     * to the authenticated user.
     */

    const ShortUrl =
        require("../models/shortUrl.model");


    const shortUrl =
        await ShortUrl.findOne({
            _id: urlId,
            userId
        }).lean();


    if (!shortUrl) {

        throw new ApiError(
            StatusCodes.NOT_FOUND,
            "Short URL not found"
        );
    }


    /*
     * Convert URL id to ObjectId.
     *
     * Aggregation pipelines need
     * the correct MongoDB type.
     */

    const objectId =
        new mongoose.Types.ObjectId(urlId);


    /*
     * Allowed analytics periods.
     */

    const periodDays = {

        "7d": 7,

        "30d": 30,

        "90d": 90
    };


    /*
     * Validate period.
     */

    if (!periodDays[period]) {

        throw new ApiError(
            StatusCodes.BAD_REQUEST,
            "Invalid period. Use 7d, 30d, or 90d"
        );
    }


    /*
     * Calculate start date.
     *
     * Example:
     *
     * 7d
     * now - 7 days
     */

    const startDate =
        new Date();

    startDate.setUTCDate(
        startDate.getUTCDate() -
        periodDays[period]
    );


    /*
     * Use one fixed end date for
     * all queries.
     */

    const endDate =
        new Date();


    /*
     * Run analytics queries in parallel.
     */

    const [
        totalClicks,
        periodClicks,
        clicksByDevice,
        clicksByBrowser,
        clicksByCountry,
        clicksOverTime
    ] = await Promise.all([


        /*
         * --------------------------------
         * Lifetime total clicks
         * --------------------------------
         *
         * This does NOT depend on period.
         */

        ClickEvent.countDocuments({
            urlId: objectId
        }),


        /*
         * --------------------------------
         * Clicks during selected period
         * --------------------------------
         */

        ClickEvent.countDocuments({

            urlId: objectId,

            timestamp: {

                $gte: startDate,

                $lt: endDate
            }
        }),


        /*
         * --------------------------------
         * Clicks by device
         * --------------------------------
         */

        ClickEvent.aggregate([

            {
                $match: {

                    urlId: objectId,

                    timestamp: {

                        $gte: startDate,

                        $lt: endDate
                    }
                }
            },


            {
                $group: {

                    _id: "$device",

                    count: {
                        $sum: 1
                    }
                }
            },


            {
                $sort: {

                    count: -1
                }
            }

        ]),


        /*
         * --------------------------------
         * Clicks by browser
         * --------------------------------
         */

        ClickEvent.aggregate([

            {
                $match: {

                    urlId: objectId,

                    timestamp: {

                        $gte: startDate,

                        $lt: endDate
                    }
                }
            },


            {
                $group: {

                    _id: "$browser",

                    count: {
                        $sum: 1
                    }
                }
            },


            {
                $sort: {

                    count: -1
                }
            }

        ]),


        /*
         * --------------------------------
         * Clicks by country
         * --------------------------------
         */

        ClickEvent.aggregate([

            {
                $match: {

                    urlId: objectId,

                    timestamp: {

                        $gte: startDate,

                        $lt: endDate
                    }
                }
            },


            {
                $group: {

                    _id: "$country",

                    count: {
                        $sum: 1
                    }
                }
            },


            {
                $sort: {

                    count: -1
                }
            }

        ]),


        /*
         * --------------------------------
         * Clicks over time
         * --------------------------------
         *
         * Only selected period.
         */

        ClickEvent.aggregate([

            {
                $match: {

                    urlId: objectId,

                    timestamp: {

                        $gte: startDate,

                        $lt: endDate
                    }
                }
            },


            {
                $group: {

                    _id: {

                        $dateToString: {

                            format: "%Y-%m-%d",

                            date: "$timestamp"
                        }
                    },

                    count: {

                        $sum: 1
                    }
                }
            },


            {
                $sort: {

                    _id: 1
                }
            },


            {
                $project: {

                    _id: 0,

                    date: "$_id",

                    count: 1
                }
            }

        ])

    ]);


    /*
     * Return analytics.
     */

    return {

        url: {

            id: shortUrl._id,

            shortCode:
                shortUrl.shortCode,

            originalUrl:
                shortUrl.originalUrl
        },


        /*
         * Selected period.
         */

        period,


        /*
         * Lifetime clicks.
         */

        totalClicks,


        /*
         * Clicks within selected period.
         */

        periodClicks,


        clicksByDevice,

        clicksByBrowser,

        clicksByCountry,

        clicksOverTime
    };
};


/*
 * Get analytics for a specific date
 */

const getUrlAnalyticsByDate = async (
    urlId,
    userId,
    date
) => {

    /*
     * Verify URL ownership.
     */

    const ShortUrl =
        require("../models/shortUrl.model");


    const shortUrl =
        await ShortUrl.findOne({
            _id: urlId,
            userId
        }).lean();


    if (!shortUrl) {

        throw new ApiError(
            StatusCodes.NOT_FOUND,
            "Short URL not found"
        );
    }


    /*
     * Validate date format.
     *
     * Expected:
     *
     * YYYY-MM-DD
     */

    if (
        !/^\d{4}-\d{2}-\d{2}$/.test(date)
    ) {

        throw new ApiError(
            StatusCodes.BAD_REQUEST,
            "Invalid date. Use YYYY-MM-DD"
        );
    }


    /*
     * Convert URL id to ObjectId.
     */

    const objectId =
        new mongoose.Types.ObjectId(urlId);


    /*
     * Start of selected day.
     */

    const startOfDay =
        new Date(
            `${date}T00:00:00.000Z`
        );


    /*
     * Start of next day.
     */

    const startOfNextDay =
        new Date(startOfDay);


    startOfNextDay.setUTCDate(
        startOfNextDay.getUTCDate() + 1
    );


    /*
     * Make sure the date itself is valid.
     *
     * Example:
     *
     * 2026-02-31
     */

    if (
        Number.isNaN(
            startOfDay.getTime()
        ) ||

        startOfDay
            .toISOString()
            .slice(0, 10) !== date
    ) {

        throw new ApiError(
            StatusCodes.BAD_REQUEST,
            "Invalid date"
        );
    }


    /*
     * Run date-specific analytics.
     */

    const [
        totalClicks,
        clicksByDevice,
        clicksByBrowser,
        clicksByCountry
    ] = await Promise.all([


        /*
         * Total clicks on selected date.
         */

        ClickEvent.countDocuments({

            urlId: objectId,

            timestamp: {

                $gte: startOfDay,

                $lt: startOfNextDay
            }
        }),


        /*
         * Device breakdown.
         */

        ClickEvent.aggregate([

            {
                $match: {

                    urlId: objectId,

                    timestamp: {

                        $gte: startOfDay,

                        $lt: startOfNextDay
                    }
                }
            },


            {
                $group: {

                    _id: "$device",

                    count: {

                        $sum: 1
                    }
                }
            },


            {
                $sort: {

                    count: -1
                }
            }

        ]),


        /*
         * Browser breakdown.
         */

        ClickEvent.aggregate([

            {
                $match: {

                    urlId: objectId,

                    timestamp: {

                        $gte: startOfDay,

                        $lt: startOfNextDay
                    }
                }
            },


            {
                $group: {

                    _id: "$browser",

                    count: {

                        $sum: 1
                    }
                }
            },


            {
                $sort: {

                    count: -1
                }
            }

        ]),


        /*
         * Country breakdown.
         */

        ClickEvent.aggregate([

            {
                $match: {

                    urlId: objectId,

                    timestamp: {

                        $gte: startOfDay,

                        $lt: startOfNextDay
                    }
                }
            },


            {
                $group: {

                    _id: "$country",

                    count: {

                        $sum: 1
                    }
                }
            },


            {
                $sort: {

                    count: -1
                }
            }

        ])

    ]);


    return {

        date,

        totalClicks,

        clicksByDevice,

        clicksByBrowser,

        clicksByCountry
    };
};


module.exports = {

    saveClickEvent,

    getUrlAnalytics,

    getUrlAnalyticsByDate
};