const asyncHandler = require("../utils/asyncHandler");

const {
    getDevice,
    getBrowser
} = require("../utils/userAgent");

const { StatusCodes } = require("http-status-codes");

const ApiResponse = require("../utils/ApiResponse");

const ApiError = require("../utils/ApiError");

const { publishUrlClicked } = require("../services/kafka.service");

const {
  createShortUrl,
  getOriginalUrl,
  getUserUrls,
  getUrlById,
  updateUrl,
  deleteUrl,
} = require("../services/url.service");

const {
    getUrlAnalytics,
    getUrlAnalyticsByDate
} = require("../services/analytics.service");

const createUrl = asyncHandler(async (req, res) => {
  const { originalUrl, expiresAt } = req.body;

  const shortUrl = await createShortUrl({
    userId: req.user.sub,
    originalUrl,
    expiresAt,
  });

  return res.status(StatusCodes.CREATED).json(
    new ApiResponse(
      StatusCodes.CREATED,
      {
        id: shortUrl._id,
        originalUrl: shortUrl.originalUrl,
        shortCode: shortUrl.shortCode,
        shortUrl: `${process.env.APP_BASE_URL}/${shortUrl.shortCode}`,
        expiresAt: shortUrl.expiresAt,
      },
      "Short URL created successfully",
    ),
  );
});

const redirectToOriginalUrl = asyncHandler(
    async (req, res) => {

        const {
            shortCode
        } = req.params;


        const {
            urlId,
            originalUrl
        } = await getOriginalUrl(
            shortCode
        );


        /*
         * Extract request metadata.
         */

        const userAgent =
            req.get("user-agent") || "";


        const ipAddress =
            req.ip;


        const referrer =
            req.get("referer") || null;


        const device =
            getDevice(userAgent);


        const browser =
            getBrowser(userAgent);


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

const getMyUrls = asyncHandler(async (req, res) => {
  const page = Math.max(parseInt(req.query.page) || 1, 1);

  const limit = Math.min(Math.max(parseInt(req.query.limit) || 10, 1), 100);

  const result = await getUserUrls(req.user.sub, page, limit);

  return res
    .status(StatusCodes.OK)
    .json(new ApiResponse(StatusCodes.OK, result, "URLs fetched successfully"));
});

const getUrl = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const shortUrl = await getUrlById(id, req.user.sub);

  return res.status(StatusCodes.OK).json(
    new ApiResponse(
      StatusCodes.OK,
      {
        id: shortUrl._id,
        originalUrl: shortUrl.originalUrl,
        shortCode: shortUrl.shortCode,
        shortUrl: `${process.env.APP_BASE_URL}/${shortUrl.shortCode}`,
        isActive: shortUrl.isActive,
        expiresAt: shortUrl.expiresAt,
        createdAt: shortUrl.createdAt,
        updatedAt: shortUrl.updatedAt,
      },
      "URL fetched successfully",
    ),
  );
});

const updateMyUrl = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const { originalUrl, expiresAt } = req.body;

  if (originalUrl === undefined && expiresAt === undefined) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      "At least one field is required",
    );
  }

  const shortUrl = await updateUrl(id, req.user.sub, {
    originalUrl,
    expiresAt,
  });

  return res.status(StatusCodes.OK).json(
    new ApiResponse(
      StatusCodes.OK,
      {
        id: shortUrl._id,
        originalUrl: shortUrl.originalUrl,
        shortCode: shortUrl.shortCode,
        shortUrl: `${process.env.APP_BASE_URL}/${shortUrl.shortCode}`,
        isActive: shortUrl.isActive,
        expiresAt: shortUrl.expiresAt,
        createdAt: shortUrl.createdAt,
        updatedAt: shortUrl.updatedAt,
      },
      "URL updated successfully",
    ),
  );
});

const deleteMyUrl = asyncHandler(async (req, res) => {
  const { id } = req.params;

  await deleteUrl(id, req.user.sub);

  return res
    .status(StatusCodes.OK)
    .json(
      new ApiResponse(StatusCodes.OK, null, "Short URL deleted successfully"),
    );
});

const getAnalytics = asyncHandler(
    async (req, res) => {

        const { id } = req.params;

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

const getAnalyticsByDate = asyncHandler(
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
  getAnalyticsByDate
};
