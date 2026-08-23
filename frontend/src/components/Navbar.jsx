import { Link, useLocation } from "react-router-dom";

function Navbar() {
    const location = useLocation();

    const isAuthPage =
        location.pathname === "/login" ||
        location.pathname === "/register";

    return (
        <nav className="navbar">

            <Link
                to="/"
                className="navbar-brand"
            >
                LinkForge
            </Link>

            <div className="navbar-links">

                {!isAuthPage && (
                    <>
                        <a href="#features">
                            Features
                        </a>

                        <a href="#how-it-works">
                            How it works
                        </a>
                    </>
                )}

                <Link to="/login">
                    Login
                </Link>

                {!isAuthPage && (
                    <Link
                        to="/register"
                        className="navbar-register"
                    >
                        Get Started
                    </Link>
                )}

            </div>

        </nav>
    );
}

export default Navbar;