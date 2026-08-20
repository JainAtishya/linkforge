import { useEffect, useState } from "react";

import {
    getUrls,
    getAnalytics,
    getAnalyticsByDate
} from "../../api/url.api";


function Analytics() {

    const [urls, setUrls] = useState([]);

    const [selectedUrlId, setSelectedUrlId] =
        useState("");

    const [period, setPeriod] =
        useState("7d");

    const [analytics, setAnalytics] =
        useState(null);

    const [selectedDate, setSelectedDate] =
        useState("");

    const [dateAnalytics, setDateAnalytics] =
        useState(null);

    const [loading, setLoading] =
        useState(true);

    const [analyticsLoading, setAnalyticsLoading] =
        useState(false);

    const [dateLoading, setDateLoading] =
        useState(false);

    const [error, setError] =
        useState("");

    const [dateError, setDateError] =
        useState("");


    /*
     * Load user's URLs
     */

    async function loadUrls() {

        try {

            setLoading(true);
            setError("");

            const response =
                await getUrls(1, 100);

            const userUrls =
                response.data.urls;

            setUrls(userUrls);


            /*
             * Automatically select
             * the first URL.
             */

            if (userUrls.length > 0) {

                setSelectedUrlId(
                    userUrls[0].id
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

            setLoading(false);

        }
    }


    useEffect(() => {

        loadUrls();

    }, []);


    /*
     * Load analytics whenever
     * selected URL or period changes.
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
                response.data
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
     * Load analytics for a specific date.
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
                response.data
            );

        } catch (error) {

            console.error(
                "Failed to load date analytics:",
                error
            );

            setDateError(
                error.response?.data?.message ||
                "Unable to load date analytics."
            );

            setDateAnalytics(null);

        } finally {

            setDateLoading(false);

        }
    }


    /*
     * Loading URLs
     */

    if (loading) {

        return (
            <div className="dashboard-state">
                Loading analytics...
            </div>
        );

    }


    /*
     * Error while loading URLs
     */

    if (
        error &&
        urls.length === 0
    ) {

        return (
            <div className="dashboard-state dashboard-error">
                {error}
            </div>
        );

    }


    /*
     * No URLs
     */

    if (urls.length === 0) {

        return (
            <div className="dashboard-page">

                <header className="dashboard-header">

                    <div>

                        <p className="dashboard-eyebrow">
                            Insights
                        </p>

                        <h1>
                            Analytics
                        </h1>

                        <p>
                            Track how your short links
                            are performing.
                        </p>

                    </div>

                </header>


                <div className="dashboard-empty">

                    <h3>
                        No links to analyze
                    </h3>

                    <p>
                        Create a short link first
                        to see its analytics.
                    </p>

                </div>

            </div>
        );

    }


    return (
        <div className="dashboard-page">

            {/* =========================
                Header
               ========================= */}

            <header className="dashboard-header">

                <div>

                    <p className="dashboard-eyebrow">
                        Insights
                    </p>

                    <h1>
                        Analytics
                    </h1>

                    <p>
                        Track how your short links
                        are performing.
                    </p>

                </div>

            </header>


            {/* =========================
                Controls
               ========================= */}

            <section className="analytics-controls">

                <div className="analytics-control">

                    <label htmlFor="analytics-url">
                        Short URL
                    </label>

                    <select
                        id="analytics-url"
                        value={selectedUrlId}
                        onChange={event => {

                            setSelectedUrlId(
                                event.target.value
                            );

                            setDateAnalytics(null);
                            setSelectedDate("");

                        }}
                    >

                        {urls.map(url => (

                            <option
                                key={url.id}
                                value={url.id}
                            >
                                {url.shortCode}
                            </option>

                        ))}

                    </select>

                </div>


                <div className="analytics-control">

                    <label htmlFor="analytics-period">
                        Period
                    </label>

                    <select
                        id="analytics-period"
                        value={period}
                        onChange={event =>
                            setPeriod(
                                event.target.value
                            )
                        }
                    >

                        <option value="7d">
                            Last 7 days
                        </option>

                        <option value="30d">
                            Last 30 days
                        </option>

                        <option value="90d">
                            Last 90 days
                        </option>

                    </select>

                </div>

            </section>


            {/* =========================
                Selected URL
               ========================= */}

            {analytics && (

                <section className="analytics-url-info">

                    <div>

                        <span>
                            Short link
                        </span>

                        <strong>
                            {analytics.url.shortCode}
                        </strong>

                    </div>


                    <div>

                        <span>
                            Destination
                        </span>

                        <p>
                            {analytics.url.originalUrl}
                        </p>

                    </div>

                </section>

            )}


            {error && (

                <div className="dashboard-error-box">
                    {error}
                </div>

            )}


            {/* =========================
                Analytics
               ========================= */}

            {analyticsLoading ? (

                <div className="dashboard-state">
                    Loading analytics...
                </div>

            ) : analytics && (

                <>

                    {/* =========================
                        Summary Cards
                       ========================= */}

                    <section className="analytics-summary">

                        <div className="analytics-card">

                            <span>
                                Total clicks
                            </span>

                            <strong>
                                {analytics.totalClicks}
                            </strong>

                        </div>


                        <div className="analytics-card">

                            <span>
                                Period clicks
                            </span>

                            <strong>
                                {analytics.periodClicks}
                            </strong>

                        </div>


                        <div className="analytics-card">

                            <span>
                                Period
                            </span>

                            <strong>
                                {analytics.period}
                            </strong>

                        </div>

                    </section>


                    {/* =========================
                        Clicks Over Time
                       ========================= */}

                    <section className="analytics-panel">

                        <div className="analytics-panel-header">

                            <div>

                                <h2>
                                    Clicks over time
                                </h2>

                                <p>
                                    Click activity during
                                    the selected period.
                                </p>

                            </div>

                        </div>


                        {analytics.clicksOverTime.length === 0 ? (

                            <div className="analytics-empty">
                                No clicks during this period.
                            </div>

                        ) : (

                            <div className="clicks-list">

                                {analytics.clicksOverTime.map(
                                    item => (

                                        <div
                                            className="click-row"
                                            key={item.date}
                                        >

                                            <span>
                                                {new Date(
                                                    item.date
                                                ).toLocaleDateString(
                                                    undefined,
                                                    {
                                                        month: "short",
                                                        day: "numeric"
                                                    }
                                                )}
                                            </span>


                                            <div className="click-bar-wrapper">

                                                <div
                                                    className="click-bar"
                                                    style={{
                                                        width: `${
                                                            (
                                                                item.count /
                                                                Math.max(
                                                                    ...analytics
                                                                        .clicksOverTime
                                                                        .map(
                                                                            item =>
                                                                                item.count
                                                                        )
                                                                )
                                                            ) * 100
                                                        }%`
                                                    }}
                                                />

                                            </div>


                                            <strong>
                                                {item.count}
                                            </strong>

                                        </div>

                                    )
                                )}

                            </div>

                        )}

                    </section>


                    {/* =========================
                        Breakdown
                       ========================= */}

                    <section className="analytics-grid">

                        {/* Devices */}

                        <div className="analytics-panel">

                            <div className="analytics-panel-header">

                                <div>

                                    <h2>
                                        Devices
                                    </h2>

                                    <p>
                                        Where your visitors
                                        are coming from.
                                    </p>

                                </div>

                            </div>


                            <div className="analytics-breakdown">

                                {analytics.clicksByDevice.map(
                                    item => (

                                        <div
                                            className="breakdown-row"
                                            key={
                                                item._id ||
                                                "unknown-device"
                                            }
                                        >

                                            <span>
                                                {item._id || "Unknown"}
                                            </span>

                                            <strong>
                                                {item.count}
                                            </strong>

                                        </div>

                                    )
                                )}

                            </div>

                        </div>


                        {/* Browsers */}

                        <div className="analytics-panel">

                            <div className="analytics-panel-header">

                                <div>

                                    <h2>
                                        Browsers
                                    </h2>

                                    <p>
                                        Browsers used to
                                        open your links.
                                    </p>

                                </div>

                            </div>


                            <div className="analytics-breakdown">

                                {analytics.clicksByBrowser.map(
                                    item => (

                                        <div
                                            className="breakdown-row"
                                            key={
                                                item._id ||
                                                "unknown-browser"
                                            }
                                        >

                                            <span>
                                                {item._id || "Unknown"}
                                            </span>

                                            <strong>
                                                {item.count}
                                            </strong>

                                        </div>

                                    )
                                )}

                            </div>

                        </div>


                        {/* Countries */}

                        <div className="analytics-panel">

                            <div className="analytics-panel-header">

                                <div>

                                    <h2>
                                        Countries
                                    </h2>

                                    <p>
                                        Geographic distribution
                                        of clicks.
                                    </p>

                                </div>

                            </div>


                            <div className="analytics-breakdown">

                                {analytics.clicksByCountry.map(
                                    item => (

                                        <div
                                            className="breakdown-row"
                                            key={
                                                item._id ||
                                                "unknown-country"
                                            }
                                        >

                                            <span>
                                                {item._id || "Unknown"}
                                            </span>

                                            <strong>
                                                {item.count}
                                            </strong>

                                        </div>

                                    )
                                )}

                            </div>

                        </div>

                    </section>


                    {/* =========================
                        Date Analytics
                       ========================= */}

                    <section className="analytics-panel date-analytics-panel">

                        <div className="analytics-panel-header">

                            <div>

                                <h2>
                                    Daily analytics
                                </h2>

                                <p>
                                    View detailed analytics
                                    for a specific date.
                                </p>

                            </div>

                        </div>


                        <div className="date-analytics-controls">

                            <div className="analytics-control">

                                <label htmlFor="analytics-date">
                                    Select date
                                </label>

                                <input
                                    id="analytics-date"
                                    type="date"
                                    value={selectedDate}
                                    onChange={event => {
                                        setSelectedDate(
                                            event.target.value
                                        );

                                        setDateAnalytics(
                                            null
                                        );

                                        setDateError("");
                                    }}
                                />

                            </div>


                            <button
                                className="dashboard-primary-button"
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
                                    : "View date"}
                            </button>

                        </div>


                        {dateError && (

                            <div className="dashboard-error-box">
                                {dateError}
                            </div>

                        )}


                        {dateAnalytics && (

                            <div className="date-results">

                                <div className="date-total">

                                    <span>
                                        Total clicks
                                    </span>

                                    <strong>
                                        {dateAnalytics.totalClicks}
                                    </strong>

                                </div>


                                <div className="analytics-breakdown">

                                    {dateAnalytics.clicksByDevice.map(
                                        item => (

                                            <div
                                                className="breakdown-row"
                                                key={
                                                    `date-device-${
                                                        item._id ||
                                                        "unknown"
                                                    }`
                                                }
                                            >

                                                <span>
                                                    Device:{" "}
                                                    {item._id ||
                                                        "Unknown"}
                                                </span>

                                                <strong>
                                                    {item.count}
                                                </strong>

                                            </div>

                                        )
                                    )}


                                    {dateAnalytics.clicksByBrowser.map(
                                        item => (

                                            <div
                                                className="breakdown-row"
                                                key={
                                                    `date-browser-${
                                                        item._id ||
                                                        "unknown"
                                                    }`
                                                }
                                            >

                                                <span>
                                                    Browser:{" "}
                                                    {item._id ||
                                                        "Unknown"}
                                                </span>

                                                <strong>
                                                    {item.count}
                                                </strong>

                                            </div>

                                        )
                                    )}


                                    {dateAnalytics.clicksByCountry.map(
                                        item => (

                                            <div
                                                className="breakdown-row"
                                                key={
                                                    `date-country-${
                                                        item._id ||
                                                        "unknown"
                                                    }`
                                                }
                                            >

                                                <span>
                                                    Country:{" "}
                                                    {item._id ||
                                                        "Unknown"}
                                                </span>

                                                <strong>
                                                    {item.count}
                                                </strong>

                                            </div>

                                        )
                                    )}

                                </div>

                            </div>

                        )}

                    </section>

                </>
            )}

        </div>
    );
}


export default Analytics;