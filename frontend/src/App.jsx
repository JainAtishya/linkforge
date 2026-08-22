import {
    Routes,
    Route,
    Outlet
} from "react-router-dom";

import Navbar from "./components/Navbar";
import Footer from "./components/Footer";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";

import ProtectedUrl from "./pages/ProtectedUrl";

import UrlUnavailable from "./pages/UrlUnavailable";

import DashboardLayout from "./layouts/DashboardLayout";
import Dashboard from "./pages/dashboard/Dashboard";
import MyUrls from "./pages/dashboard/MyUrls";
import Analytics from "./pages/dashboard/Analytics";


function PublicLayout() {

    return (
        <>
            <Navbar />
            <Outlet />
            <Footer />
        </>
    );
}


function App() {

    return (

        <Routes>

            {/* =========================
                Public Pages
               ========================= */}

            <Route element={<PublicLayout />}>

                <Route
                    path="/"
                    element={<Home />}
                />

                <Route
                    path="/login"
                    element={<Login />}
                />

                <Route
                    path="/register"
                    element={<Register />}
                />

            </Route>


            {/* =========================
                Protected URL Access
            ========================= */}

            <Route
                path="/protected/:shortCode"
                element={<ProtectedUrl />}
            />

            <Route
                path="/url-unavailable"
                element={<UrlUnavailable />}
            />

            {/* =========================
                Dashboard
               ========================= */}

            <Route
                path="/dashboard"
                element={<DashboardLayout />}
            >

                <Route
                    index
                    element={<Dashboard />}
                />

                <Route
                    path="urls"
                    element={<MyUrls />}
                />

                <Route
                    path="analytics"
                    element={<Analytics />}
                />

            </Route>

        </Routes>
    );
}


export default App;