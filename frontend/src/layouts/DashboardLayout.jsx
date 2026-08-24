import { useState } from "react";

import {
    NavLink,
    Outlet,
    useNavigate
} from "react-router-dom";

import {
    logout,
    logoutAll
} from "../api/auth.api";


function DashboardLayout() {

    const navigate = useNavigate();

    const [loggingOut, setLoggingOut] =
        useState(false);

    const [loggingOutAll, setLoggingOutAll] =
        useState(false);

    const [logoutError, setLogoutError] =
        useState("");

    const [sidebarOpen, setSidebarOpen] =
        useState(false);


    const handleLogout = async () => {

        if (loggingOut) {
            return;
        }

        setLoggingOut(true);
        setLogoutError("");

        try {

            await logout();

            navigate("/login", {
                replace: true
            });

        } catch (error) {

            console.error(
                "Logout failed:",
                error
            );

            setLogoutError(
                error.response?.data?.message ||
                "Unable to logout. Please try again."
            );

        } finally {

            setLoggingOut(false);

        }
    };


    const handleLogoutAll = async () => {

        if (loggingOutAll) {
            return;
        }

        const confirmed =
            window.confirm(
                "Are you sure you want to logout from all devices?"
            );

        if (!confirmed) {
            return;
        }

        setLoggingOutAll(true);
        setLogoutError("");

        try {

            await logoutAll();

            navigate("/login", {
                replace: true
            });

        } catch (error) {

            console.error(
                "Logout from all devices failed:",
                error
            );

            setLogoutError(
                error.response?.data?.message ||
                "Unable to logout from all devices."
            );

        } finally {

            setLoggingOutAll(false);

        }
    };


    const closeSidebar = () => {
        setSidebarOpen(false);
    };


    return (

        <div className="dashboard-layout">

            {/* =========================
                Mobile Header
               ========================= */}

            <header className="dashboard-mobile-header">

                <div className="dashboard-mobile-logo">
                    LinkForge
                </div>

                <button
                    type="button"
                    className="dashboard-menu-button"
                    onClick={() =>
                        setSidebarOpen(true)
                    }
                    aria-label="Open navigation"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="3" y1="12" x2="21" y2="12"></line>
                        <line x1="3" y1="6" x2="21" y2="6"></line>
                        <line x1="3" y1="18" x2="21" y2="18"></line>
                    </svg>
                </button>

            </header>


            {/* =========================
                Mobile Overlay
               ========================= */}

            {sidebarOpen && (
                <div
                    className="dashboard-sidebar-overlay"
                    onClick={closeSidebar}
                />
            )}


            {/* =========================
                Sidebar
               ========================= */}

            <aside
                className={`dashboard-sidebar ${
                    sidebarOpen
                        ? "dashboard-sidebar-open"
                        : ""
                }`}
            >

                <div className="dashboard-sidebar-top">

                    <div className="dashboard-sidebar-header">

                        <div className="dashboard-logo">
                            LinkForge
                        </div>

                        <button
                            type="button"
                            className="dashboard-sidebar-close"
                            onClick={closeSidebar}
                            aria-label="Close navigation"
                        >
                            ×
                        </button>

                    </div>


                    <p className="dashboard-nav-label">
                        Workspace
                    </p>


                    <nav className="dashboard-nav">

                        <NavLink
                            end
                            to="/dashboard"
                            onClick={closeSidebar}
                        >
                            Overview
                        </NavLink>

                        <NavLink
                            to="/dashboard/urls"
                            onClick={closeSidebar}
                        >
                            My URLs
                        </NavLink>

                        <NavLink
                            to="/dashboard/analytics"
                            onClick={closeSidebar}
                        >
                            Analytics
                        </NavLink>

                    </nav>

                </div>


                {/* =========================
                    Sidebar Footer
                   ========================= */}

                <div className="dashboard-sidebar-footer">

                    {logoutError && (
                        <div className="sidebar-logout-error">
                            {logoutError}
                        </div>
                    )}


                    <button
                        type="button"
                        className="dashboard-logout-button"
                        onClick={handleLogout}
                        disabled={
                            loggingOut ||
                            loggingOutAll
                        }
                    >
                        {loggingOut
                            ? "Logging out..."
                            : "Logout"}
                    </button>


                    <button
                        type="button"
                        className="dashboard-logout-all-button"
                        onClick={handleLogoutAll}
                        disabled={
                            loggingOut ||
                            loggingOutAll
                        }
                    >
                        {loggingOutAll
                            ? "Logging out..."
                            : "Logout all devices"}
                    </button>

                </div>

            </aside>


            {/* =========================
                Main Content
               ========================= */}

            <main className="dashboard-main">

                <Outlet />

            </main>

        </div>
    );
}


export default DashboardLayout;