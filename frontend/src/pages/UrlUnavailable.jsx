import { useSearchParams, Link } from "react-router-dom";

function UrlUnavailable() {
    const [searchParams] = useSearchParams();

    const reason = searchParams.get("reason");

    const messages = {
        expired: {
            title: "This link has expired",
            description:
                "The short link you're trying to access is no longer available.",
        },

        deactivated: {
            title: "This link has been deactivated",
            description:
                "The owner of this short link has temporarily deactivated it.",
        },

        "not-found": {
            title: "This link could not be found",
            description:
                "The short link you're trying to access doesn't exist or is no longer available.",
        },
    };

    const content =
        messages[reason] || messages["not-found"];

    return (
        <div className="protected-url-page">
            <div className="protected-url-card">

                <div className="protected-url-icon">
                    🔗
                </div>

                <p className="dashboard-eyebrow">
                    Link Unavailable
                </p>

                <h1>
                    {content.title}
                </h1>

                <p className="protected-url-description">
                    {content.description}
                </p>

                <Link
                    to="/"
                    className="dashboard-primary-button protected-url-submit"
                >
                    Go to LinkForge
                </Link>

            </div>
        </div>
    );
}

export default UrlUnavailable;