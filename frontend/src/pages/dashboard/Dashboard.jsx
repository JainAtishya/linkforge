import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { getCurrentUser } from "../../api/auth.api";
import { getUrls } from "../../api/url.api";


function Dashboard() {

    const [user, setUser] = useState(null);
    const [urls, setUrls] = useState([]);
    const [totalUrls, setTotalUrls] = useState(0);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");


    useEffect(() => {

        async function loadDashboard() {

            try {

                const [userData, urlResponse] =
                    await Promise.all([
                        getCurrentUser(),
                        getUrls(1, 5)
                    ]);


                setUser(userData);

                setUrls(
                    Array.isArray(urlResponse?.data?.urls)
                        ? urlResponse.data.urls
                        : []
                );

                setTotalUrls(
                    urlResponse?.data?.total || 0
                );

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


    if (loading) {

        return (
            <div className="dashboard-state">
                Loading dashboard...
            </div>
        );

    }


    if (error) {

        return (
            <div className="dashboard-state dashboard-error">
                {error}
            </div>
        );

    }


    const activeRecentUrls =
        urls.filter(
            (url) => url.isActive
        ).length;


    const inactiveRecentUrls =
        urls.filter(
            (url) => !url.isActive
        ).length;


    return (

        <div className="dashboard-page">

            {/* =========================
                Header
               ========================= */}

            <header className="dashboard-header">

                <div>

                    <p className="dashboard-eyebrow">
                        Overview
                    </p>


                    <h1>
                        Welcome back
                        {user?.name
                            ? `, ${user.name}`
                            : ""}
                    </h1>


                    <p>
                        Here's what's happening with
                        your links.
                    </p>

                </div>


                <Link
                    to="/dashboard/urls"
                    className="dashboard-primary-button"
                >
                    Create new link
                </Link>

            </header>


            {/* =========================
                Stats
               ========================= */}

            <section className="dashboard-stats">

                <div className="stat-card">

                    <span>
                        Total Links
                    </span>

                    <strong>
                        {totalUrls}
                    </strong>

                </div>


                <div className="stat-card">

                    <span>
                        Recent Active
                    </span>

                    <strong>
                        {activeRecentUrls}
                    </strong>

                </div>


                <div className="stat-card">

                    <span>
                        Recent Inactive
                    </span>

                    <strong>
                        {inactiveRecentUrls}
                    </strong>

                </div>

            </section>


            {/* =========================
                Recent Links
               ========================= */}

            <section className="dashboard-section">

                <div className="dashboard-section-header">

                    <div>

                        <h2>
                            Recent Links
                        </h2>

                        <p>
                            Your recently created
                            short links.
                        </p>

                    </div>


                    <Link to="/dashboard/urls">
                        View all
                    </Link>

                </div>


                {urls.length === 0 ? (

                    <div className="dashboard-empty">

                        <h3>
                            No links to show yet
                        </h3>

                        <p>
                            Create your first short link
                            to get started.
                        </p>


                        <Link
                            to="/dashboard/urls"
                            className="dashboard-secondary-button"
                        >
                            Create a link
                        </Link>

                    </div>

                ) : (

                    <div className="recent-links">

                        {urls.map((url, index) => {

                            const urlKey =
                                url._id ??
                                url.id ??
                                `${url.shortCode}-${index}`;


                            return (

                                <div
                                    className="recent-link"
                                    key={urlKey}
                                >

                                    <div className="recent-link-info">

                                        <strong>
                                            {url.shortCode}
                                        </strong>

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

                        })}

                    </div>

                )}

            </section>

        </div>

    );
}


export default Dashboard;