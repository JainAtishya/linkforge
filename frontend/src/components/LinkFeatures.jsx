const features = [
    {
        title: "Instant URL Shortening",
        description:
            "Turn long URLs into simple, shareable links in seconds with expiration and lifecycle management.",
    },

    {
        title: "Deep Analytics",
        description:
            "Understand how your links perform with click data across devices, browsers, countries and time.",
    },

    {
        title: "Lightning-Fast Redirects",
        description:
            "Redis caching keeps frequently accessed links fast while MongoDB provides reliable persistence.",
    },

    {
        title: "Event-Driven Analytics",
        description:
            "Click events are processed asynchronously through Kafka so analytics don't slow down redirects.",
    },

    {
        title: "Secure by Default",
        description:
            "Cookie-based authentication, refresh token rotation, session management and reuse detection.",
    },

    {
        title: "Full Link Management",
        description:
            "Create, update, deactivate and manage your links from one place.",
    },
];

function LinkFeatures() {
    return (
        <section id="features" className="link-features">
            <div className="section-container">

                <div className="section-heading">
                    <p className="section-eyebrow">
                        LINK MANAGEMENT
                    </p>

                    <h2>
                        Everything you need to
                        <br />
                        manage links at scale.
                    </h2>

                    <p>
                        From creating short URLs to understanding every click,
                        LinkForge keeps everything in one place.
                    </p>
                </div>

                <div className="feature-grid">
                    {features.map((feature) => (
                        <article
                            className="feature-card"
                            key={feature.title}
                        >
                            <h3>{feature.title}</h3>

                            <p>{feature.description}</p>
                        </article>
                    ))}
                </div>

            </div>
        </section>
    );
}

export default LinkFeatures;