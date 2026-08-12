const asyncHandler =
    require("../utils/asyncHandler");

const {
    StatusCodes
} = require("http-status-codes");

const ApiResponse =
    require("../utils/ApiResponse");

const {
    createShortUrl
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

module.exports = {
    createUrl
};