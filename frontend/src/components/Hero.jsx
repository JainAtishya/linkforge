import { Link } from "react-router-dom";
import ProductPreview from "./ProductPreview";

function Hero() {
    return (
        <section className="hero">

            <div className="hero-container">

                <div className="hero-content">

                    <p className="hero-eyebrow">
                        Production-Grade URL Shortener
                    </p>

                    <h1>
                        Shorten links.
                        <br />
                        <span>Understand your audience.</span>
                    </h1>

                    <p className="hero-description">
                        LinkForge turns long URLs into powerful short
                        links with deep analytics. Backed by Redis
                        caching, Kafka event streaming, and detailed
                        click analytics.
                    </p>

                    <div className="hero-actions">

                        <Link
                            to="/register"
                            className="primary-button"
                        >
                            Get Started Free
                        </Link>

                        <Link
                            to="/login"
                            className="secondary-button"
                        >
                            Login
                        </Link>

                    </div>

                </div>

                <ProductPreview />

            </div>

        </section>
    );
}

export default Hero;