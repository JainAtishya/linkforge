function ProductPreview() {
    return (
        <div className="product-preview">

            <div className="preview-topbar">

                <div className="preview-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                </div>

                <span>
                    LinkForge
                </span>

            </div>


            <div className="preview-body">

                <div className="preview-label">
                    Create a short link
                </div>

                <div className="preview-url">
                    https://youtube.com/watch?v=dQw4w9WgXcQ
                </div>

                <div className="preview-action">
                    Shorten URL
                </div>


                <div className="preview-result">

                    <div>
                        <small>
                            Your short URL
                        </small>

                        <strong>
                            lnkf.gr/QoxfDzsP
                        </strong>
                    </div>

                    <button>
                        Copy
                    </button>

                </div>


                <div className="preview-stats">

                    <div>
                        <strong>1,284</strong>
                        <span>Clicks</span>
                    </div>

                    <div>
                        <strong>23</strong>
                        <span>Countries</span>
                    </div>

                    <div>
                        <strong>3</strong>
                        <span>Devices</span>
                    </div>

                </div>

            </div>

        </div>
    );
}

export default ProductPreview;