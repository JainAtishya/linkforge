const asyncHandler = require("../utils/asyncHandler");

const {
    getDevice,
    getBrowser
} = require("../utils/userAgent");

const {
    StatusCodes
} = require("http-status-codes");

const ApiResponse =
    require("../utils/ApiResponse");

const ApiError =
    require("../utils/ApiError");

const {
    publishUrlClicked
} = require("../services/kafka.service");

const {
    createShortUrl,
    getOriginalUrl,
    getUserUrls,
    getUrlById,
    updateUrl,
    deleteUrl,
    getUrlAccessInfo,
    verifyUrlPassword
} = require("../services/url.service");

const {
    getUrlAnalytics,
    getUrlAnalyticsByDate
} = require("../services/analytics.service");



/*
 * Create Short URL
 */

/*
 * Create Short URL
 */

const createUrl = asyncHandler(
    async (req, res) => {

        const {
            originalUrl,
            expiresAt,
            customAlias,
            password
        } = req.body;


        const shortUrl =
            await createShortUrl({

                userId: req.user.sub,

                originalUrl,

                expiresAt,

                customAlias,

                password
            });


        return res
            .status(StatusCodes.CREATED)
            .json(
                new ApiResponse(
                    StatusCodes.CREATED,
                    {
                        id:
                            shortUrl._id,

                        originalUrl:
                            shortUrl.originalUrl,

                        shortCode:
                            shortUrl.shortCode,

                        shortUrl:
                            `${process.env.APP_BASE_URL}/${shortUrl.shortCode}`,

                        expiresAt:
                            shortUrl.expiresAt,

                        isPasswordProtected:
                            shortUrl.isPasswordProtected
                    },

                    "Short URL created successfully"
                )
            );
    }
);



/*
 * Redirect Short URL
 */

/*
 * Redirect Short URL
 */

const redirectToOriginalUrl =
    asyncHandler(
        async (req, res) => {

            const {
                shortCode
            } = req.params;


            const {
                urlId,
                originalUrl,
                isPasswordProtected
            } =
                await getOriginalUrl(
                    shortCode
                );


            /*
             * Password-protected URL.
             *
             * Send the browser to the React
             * password page instead of trying
             * to redirect to the original URL.
             */

            if (isPasswordProtected) {

                const frontendUrl =
                    process.env.FRONTEND_URL ||
                    "http://localhost:5173";

                return res.redirect(
                    302,
                    `${frontendUrl}/protected/${encodeURIComponent(shortCode)}`
                );
            }


            /*
             * Extract request metadata.
             */

            const userAgent =
                req.get(
                    "user-agent"
                ) || "";


            const ipAddress =
                req.ip;


            const referrer =
                req.get(
                    "referer"
                ) || null;


            const device =
                getDevice(
                    userAgent
                );


            const browser =
                getBrowser(
                    userAgent
                );


            /*
             * Publish analytics event.
             *
             * Kafka failure must NOT
             * break the redirect.
             */

            await publishUrlClicked({

                urlId,

                shortCode,

                ipAddress,

                userAgent,

                referrer,

                device,

                browser

            });


            /*
             * Redirect user.
             */

            return res.redirect(
                302,
                originalUrl
            );
        }
    );

    /*
 * Access Password-Protected URL
 */
/*
 * Access Password-Protected URL
 */

const accessProtectedUrl =
    asyncHandler(
        async (req, res) => {

            const {
                shortCode
            } = req.params;


            const {
                password
            } = req.body;


            /*
             * Verify password.
             */

            const {
                urlId,
                originalUrl
            } =
                await verifyUrlPassword(
                    shortCode,
                    password
                );


            /*
             * Extract request metadata.
             */

            const userAgent =
                req.get(
                    "user-agent"
                ) || "";


            const ipAddress =
                req.ip;


            const referrer =
                req.get(
                    "referer"
                ) || null;


            const device =
                getDevice(
                    userAgent
                );


            const browser =
                getBrowser(
                    userAgent
                );


            /*
             * Password is correct.
             *
             * Only NOW count the click.
             */

            await publishUrlClicked({

                urlId,

                shortCode,

                ipAddress,

                userAgent,

                referrer,

                device,

                browser

            });


            /*
             * Return the original URL to React.
             */

            return res
                .status(StatusCodes.OK)
                .json(
                    new ApiResponse(
                        StatusCodes.OK,
                        {
                            originalUrl
                        },
                        "Password verified successfully"
                    )
                );
        }
    );

/*
 * Get My URLs
 */

const getMyUrls =
    asyncHandler(
        async (req, res) => {

            const page =
                Math.max(
                    parseInt(
                        req.query.page
                    ) || 1,
                    1
                );


            const limit =
                Math.min(
                    Math.max(
                        parseInt(
                            req.query.limit
                        ) || 10,
                        1
                    ),
                    100
                );


            const result =
                await getUserUrls(
                    req.user.sub,
                    page,
                    limit
                );


            /*
             * Add the complete short URL
             * to every returned URL.
             *
             * This keeps URL construction
             * inside the backend.
             */

            const urls =
                result.urls.map(
                    (url) => ({
                        id:
                            url._id,

                        originalUrl:
                            url.originalUrl,

                        shortCode:
                            url.shortCode,

                        shortUrl:
                            `${process.env.APP_BASE_URL}/${url.shortCode}`,

                        isActive:
                            url.isActive,

                        expiresAt:
                            url.expiresAt,

                        createdAt:
                            url.createdAt,

                        updatedAt:
                            url.updatedAt
                    })
                );


            return res
                .status(StatusCodes.OK)
                .json(
                    new ApiResponse(
                        StatusCodes.OK,
                        {
                            ...result,
                            urls
                        },
                        "URLs fetched successfully"
                    )
                );
        }
    );



/*
 * Get Single URL
 */

const getUrl =
    asyncHandler(
        async (req, res) => {

            const {
                id
            } = req.params;


            const shortUrl =
                await getUrlById(
                    id,
                    req.user.sub
                );


            return res
                .status(StatusCodes.OK)
                .json(
                    new ApiResponse(
                        StatusCodes.OK,
                        {
                            id:
                                shortUrl._id,

                            originalUrl:
                                shortUrl.originalUrl,

                            shortCode:
                                shortUrl.shortCode,

                            shortUrl:
                                `${process.env.APP_BASE_URL}/${shortUrl.shortCode}`,

                            isActive:
                                shortUrl.isActive,

                            expiresAt:
                                shortUrl.expiresAt,

                            createdAt:
                                shortUrl.createdAt,

                            updatedAt:
                                shortUrl.updatedAt
                        },
                        "URL fetched successfully"
                    )
                );
        }
    );



/*
 * Update My URL
 */

const updateMyUrl =
    asyncHandler(
        async (req, res) => {

            const {
                id
            } = req.params;


            const {
                originalUrl,
                expiresAt,
                isActive
            } = req.body;


            /*
             * At least one field
             * must be provided.
             */

            if (
                originalUrl === undefined &&
                expiresAt === undefined &&
                isActive === undefined
            ) {

                throw new ApiError(
                    StatusCodes.BAD_REQUEST,
                    "At least one field is required"
                );
            }


            const shortUrl =
                await updateUrl(
                    id,
                    req.user.sub,
                    {
                        originalUrl,
                        expiresAt,
                        isActive
                    }
                );


            return res
                .status(StatusCodes.OK)
                .json(
                    new ApiResponse(
                        StatusCodes.OK,
                        {
                            id:
                                shortUrl._id,

                            originalUrl:
                                shortUrl.originalUrl,

                            shortCode:
                                shortUrl.shortCode,

                            shortUrl:
                                `${process.env.APP_BASE_URL}/${shortUrl.shortCode}`,

                            isActive:
                                shortUrl.isActive,

                            expiresAt:
                                shortUrl.expiresAt,

                            createdAt:
                                shortUrl.createdAt,

                            updatedAt:
                                shortUrl.updatedAt
                        },
                        "URL updated successfully"
                    )
                );
        }
    );



/*
 * Deactivate My URL
 *
 * NOTE:
 * deleteUrl() currently performs a
 * soft delete by setting isActive=false.
 */

const deleteMyUrl =
    asyncHandler(
        async (req, res) => {

            const {
                id
            } = req.params;


            await deleteUrl(
                id,
                req.user.sub
            );


            return res
                .status(StatusCodes.OK)
                .json(
                    new ApiResponse(
                        StatusCodes.OK,
                        null,
                        "Short URL deactivated successfully"
                    )
                );
        }
    );



/*
 * Get Analytics
 */

const getAnalytics =
    asyncHandler(
        async (req, res) => {

            const {
                id
            } = req.params;


            const {
                period = "7d"
            } = req.query;


            const analytics =
                await getUrlAnalytics(
                    id,
                    req.user.sub,
                    period
                );


            return res
                .status(StatusCodes.OK)
                .json(
                    new ApiResponse(
                        StatusCodes.OK,
                        analytics,
                        "Analytics fetched successfully"
                    )
                );
        }
    );



/*
 * Get Analytics By Date
 */

const getAnalyticsByDate =
    asyncHandler(
        async (req, res) => {

            const {
                id
            } = req.params;


            const {
                date
            } = req.query;


            const analytics =
                await getUrlAnalyticsByDate(
                    id,
                    req.user.sub,
                    date
                );


            return res
                .status(StatusCodes.OK)
                .json(
                    new ApiResponse(
                        StatusCodes.OK,
                        analytics,
                        "Date analytics fetched successfully"
                    )
                );
        }
    );



module.exports = {

    createUrl,

    redirectToOriginalUrl,

    getMyUrls,

    getUrl,

    updateMyUrl,

    deleteMyUrl,

    getAnalytics,

    getAnalyticsByDate,

    accessProtectedUrl

};