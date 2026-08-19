import { Link } from "react-router-dom";

function CTA() {
    return (
        <section className="cta">

            <div className="cta-content">

                <p className="section-eyebrow">
                    START BUILDING
                </p>

                <h2>
                    Ready to forge your links?
                </h2>

                <p>
                    Create your LinkForge account and start
                    understanding how your audience interacts
                    with your links.
                </p>

                <Link
                    to="/register"
                    className="primary-button"
                >
                    Create your free account
                </Link>

            </div>

        </section>
    );
}

export default CTA;