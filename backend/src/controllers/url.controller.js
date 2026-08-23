const asyncHandler =
    require("../utils/asyncHandler");

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
    requestUrlDeletion,
    restoreUrl,
    verifyUrlPassword
} = require("../services/url.service");

const {
    getUrlAnalytics,
    getUrlAnalyticsByDate
} = require("../services/analytics.service");


/*
 * Create Short URL
 */
const createUrl =
    asyncHandler(
        async (req, res) => {

            const {
                originalUrl,
                expiresAt,
                customAlias,
                password
            } = req.body;


            const shortUrl =
                await createShortUrl({

                    userId:
                        req.user.sub,

                    originalUrl,

                    expiresAt,

                    customAlias,

                    password
                });


            return res
                .status(
                    StatusCodes.CREATED
                )
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
                                shortUrl.isPasswordProtected,

                            isActive:
                                shortUrl.isActive,

                            deletionRequestedAt:
                                shortUrl.deletionRequestedAt
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


            try {

                const {
                    urlId,
                    originalUrl
                } =
                    await getOriginalUrl(
                        shortCode
                    );


                /*
                 * Collect analytics information
                 * only for successful URL access.
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
                 * Count the click only after
                 * successful URL validation.
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
                 * Redirect to the original URL.
                 */
                return res.redirect(
                    302,
                    originalUrl
                );

            } catch (error) {

                const frontendUrl =
                    process.env.FRONTEND_URL ||
                    "http://localhost:5173";


                /*
                 * Password protected URL.
                 *
                 * Send the user to our React
                 * password page instead of
                 * returning JSON.
                 */
                if (
                    error.statusCode ===
                    StatusCodes.UNAUTHORIZED
                ) {

                    return res.redirect(
                        `${frontendUrl}/protected/${shortCode}`
                    );
                }


                /*
                 * Expired URL.
                 */
                if (
                    error.statusCode ===
                    StatusCodes.GONE &&
                    error.message ===
                        "Short URL has expired"
                ) {

                    return res.redirect(
                        `${frontendUrl}/url-unavailable?reason=expired`
                    );
                }


                /*
                 * Deactivated URL.
                 *
                 * This also covers URLs that are
                 * pending permanent deletion because
                 * requesting deletion sets isActive=false.
                 */
                if (
                    error.statusCode ===
                    StatusCodes.GONE &&
                    error.message ===
                        "Short URL has been deactivated"
                ) {

                    return res.redirect(
                        `${frontendUrl}/url-unavailable?reason=deactivated`
                    );
                }


                /*
                 * URL does not exist.
                 */
                if (
                    error.statusCode ===
                    StatusCodes.NOT_FOUND
                ) {

                    return res.redirect(
                        `${frontendUrl}/url-unavailable?reason=not-found`
                    );
                }


                /*
                 * Unexpected error.
                 *
                 * Re-throw it so the normal
                 * global error handler handles it.
                 */
                throw error;
            }
        }
    );


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


            const {
                urlId,
                originalUrl
            } =
                await verifyUrlPassword(
                    shortCode,
                    password
                );


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
             * Only count the click after
             * successful password verification.
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


            return res
                .status(
                    StatusCodes.OK
                )
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
                
            const search =
                typeof req.query.search === "string"
                    ? req.query.search.trim()
                    : "";


            const result =
                await getUserUrls(
                    req.user.sub,
                    page,
                    limit
                );


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

                        deletionRequestedAt:
                            url.deletionRequestedAt,

                        isPasswordProtected:
                            url.isPasswordProtected,

                        createdAt:
                            url.createdAt,

                        updatedAt:
                            url.updatedAt
                    })
                );


            return res
                .status(
                    StatusCodes.OK
                )
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
                .status(
                    StatusCodes.OK
                )
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

                            deletionRequestedAt:
                                shortUrl.deletionRequestedAt,

                            isPasswordProtected:
                                shortUrl.isPasswordProtected,

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
 *
 * Used for:
 * - editing
 * - deactivate
 * - reactivate
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
                .status(
                    StatusCodes.OK
                )
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

                            deletionRequestedAt:
                                shortUrl.deletionRequestedAt,

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
 * Request URL deletion.
 *
 * This starts the 30-day grace period.
 */
const requestDeleteUrl =
    asyncHandler(
        async (req, res) => {

            const {
                id
            } = req.params;


            const shortUrl =
                await requestUrlDeletion(
                    id,
                    req.user.sub
                );


            return res
                .status(
                    StatusCodes.OK
                )
                .json(

                    new ApiResponse(
                        StatusCodes.OK,

                        {
                            id:
                                shortUrl._id,

                            isActive:
                                shortUrl.isActive,

                            deletionRequestedAt:
                                shortUrl.deletionRequestedAt
                        },

                        "URL scheduled for deletion"
                    )
                );
        }
    );


/*
 * Restore URL from deletion window.
 */
const restoreDeletedUrl =
    asyncHandler(
        async (req, res) => {

            const {
                id
            } = req.params;


            const shortUrl =
                await restoreUrl(
                    id,
                    req.user.sub
                );


            return res
                .status(
                    StatusCodes.OK
                )
                .json(

                    new ApiResponse(
                        StatusCodes.OK,

                        {
                            id:
                                shortUrl._id,

                            isActive:
                                shortUrl.isActive,

                            deletionRequestedAt:
                                shortUrl.deletionRequestedAt
                        },

                        "URL restored successfully"
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
                .status(
                    StatusCodes.OK
                )
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
                .status(
                    StatusCodes.OK
                )
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

    requestDeleteUrl,

    restoreDeletedUrl,

    getAnalytics,

    getAnalyticsByDate,

    accessProtectedUrl
};