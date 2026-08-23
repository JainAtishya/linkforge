import {
    useEffect,
    useRef,
    useState
} from "react";

import {
    ResponsiveContainer,
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip
} from "recharts";

import {
    getUrls,
    getAnalytics,
    getAnalyticsByDate
} from "../../api/url.api";


const URLS_PER_PAGE = 10;


function Analytics() {

    /*
     * =========================
     * URLs
     * =========================
     */

    const [urls, setUrls] =
        useState([]);

    const [urlPage, setUrlPage] =
        useState(1);

    const [hasMoreUrls, setHasMoreUrls] =
        useState(true);

    const [loadingUrls, setLoadingUrls] =
        useState(true);

    const [loadingMoreUrls, setLoadingMoreUrls] =
        useState(false);

    const [selectedUrlId, setSelectedUrlId] =
        useState("");

    const [urlSearch, setUrlSearch] =
        useState("");

    const [selectorOpen, setSelectorOpen] =
        useState(false);


    /*
     * =========================
     * Analytics
     * =========================
     */

    const [period, setPeriod] =
        useState("7d");

    const [analytics, setAnalytics] =
        useState(null);

    const [analyticsLoading, setAnalyticsLoading] =
        useState(false);

    const [error, setError] =
        useState("");


    /*
     * =========================
     * Date analytics
     * =========================
     */

    const [selectedDate, setSelectedDate] =
        useState("");

    const [dateAnalytics, setDateAnalytics] =
        useState(null);

    const [dateLoading, setDateLoading] =
        useState(false);

    const [dateError, setDateError] =
        useState("");


    /*
     * =========================
     * Refs
     * =========================
     */

    const selectorRef =
        useRef(null);


    /*
     * =========================
     * Load first page
     * =========================
     */

    async function loadInitialUrls() {

        try {

            setLoadingUrls(true);
            setError("");

            const response =
                await getUrls(
                    1,
                    URLS_PER_PAGE
                );

            const fetchedUrls =
                Array.isArray(
                    response?.data?.urls
                )
                    ? response.data.urls
                    : [];

            setUrls(fetchedUrls);
            setUrlPage(1);

            const total =
                response?.data?.total || 0;

            setHasMoreUrls(
                fetchedUrls.length < total
            );

            if (fetchedUrls.length > 0) {

                setSelectedUrlId(
                    fetchedUrls[0].id
                );

            }

        } catch (error) {

            console.error(
                "Failed to load URLs:",
                error
            );

            setError(
                error.response?.data?.message ||
                "Unable to load your URLs."
            );

        } finally {

            setLoadingUrls(false);

        }
    }


    useEffect(() => {

        loadInitialUrls();

    }, []);


    /*
     * =========================
     * Load more URLs
     * =========================
     */

    async function loadMoreUrls() {

        if (
            loadingMoreUrls ||
            !hasMoreUrls
        ) {
            return;
        }

        try {

            setLoadingMoreUrls(true);

            const nextPage =
                urlPage + 1;

            const response =
                await getUrls(
                    nextPage,
                    URLS_PER_PAGE
                );

            const newUrls =
                Array.isArray(
                    response?.data?.urls
                )
                    ? response.data.urls
                    : [];

            setUrls(previousUrls => {

                const existingIds =
                    new Set(
                        previousUrls.map(
                            url => url.id
                        )
                    );

                const uniqueUrls =
                    newUrls.filter(
                        url =>
                            !existingIds.has(
                                url.id
                            )
                    );

                return [
                    ...previousUrls,
                    ...uniqueUrls
                ];
            });

            setUrlPage(nextPage);

            const total =
                response?.data?.total || 0;

            setHasMoreUrls(
                (
                    urls.length +
                    newUrls.length
                ) < total
            );

        } catch (error) {

            console.error(
                "Failed to load more URLs:",
                error
            );

        } finally {

            setLoadingMoreUrls(false);

        }
    }


    /*
     * =========================
     * Selector scroll
     * =========================
     */

    function handleSelectorScroll(event) {

        const element =
            event.currentTarget;

        const reachedBottom =
            element.scrollTop +
            element.clientHeight >=
            element.scrollHeight - 30;

        if (reachedBottom) {

            loadMoreUrls();

        }
    }


    /*
     * =========================
     * Search
     * =========================
     */

    const filteredUrls =
        urls.filter(url => {

            const search =
                urlSearch
                    .trim()
                    .toLowerCase();

            if (!search) {
                return true;
            }

            return (
                url.shortCode
                    ?.toLowerCase()
                    .includes(search) ||

                url.originalUrl
                    ?.toLowerCase()
                    .includes(search)
            );
        });


    /*
     * =========================
     * Selected URL
     * =========================
     */

    const selectedUrl =
        urls.find(
            url =>
                url.id === selectedUrlId
        );


    /*
     * =========================
     * Analytics
     * =========================
     */

    async function loadAnalytics() {

        if (!selectedUrlId) {
            return;
        }

        try {

            setAnalyticsLoading(true);
            setError("");

            const response =
                await getAnalytics(
                    selectedUrlId,
                    period
                );

            setAnalytics(
                response?.data || null
            );

        } catch (error) {

            console.error(
                "Failed to load analytics:",
                error
            );

            setError(
                error.response?.data?.message ||
                "Unable to load analytics."
            );

            setAnalytics(null);

        } finally {

            setAnalyticsLoading(false);

        }
    }


    useEffect(() => {

        loadAnalytics();

    }, [
        selectedUrlId,
        period
    ]);


    /*
     * =========================
     * Date analytics
     * =========================
     */

    async function handleDateAnalytics() {

        if (
            !selectedUrlId ||
            !selectedDate
        ) {
            return;
        }

        try {

            setDateLoading(true);
            setDateError("");

            const response =
                await getAnalyticsByDate(
                    selectedUrlId,
                    selectedDate
                );

            setDateAnalytics(
                response?.data || null
            );

        } catch (error) {

            console.error(
                "Failed to load date analytics:",
                error
            );

            setDateError(
                error.response?.data?.message ||
                "Unable to load analytics for this date."
            );

            setDateAnalytics(null);

        } finally {

            setDateLoading(false);

        }
    }


    /*
     * =========================
     * Loading
     * =========================
     */

    if (loadingUrls) {

        return (
            <div className="dashboard-state">
                Loading analytics...
            </div>
        );
    }


    /*
     * =========================
     * No URLs
     * =========================
     */

    if (urls.length === 0) {

        return (

            <div className="dashboard-page">

                <div className="analytics-empty-page">

                    <p className="dashboard-eyebrow">
                        Analytics
                    </p>

                    <h1>
                        Nothing to analyse yet.
                    </h1>

                    <p>
                        Create a short link and
                        analytics will appear here.
                    </p>

                </div>

            </div>
        );
    }


    const clicksOverTime =
        analytics?.clicksOverTime || [];

    const clicksByDevice =
        analytics?.clicksByDevice || [];

    const clicksByBrowser =
        analytics?.clicksByBrowser || [];

    const clicksByCountry =
        analytics?.clicksByCountry || [];


    return (

        <div className="dashboard-page analytics-page">


            {/* =========================
                Header
               ========================= */}

            <header className="analytics-header">

                <div>

                    <p className="dashboard-eyebrow">
                        Analytics
                    </p>

                    <h1>
                        Link performance
                    </h1>

                    <p>
                        Understand how your
                        links are being used.
                    </p>

                </div>

            </header>


            {/* =========================
                URL selector
               ========================= */}

            <section className="analytics-toolbar">

                <div
                    className="analytics-url-picker"
                    ref={selectorRef}
                >

                    <button
                        type="button"
                        className="analytics-url-trigger"
                        onClick={() =>
                            setSelectorOpen(
                                previous =>
                                    !previous
                            )
                        }
                    >

                        <div>

                            <span>
                                LINK
                            </span>

                            <strong>
                                {selectedUrl?.shortCode ||
                                    "Select a link"}
                            </strong>

                            {selectedUrl && (

                                <small>
                                    {selectedUrl.originalUrl}
                                </small>

                            )}

                        </div>

                        <span className="selector-arrow">
                            {selectorOpen
                                ? "↑"
                                : "↓"}
                        </span>

                    </button>


                    {selectorOpen && (

                        <div className="analytics-url-menu">

                            <div className="analytics-url-search">

                                <input
                                    type="text"
                                    value={urlSearch}
                                    onChange={event =>
                                        setUrlSearch(
                                            event.target.value
                                        )
                                    }
                                    placeholder="Search links..."
                                    autoFocus
                                />

                            </div>


                            <div
                                className="analytics-url-results"
                                onScroll={
                                    handleSelectorScroll
                                }
                            >

                                {filteredUrls.length === 0 ? (

                                    <div className="analytics-url-empty">
                                        No links found.
                                    </div>

                                ) : (

                                    filteredUrls.map(
                                        url => (

                                            <button
                                                type="button"
                                                key={url.id}
                                                className={
                                                    url.id === selectedUrlId
                                                        ? "analytics-url-option selected"
                                                        : "analytics-url-option"
                                                }
                                                onClick={() => {

                                                    setSelectedUrlId(
                                                        url.id
                                                    );

                                                    setSelectorOpen(
                                                        false
                                                    );

                                                    setUrlSearch("");
                                                    setDateAnalytics(null);
                                                    setSelectedDate("");

                                                }}
                                            >

                                                <strong>
                                                    {url.shortCode}
                                                </strong>

                                                <span>
                                                    {url.originalUrl}
                                                </span>

                                            </button>

                                        )
                                    )

                                )}


                                {loadingMoreUrls && (

                                    <div className="analytics-url-loading">
                                        Loading more links...
                                    </div>

                                )}

                                {!hasMoreUrls &&
                                    filteredUrls.length > 0 && (

                                        <div className="analytics-url-end">
                                            End of your links
                                        </div>

                                    )}

                            </div>

                        </div>

                    )}

                </div>


                {/* Period */}

                <div className="analytics-period">

                    <button
                        type="button"
                        className={
                            period === "7d"
                                ? "selected"
                                : ""
                        }
                        onClick={() =>
                            setPeriod("7d")
                        }
                    >
                        7 days
                    </button>

                    <button
                        type="button"
                        className={
                            period === "30d"
                                ? "selected"
                                : ""
                        }
                        onClick={() =>
                            setPeriod("30d")
                        }
                    >
                        30 days
                    </button>

                    <button
                        type="button"
                        className={
                            period === "90d"
                                ? "selected"
                                : ""
                        }
                        onClick={() =>
                            setPeriod("90d")
                        }
                    >
                        90 days
                    </button>

                </div>

            </section>


            {error && (

                <div className="dashboard-error-box">
                    {error}
                </div>

            )}


            {analyticsLoading ? (

                <div className="analytics-loading">
                    Loading data...
                </div>

            ) : analytics ? (

                <>


                    {/* =========================
                        Overview
                       ========================= */}

                    <section className="analytics-overview">

                        <div className="analytics-total">

                            <span>
                                TOTAL CLICKS
                            </span>

                            <strong>
                                {analytics.totalClicks || 0}
                            </strong>

                            <small>
                                {period === "7d"
                                    ? "Last 7 days"
                                    : period === "30d"
                                        ? "Last 30 days"
                                        : "Last 90 days"}
                            </small>

                        </div>


                        <div className="analytics-link-info">

                            <span>
                                SHORT LINK
                            </span>

                            <strong>
                                {selectedUrl?.shortCode}
                            </strong>

                            <small>
                                {selectedUrl?.originalUrl}
                            </small>

                        </div>

                    </section>


                    {/* =========================
                        Click chart
                       ========================= */}

                    <section className="analytics-chart-panel">

                        <div className="analytics-panel-header">

                            <div>

                                <h2>
                                    Clicks over time
                                </h2>

                                <p>
                                    Daily traffic for this link.
                                </p>

                            </div>

                        </div>


                        <div className="analytics-chart">

                            {clicksOverTime.length === 0 ? (

                                <div className="analytics-no-data">
                                    No clicks recorded during
                                    this period.
                                </div>

                            ) : (

                                <ResponsiveContainer
                                    width="100%"
                                    height={320}
                                >

                                    <LineChart
                                        data={clicksOverTime}
                                        margin={{
                                            top: 20,
                                            right: 20,
                                            left: -20,
                                            bottom: 10
                                        }}
                                    >

                                        <CartesianGrid
                                            vertical={false}
                                            stroke="#e5e1d8"
                                        />

                                        <XAxis
                                            dataKey="date"
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{
                                                fontSize: 12,
                                                fill: "#71808d"
                                            }}
                                            tickFormatter={
                                                value =>
                                                    new Date(
                                                        value
                                                    ).toLocaleDateString(
                                                        undefined,
                                                        {
                                                            month: "short",
                                                            day: "numeric"
                                                        }
                                                    )
                                            }
                                        />

                                        <YAxis
                                            axisLine={false}
                                            tickLine={false}
                                            allowDecimals={false}
                                            tick={{
                                                fontSize: 12,
                                                fill: "#71808d"
                                            }}
                                        />

                                        <Tooltip
                                            contentStyle={{
                                                border:
                                                    "1px solid #ddd9d0",
                                                borderRadius:
                                                    "6px",
                                                background:
                                                    "#fffdf9",
                                                boxShadow:
                                                    "0 8px 24px rgba(20,37,54,0.08)"
                                            }}
                                        />

                                        <Line
                                            type="monotone"
                                            dataKey="count"
                                            stroke="#0f8b8d"
                                            strokeWidth={2}
                                            dot={false}
                                            activeDot={{
                                                r: 4
                                            }}
                                        />

                                    </LineChart>

                                </ResponsiveContainer>

                            )}

                        </div>

                    </section>


                    {/* =========================
                        Traffic
                       ========================= */}

                    <section className="analytics-traffic">

                        <div className="analytics-panel-header">

                            <div>

                                <h2>
                                    Traffic breakdown
                                </h2>

                                <p>
                                    Where your visitors
                                    are coming from.
                                </p>

                            </div>

                        </div>


                        <div className="traffic-columns">

                            <TrafficList
                                title="Devices"
                                items={
                                    clicksByDevice
                                }
                            />

                            <TrafficList
                                title="Browsers"
                                items={
                                    clicksByBrowser
                                }
                            />

                            <TrafficList
                                title="Countries"
                                items={
                                    clicksByCountry
                                }
                            />

                        </div>

                    </section>


                    {/* =========================
                        Date lookup
                       ========================= */}

                    <section className="analytics-date">

                        <div className="analytics-panel-header">

                            <div>

                                <h2>
                                    Daily lookup
                                </h2>

                                <p>
                                    Check traffic for a
                                    specific date.
                                </p>

                            </div>

                        </div>


                        <div className="analytics-date-form">

                            <input
                                type="date"
                                value={selectedDate}
                                onChange={event => {

                                    setSelectedDate(
                                        event.target.value
                                    );

                                    setDateAnalytics(null);
                                    setDateError("");

                                }}
                            />

                            <button
                                type="button"
                                onClick={
                                    handleDateAnalytics
                                }
                                disabled={
                                    !selectedDate ||
                                    dateLoading
                                }
                            >
                                {dateLoading
                                    ? "Loading..."
                                    : "View"}
                            </button>

                        </div>


                        {dateError && (

                            <div className="dashboard-error-box">
                                {dateError}
                            </div>

                        )}


                        {dateAnalytics && (

                            <div className="analytics-date-result">

                                <div>
                                    <span>
                                        Clicks
                                    </span>

                                    <strong>
                                        {
                                            dateAnalytics
                                                .totalClicks ||
                                            0
                                        }
                                    </strong>
                                </div>

                                <div>
                                    <span>
                                        Devices
                                    </span>

                                    <strong>
                                        {
                                            dateAnalytics
                                                .clicksByDevice
                                                ?.length ||
                                            0
                                        }
                                    </strong>
                                </div>

                                <div>
                                    <span>
                                        Countries
                                    </span>

                                    <strong>
                                        {
                                            dateAnalytics
                                                .clicksByCountry
                                                ?.length ||
                                            0
                                        }
                                    </strong>
                                </div>

                            </div>

                        )}

                    </section>

                </>

            ) : null}

        </div>
    );
}


/*
 * =========================
 * Traffic list
 * =========================
 */

function TrafficList({
    title,
    items
}) {

    return (

        <div className="traffic-column">

            <h3>
                {title}
            </h3>

            {items.length === 0 ? (

                <p className="traffic-empty">
                    No data yet.
                </p>

            ) : (

                items.map(
                    (item, index) => (

                        <div
                            className="traffic-row"
                            key={
                                item._id ||
                                `${title}-${index}`
                            }
                        >

                            <span>
                                {item._id ||
                                    "Unknown"}
                            </span>

                            <strong>
                                {item.count || 0}
                            </strong>

                        </div>

                    )
                )

            )}

        </div>
    );
}


export default Analytics;