import { NavLink, Outlet } from "react-router-dom";


function DashboardLayout() {

    return (
        <div className="dashboard-layout">

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

            </aside>


            <main className="dashboard-main">

                <Outlet />

            </main>

        </div>
    );
}

export default DashboardLayout;