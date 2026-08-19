import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import {
    login,
    loginWithGoogle
} from "../api/auth.api";


function Login() {

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();


    async function handleSubmit(event) {

        event.preventDefault();

        setError("");
        setLoading(true);

        try {

            await login(email, password);

            navigate("/dashboard");

        } catch (error) {

            setError(
                error.response?.data?.message ||
                "Something went wrong. Please try again."
            );

        } finally {

            setLoading(false);

        }
    }


    return (
        <main className="auth-page">

            <div className="auth-card">

                <div className="auth-header">

                    <h1>
                        Welcome back
                    </h1>

                    <p>
                        Sign in to manage your links.
                    </p>

                </div>


                {error && (
                    <div className="auth-error">
                        {error}
                    </div>
                )}


                <form
                    className="auth-form"
                    onSubmit={handleSubmit}
                >

                    <div className="form-group">

                        <label htmlFor="email">
                            Email
                        </label>

                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(event) =>
                                setEmail(event.target.value)
                            }
                            placeholder="you@example.com"
                            required
                        />

                    </div>


                    <div className="form-group">

                        <label htmlFor="password">
                            Password
                        </label>

                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(event) =>
                                setPassword(event.target.value)
                            }
                            placeholder="Enter your password"
                            required
                        />

                    </div>


                    <button
                        type="submit"
                        className="auth-submit"
                        disabled={loading}
                    >
                        {loading ? "Signing in..." : "Login"}
                    </button>

                </form>


                <div className="auth-divider">
                    <span>OR</span>
                </div>


                <button
                    type="button"
                    className="google-button"
                    onClick={loginWithGoogle}
                >
                    <svg
                        className="google-icon"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                    >
                        <path
                            fill="#4285F4"
                            d="M21.35 12.27c0-.79-.07-1.55-.22-2.27H12v4.3h5.22a4.47 4.47 0 0 1-1.94 2.93v2.43h3.14c1.84-1.69 2.93-4.18 2.93-7.39Z"
                        />
                        <path
                            fill="#34A853"
                            d="M12 21.75c2.63 0 4.84-.87 6.45-2.36l-3.14-2.43c-.87.58-1.98.92-3.31.92-2.54 0-4.7-1.72-5.47-4.03H3.29v2.51A9.74 9.74 0 0 0 12 21.75Z"
                        />
                        <path
                            fill="#FBBC05"
                            d="M6.53 13.85A5.85 5.85 0 0 1 6.22 12c0-.64.11-1.26.31-1.85V7.64H3.29A9.75 9.75 0 0 0 2.25 12c0 1.57.38 3.05 1.04 4.36l3.24-2.51Z"
                        />
                        <path
                            fill="#EA4335"
                            d="M12 6.12c1.43 0 2.71.49 3.72 1.46l2.79-2.79C16.84 3.12 14.63 2.25 12 2.25a9.75 9.75 0 0 0-8.71 5.39l3.24 2.51c.77-2.31 2.93-4.03 5.47-4.03Z"
                        />
                    </svg>

                    <span>Continue with Google</span>
                </button>


                <p className="auth-footer">
                    Don't have an account?{" "}
                    <Link to="/register">
                        Create one
                    </Link>
                </p>

            </div>

        </main>
    );
}

export default Login;