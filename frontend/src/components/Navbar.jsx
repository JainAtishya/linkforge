function Navbar({ brand }) {
    return (
        <nav>
            <h2>{brand}</h2>

            <div>
                <button>Login</button>
                <button>Register</button>
            </div>
        </nav>
    );
}

export default Navbar;