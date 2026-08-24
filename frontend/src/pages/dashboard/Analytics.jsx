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
const SEARCH_DELAY = 350;


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

    /*
     * Keep the selected URL separately.
     *
     * This is important because the selected
     * URL might disappear from the current
     * search results.
     */
    const [selectedUrlData, setSelectedUrlData] =
        useState(null);

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

    const searchTimerRef =
        useRef(null);

    /*
     * Used to prevent older search
     * requests from overwriting newer
     * search results.
     */
    const searchRequestRef =
        useRef(0);


    /*
     * =========================
     * Load URLs
     * =========================
     */

    async function loadUrls(
        page = 1,
        search = "",
        append = false
    ) {

        const requestId =
            ++searchRequestRef.current;

        try {

            if (append) {
                setLoadingMoreUrls(true);
            } else {
                setLoadingUrls(true);
            }

            setError("");

            /*
             * Backend request:
             *
             * page
             * limit
             * search
             */
            const response =
                await getUrls(
                    page,
                    URLS_PER_PAGE,
                    search
                );


            /*
             * If another search request was
             * started while this request was
             * running, ignore this response.
             */
            if (
                requestId !==
                searchRequestRef.current
            ) {
                return;
            }


            const fetchedUrls =
                Array.isArray(
                    response?.data?.urls
                )
                    ? response.data.urls
                    : [];


            const total =
                response?.data?.total || 0;


            /*
             * =========================
             * Append results
             * =========================
             */

            if (append) {

                setUrls(previousUrls => {

                    const existingIds =
                        new Set(
                            previousUrls.map(
                                url => url.id
                            )
                        );


                    const uniqueUrls =
                        fetchedUrls.filter(
                            url =>
                                !existingIds.has(
                                    url.id
                                )
                        );


                    const updatedUrls = [
                        ...previousUrls,
                        ...uniqueUrls
                    ];


                    setHasMoreUrls(
                        updatedUrls.length < total
                    );


                    return updatedUrls;
                });

            }


            /*
             * =========================
             * Fresh result set
             * =========================
             */

            else {

                setUrls(
                    fetchedUrls
                );

                setUrlPage(
                    page
                );


                /*
                 * Select the first URL only
                 * when there is no selection.
                 */
                if (
                    fetchedUrls.length > 0 &&
                    !selectedUrlId
                ) {

                    setSelectedUrlId(
                        fetchedUrls[0].id
                    );

                    setSelectedUrlData(
                        fetchedUrls[0]
                    );
                }


                setHasMoreUrls(
                    fetchedUrls.length < total
                );
            }

        } catch (error) {

            /*
             * Ignore errors from old requests.
             */
            if (
                requestId !==
                searchRequestRef.current
            ) {
                return;
            }


            console.error(
                "Failed to load URLs:",
                error
            );


            setError(
                error.response?.data?.message ||
                "Unable to load your URLs."
            );

        } finally {

            if (
                requestId ===
                searchRequestRef.current
            ) {

                setLoadingUrls(false);

                setLoadingMoreUrls(false);
                
                setIsInitialLoad(false);
            }
        }
    }


    /*
     * =========================
     * Initial URL load
     * =========================
     */

    useEffect(() => {

        loadUrls(
            1,
            "",
            false
        );

    }, []);


    /*
     * =========================
     * Backend search
     * =========================
     *
     * Search is debounced so we don't
     * make an API request for every
     * individual keystroke.
     */

    useEffect(() => {

        /*
         * Search only while the selector
         * is open.
         */
        if (!selectorOpen) {
            return;
        }


        clearTimeout(
            searchTimerRef.current
        );


        searchTimerRef.current =
            setTimeout(() => {

                const search =
                    urlSearch.trim();


                /*
                 * Start a fresh result set.
                 */
                setUrls([]);

                setUrlPage(1);

                setHasMoreUrls(true);


                loadUrls(
                    1,
                    search,
                    false
                );

            }, SEARCH_DELAY);


        return () => {

            clearTimeout(
                searchTimerRef.current
            );

        };

    }, [
        urlSearch,
        selectorOpen
    ]);


    /*
     * =========================
     * Load more URLs
     * =========================
     */

    async function loadMoreUrls() {

        if (
            loadingUrls ||
            loadingMoreUrls ||
            !hasMoreUrls
        ) {
            return;
        }


        const nextPage =
            urlPage + 1;


        try {

            setLoadingMoreUrls(true);


            const response =
                await getUrls(
                    nextPage,
                    URLS_PER_PAGE,
                    urlSearch.trim()
                );


            const newUrls =
                Array.isArray(
                    response?.data?.urls
                )
                    ? response.data.urls
                    : [];


            const total =
                response?.data?.total || 0;


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


                const updatedUrls = [
                    ...previousUrls,
                    ...uniqueUrls
                ];


                setHasMoreUrls(
                    updatedUrls.length < total
                );


                return updatedUrls;
            });


            setUrlPage(
                nextPage
            );

        } catch (error) {

            console.error(
                "Failed to load more URLs:",
                error
            );


            setError(
                error.response?.data?.message ||
                "Unable to load more URLs."
            );

        } finally {

            setLoadingMoreUrls(
                false
            );
        }
    }


    /*
     * =========================
     * Selector scroll
     * =========================
     */

    function handleSelectorScroll(
        event
    ) {

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
     * Selected URL
     * =========================
     *
     * Prefer selectedUrlData because
     * selected URL may not exist inside
     * the current search result list.
     */

    const selectedUrl =
        selectedUrlData ||
        urls.find(
            url =>
                url.id === selectedUrlId
        );


    /*
     * =========================
     * Select URL
     * =========================
     */

    function handleSelectUrl(url) {

        setSelectedUrlId(
            url.id
        );

        setSelectedUrlData(
            url
        );


        setSelectorOpen(
            false
        );


        setUrlSearch("");


        setDateAnalytics(
            null
        );

        setSelectedDate(
            ""
        );

        setError("");
    }


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

            setAnalyticsLoading(
                true
            );

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


            setAnalytics(
                null
            );

        } finally {

            setAnalyticsLoading(
                false
            );
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

            setDateLoading(
                true
            );

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


            setDateAnalytics(
                null
            );

        } finally {

            setDateLoading(
                false
            );
        }
    }


    const [isInitialLoad, setIsInitialLoad] = useState(true);

    /*
     * =========================
     * Loading
     * =========================
     */

    if (isInitialLoad) {

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
     * 
     * Only show the empty page if we have
     * literally 0 URLs in the account (meaning
     * no URL was ever selected).
     */

    if (!selectedUrlId && urls.length === 0) {

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


    /*
     * =========================
     * Analytics data
     * =========================
     */

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
                URL selector + period
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
                                    {
                                        selectedUrl.originalUrl
                                    }
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
                                    onChange={
                                        event =>
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

                                {loadingUrls ? (

                                    <div className="analytics-url-loading">
                                        Searching...
                                    </div>

                                ) : urls.length === 0 ? (

                                    <div className="analytics-url-empty">
                                        No links found.
                                    </div>

                                ) : (

                                    urls.map(
                                        url => (

                                            <button
                                                type="button"
                                                key={url.id}
                                                className={
                                                    url.id ===
                                                    selectedUrlId
                                                        ? "analytics-url-option selected"
                                                        : "analytics-url-option"
                                                }
                                                onClick={() =>
                                                    handleSelectUrl(
                                                        url
                                                    )
                                                }
                                            >

                                                <strong>
                                                    {
                                                        url.shortCode
                                                    }
                                                </strong>

                                                <span>
                                                    {
                                                        url.originalUrl
                                                    }
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
                                    urls.length > 0 && (

                                        <div className="analytics-url-end">
                                            End of your links
                                        </div>

                                    )}

                            </div>

                        </div>

                    )}

                </div>


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
                                {
                                    analytics.totalClicks ||
                                    0
                                }
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
                                        data={
                                            clicksOverTime
                                        }
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
                                value={
                                    selectedDate
                                }
                                onChange={
                                    event => {

                                        setSelectedDate(
                                            event.target.value
                                        );

                                        setDateAnalytics(
                                            null
                                        );

                                        setDateError(
                                            ""
                                        );
                                    }
                                }
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