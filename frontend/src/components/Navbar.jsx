import { Link } from "react-router-dom";

function Navbar() {
    return (
        <nav className="navbar">

            <Link
                to="/"
                className="navbar-brand"
            >
                LinkForge
            </Link>


            <div className="navbar-links">

                <a href="#features">
                    Features
                </a>

                <a href="#how-it-works">
                    How it works
                </a>

                <Link to="/login">
                    Login
                </Link>

                <Link
                    to="/register"
                    className="navbar-register"
                >
                    Get Started
                </Link>

            </div>

        </nav>
    );
}

export default Navbar;