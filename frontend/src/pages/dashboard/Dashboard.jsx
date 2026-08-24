import { useEffect, useState } from "react";

import { Link } from "react-router-dom";

import { getCurrentUser } from "../../api/auth.api";
import { getUrls } from "../../api/url.api";


function Dashboard() {

    const [user, setUser] =
        useState(null);

    const [urls, setUrls] =
        useState([]);

    const [loading, setLoading] =
        useState(true);

    const [error, setError] =
        useState("");


    /*
     * Load dashboard data
     */

    useEffect(() => {

        async function loadDashboard() {

            try {

                const [
                    userData,
                    urlResponse
                ] = await Promise.all([
                    getCurrentUser(),
                    getUrls(1, 5)
                ]);


                setUser(userData);


                const recentUrls =
                    Array.isArray(
                        urlResponse?.data?.urls
                    )
                        ? urlResponse.data.urls
                        : [];


                setUrls(recentUrls);

            } catch (error) {

                console.error(
                    "Failed to load dashboard:",
                    error
                );

                setError(
                    error.response?.data?.message ||
                    "Unable to load your dashboard."
                );

            } finally {

                setLoading(false);

            }
        }


        loadDashboard();

    }, []);


    /*
     * Loading state
     */

    if (loading) {

        return (
            <div className="dashboard-state">
                Loading dashboard...
            </div>
        );

    }


    /*
     * Error state
     */

    if (error) {

        return (
            <div className="dashboard-state dashboard-error">
                {error}
            </div>
        );

    }


    return (

        <div className="dashboard-overview-page">


            {/* =========================
                Header
               ========================= */}

            <header className="overview-header">

                <div className="overview-header-content">

                    <p className="overview-eyebrow">
                        Workspace
                    </p>

                    <h1>
                        Welcome back
                        {user?.name
                            ? `, ${user.name}`
                            : ""}
                    </h1>

                    <p className="overview-description">
                        Manage your short links and keep
                        everything in one place.
                    </p>

                </div>


                <Link
                    to="/dashboard/urls"
                    state={{
                        openCreateForm: true
                    }}
                    className="dashboard-primary-button"
                >
                    Create new link
                </Link>

            </header>


            {/* =========================
                Main Dashboard Content
               ========================= */}

            <div className="overview-content-grid">


                {/* =========================
                    Recent Links
                   ========================= */}

                <section className="overview-panel">

                    <div className="overview-panel-header">

                        <div>

                            <p className="overview-panel-eyebrow">
                                Activity
                            </p>

                            <h2>
                                Recent links
                            </h2>

                            <p>
                                Your latest short links.
                            </p>

                        </div>


                        <Link
                            to="/dashboard/urls"
                            className="overview-panel-link"
                        >
                            View all
                        </Link>

                    </div>


                    {urls.length === 0 ? (

                        <div className="overview-empty">

                            <h3>
                                No links yet
                            </h3>

                            <p>
                                Create your first short
                                link to get started.
                            </p>

                            <Link
                                to="/dashboard/urls"
                                state={{
                                    openCreateForm: true
                                }}
                                className="dashboard-secondary-button"
                            >
                                Create a link
                            </Link>

                        </div>

                    ) : (

                        <div className="overview-link-list">

                            {urls.map(
                                (url, index) => {

                                    const urlKey =
                                        url._id ??
                                        url.id ??
                                        `${url.shortCode}-${index}`;


                                    return (

                                        <div
                                            className="overview-link-row"
                                            key={urlKey}
                                        >

                                            <div className="overview-link-number">
                                                {String(
                                                    index + 1
                                                ).padStart(
                                                    2,
                                                    "0"
                                                )}
                                            </div>


                                            <div className="overview-link-info">

                                                <a
                                                    href={url.shortUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="short-url-link"
                                                >
                                                    {url.shortUrl}
                                                </a>

                                                <span>
                                                    {url.originalUrl}
                                                </span>

                                            </div>


                                            <span
                                                className={
                                                    url.isActive
                                                        ? "url-status active"
                                                        : "url-status inactive"
                                                }
                                            >
                                                {url.isActive
                                                    ? "Active"
                                                    : "Inactive"}
                                            </span>

                                        </div>

                                    );

                                }
                            )}

                        </div>

                    )}

                </section>


                {/* =========================
                    Quick Actions
                   ========================= */}

                <section className="overview-panel overview-actions-panel">

                    <div className="overview-panel-header">

                        <div>

                            <p className="overview-panel-eyebrow">
                                Shortcuts
                            </p>

                            <h2>
                                Quick actions
                            </h2>

                            <p>
                                Jump to the tools you use most.
                            </p>

                        </div>

                    </div>


                    <div className="overview-actions">

                        <Link
                            to="/dashboard/urls"
                            state={{
                                openCreateForm: true
                            }}
                            className="overview-action"
                        >

                            <span className="overview-action-mark">
                                +
                            </span>

                            <div>

                                <strong>
                                    Create a link
                                </strong>

                                <span>
                                    Shorten a new URL
                                </span>

                            </div>

                        </Link>


                        <Link
                            to="/dashboard/urls"
                            className="overview-action"
                        >

                            <span className="overview-action-mark">
                                →
                            </span>

                            <div>

                                <strong>
                                    Manage URLs
                                </strong>

                                <span>
                                    Edit and control your links
                                </span>

                            </div>

                        </Link>


                        <Link
                            to="/dashboard/analytics"
                            className="overview-action"
                        >

                            <span className="overview-action-mark">
                                ↗
                            </span>

                            <div>

                                <strong>
                                    View analytics
                                </strong>

                                <span>
                                    Track link performance
                                </span>

                            </div>

                        </Link>

                    </div>

                </section>


            </div>

        </div>

    );

}


export default Dashboard;