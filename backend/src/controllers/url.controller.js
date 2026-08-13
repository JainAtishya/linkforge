const asyncHandler =
    require("../utils/asyncHandler");

const {
    StatusCodes
} = require("http-status-codes");

const ApiResponse =
    require("../utils/ApiResponse");

const {
    createShortUrl,
    getOriginalUrl
} = require("../services/url.service");

const createUrl = asyncHandler(
    async (req, res) => {

        const {
            originalUrl,
            expiresAt
        } = req.body;

        const shortUrl =
            await createShortUrl({
                userId: req.user.sub,
                originalUrl,
                expiresAt
            });

        return res
            .status(StatusCodes.CREATED)
            .json(
                new ApiResponse(
                    StatusCodes.CREATED,
                    {
                        id: shortUrl._id,
                        originalUrl:
                            shortUrl.originalUrl,
                        shortCode:
                            shortUrl.shortCode,
                        shortUrl:
                            `${process.env.APP_BASE_URL}/${shortUrl.shortCode}`,
                        expiresAt:
                            shortUrl.expiresAt
                    },
                    "Short URL created successfully"
                )
            );
    }
);

const redirectToOriginalUrl = asyncHandler(
    async (req, res) => {

        const { shortCode } = req.params;

        const originalUrl =
            await getOriginalUrl(shortCode);

        return res.redirect(
            302,
            originalUrl
        );
    }
);

module.exports = {
    createUrl,
    redirectToOriginalUrl
};