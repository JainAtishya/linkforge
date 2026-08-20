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