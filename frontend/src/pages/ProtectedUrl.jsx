import { useState } from "react";
import { useParams } from "react-router-dom";

import { accessProtectedUrl } from "../api/url.api";


function ProtectedUrl() {

    const { shortCode } = useParams();

    const [password, setPassword] =
        useState("");

    const [showPassword, setShowPassword] =
        useState(false);

    const [loading, setLoading] =
        useState(false);

    const [error, setError] =
        useState("");


    async function handleSubmit(event) {

        event.preventDefault();


        /*
         * Basic validation
         */

        if (!password.trim()) {

            setError(
                "Please enter the password."
            );

            return;
        }


        setLoading(true);
        setError("");


        try {

            /*
             * Send password to backend.
             *
             * Backend verifies the password
             * and returns the original URL.
             */

            const response =
                await accessProtectedUrl(
                    shortCode,
                    password
                );


            /*
             * Expected response:
             *
             * {
             *     success: true,
             *     data: {
             *         originalUrl: "https://example.com"
             *     }
             * }
             */

            const originalUrl =
                response?.data?.originalUrl;


            if (!originalUrl) {

                throw new Error(
                    "Original URL was not returned by the server."
                );
            }


            /*
             * Navigate to the actual destination.
             */

            window.location.href =
                originalUrl;


        } catch (error) {

            console.error(
                "Failed to access protected URL:",
                error
            );


            const status =
                error.response?.status;


            if (status === 401) {

                setError(
                    "Incorrect password."
                );

            } else if (status === 404) {

                setError(
                    "This short link was not found."
                );

            } else if (status === 410) {

                setError(
                    "This short link has expired."
                );

            } else {

                setError(
                    error.response?.data?.message ||
                    error.message ||
                    "Unable to access this link."
                );
            }

        } finally {

            setLoading(false);
        }
    }


    return (

        <div className="protected-url-page">

            <div className="protected-url-card">

                {/* Lock icon */}

                <div className="protected-url-icon">
                    🔒
                </div>


                {/* Header */}

                <p className="dashboard-eyebrow">
                    Protected Link
                </p>

                <h1>
                    Password required
                </h1>

                <p className="protected-url-description">
                    This short link is protected.
                    Enter the password to continue.
                </p>


                {/* Error */}

                {error && (

                    <div className="dashboard-error-box">
                        {error}
                    </div>

                )}


                {/* Password form */}

                <form
                    className="protected-url-form"
                    onSubmit={handleSubmit}
                >

                    <div className="form-group">

                        <label
                            htmlFor="protected-password"
                        >
                            Password
                        </label>


                        <div className="password-input-wrapper">

                            <input
                                id="protected-password"
                                type={
                                    showPassword
                                        ? "text"
                                        : "password"
                                }
                                value={password}
                                onChange={(event) =>
                                    setPassword(
                                        event.target.value
                                    )
                                }
                                placeholder="Enter password"
                                autoFocus
                                disabled={loading}
                            />


                            <button
                                type="button"
                                className="password-toggle"
                                onClick={() =>
                                    setShowPassword(
                                        previous =>
                                            !previous
                                    )
                                }
                                disabled={loading}
                            >
                                {showPassword
                                    ? "Hide"
                                    : "Show"}
                            </button>

                        </div>

                    </div>


                    <button
                        type="submit"
                        className="dashboard-primary-button protected-url-submit"
                        disabled={loading}
                    >
                        {loading
                            ? "Verifying..."
                            : "Continue"}
                    </button>

                </form>


                {/* Footer */}

                <p className="protected-url-footer">
                    Only the owner of this link can
                    provide the password.
                </p>

            </div>

        </div>
    );
}


export default ProtectedUrl;