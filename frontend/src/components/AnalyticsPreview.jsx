function AnalyticsPreview() {
    return (
        <section className="analytics-preview">

            <div className="analytics-container">

                <div className="analytics-content">

                    <p className="section-eyebrow">
                        UNDERSTAND EVERY CLICK
                    </p>

                    <h2>
                        Analytics that tell
                        you what happened.
                    </h2>

                    <p>
                        LinkForge doesn't stop at counting clicks.
                        Understand when people click, what devices
                        they use, where they come from and how your
                        links perform over time.
                    </p>

                </div>


                <div className="analytics-card">

                    <div className="analytics-card-header">

                        <div>
                            <small>
                                Clicks
                            </small>

                            <strong>
                                1,284
                            </strong>
                        </div>

                        <span>
                            Last 30 days
                        </span>

                    </div>


                    <div className="fake-chart">

                        <div style={{ height: "35%" }}></div>
                        <div style={{ height: "52%" }}></div>
                        <div style={{ height: "40%" }}></div>
                        <div style={{ height: "68%" }}></div>
                        <div style={{ height: "55%" }}></div>
                        <div style={{ height: "82%" }}></div>
                        <div style={{ height: "72%" }}></div>
                        <div style={{ height: "95%" }}></div>

                    </div>

                </div>

            </div>

        </section>
    );
}

export default AnalyticsPreview;