import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";

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


    /* =========================
       Logout current device
       ========================= */

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


    /* =========================
       Logout all devices
       ========================= */

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


    return (

        <div className="dashboard-layout">

            {/* =========================
                Sidebar
               ========================= */}

            <aside className="dashboard-sidebar">

                <div className="dashboard-logo">
                    LinkForge
                </div>


                <nav className="dashboard-nav">

                    <NavLink to="/dashboard">
                        Overview
                    </NavLink>

                    <NavLink to="/dashboard/urls">
                        My URLs
                    </NavLink>

                    <NavLink to="/dashboard/analytics">
                        Analytics
                    </NavLink>

                </nav>


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