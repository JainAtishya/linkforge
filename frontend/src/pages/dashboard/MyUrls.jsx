import {
    Fragment,
    useEffect,
    useState
} from "react";

import {
    getUrls,
    createUrl,
    updateUrl
} from "../../api/url.api";


function MyUrls() {

    const [urls, setUrls] = useState([]);

    const [loading, setLoading] =
        useState(true);

    const [error, setError] =
        useState("");


    /*
     * Create URL state
     */

    const [showCreateForm, setShowCreateForm] =
        useState(false);

    const [creating, setCreating] =
        useState(false);

    const [createError, setCreateError] =
        useState("");

    const [originalUrl, setOriginalUrl] =
        useState("");

    const [customAlias, setCustomAlias] =
        useState("");

    const [expiresAt, setExpiresAt] =
        useState("");


    /*
     * Edit URL state
     */

    const [editingUrl, setEditingUrl] =
        useState(null);

    const [editOriginalUrl, setEditOriginalUrl] =
        useState("");

    const [editExpiresAt, setEditExpiresAt] =
        useState("");

    const [updating, setUpdating] =
        useState(false);

    const [editError, setEditError] =
        useState("");


    /*
     * Load URLs
     */

    async function loadUrls() {

        try {

            setLoading(true);
            setError("");

            const response =
                await getUrls(1, 100);

            setUrls(
                response.data.urls
            );

        } catch (error) {

            console.error(
                "Failed to load URLs:",
                error
            );

            setError(
                error.response?.data?.message ||
                "Unable to load your URLs."
            );

        } finally {

            setLoading(false);

        }
    }


    useEffect(() => {

        loadUrls();

    }, []);


    /*
     * Create URL
     */

    async function handleCreate(event) {

        event.preventDefault();

        setCreating(true);
        setCreateError("");

        try {

            const response =
                await createUrl({
                    originalUrl,

                    customAlias:
                        customAlias.trim() ||
                        undefined,

                    expiresAt:
                        expiresAt ||
                        undefined
                });


            setUrls(
                previousUrls => [
                    response.data,
                    ...previousUrls
                ]
            );


            /*
             * Clear form
             */

            setOriginalUrl("");
            setCustomAlias("");
            setExpiresAt("");

            setShowCreateForm(false);

        } catch (error) {

            console.error(
                "Failed to create URL:",
                error
            );

            setCreateError(
                error.response?.data?.message ||
                "Unable to create short URL."
            );

        } finally {

            setCreating(false);

        }
    }


    /*
     * Start editing a URL
     */

    function handleEdit(url) {

        setEditingUrl(url);

        setEditOriginalUrl(
            url.originalUrl
        );


        /*
         * Convert ISO date returned
         * by backend into the format
         * required by datetime-local.
         */

        setEditExpiresAt(
            url.expiresAt
                ? new Date(url.expiresAt)
                    .toISOString()
                    .slice(0, 16)
                : ""
        );

        setEditError("");
    }


    /*
     * Cancel editing
     */

    function handleCancelEdit() {

        setEditingUrl(null);

        setEditOriginalUrl("");
        setEditExpiresAt("");

        setEditError("");
    }


    /*
     * Save edited URL
     */

    async function handleSaveEdit(event) {

        event.preventDefault();

        if (!editingUrl) {
            return;
        }

        setUpdating(true);
        setEditError("");

        try {

            const response =
                await updateUrl(
                    editingUrl.id,
                    {
                        originalUrl:
                            editOriginalUrl,

                        expiresAt:
                            editExpiresAt ||
                            null
                    }
                );


            /*
             * Replace the updated URL
             * inside the current list.
             */

            setUrls(
                previousUrls =>
                    previousUrls.map(
                        url =>
                            url.id === editingUrl.id
                                ? response.data
                                : url
                    )
            );


            /*
             * Close edit mode.
             */

            handleCancelEdit();

        } catch (error) {

            console.error(
                "Failed to update URL:",
                error
            );

            setEditError(
                error.response?.data?.message ||
                "Unable to update URL."
            );

        } finally {

            setUpdating(false);

        }
    }


    /*
     * Activate / Deactivate URL
     */

    async function handleToggle(url) {

        try {

            const response =
                await updateUrl(
                    url.id,
                    {
                        isActive:
                            !url.isActive
                    }
                );


            setUrls(
                previousUrls =>
                    previousUrls.map(
                        currentUrl =>
                            currentUrl.id === url.id
                                ? response.data
                                : currentUrl
                    )
            );

        } catch (error) {

            console.error(
                "Failed to update URL:",
                error
            );

            setError(
                error.response?.data?.message ||
                "Unable to update URL."
            );
        }
    }


    /*
     * Copy short URL
     */

    async function handleCopy(url) {

        try {

            await navigator.clipboard.writeText(
                url.shortUrl
            );

        } catch (error) {

            console.error(
                "Failed to copy URL:",
                error
            );
        }
    }


    /*
     * Loading state
     */

    if (loading) {

        return (
            <div className="dashboard-state">
                Loading your URLs...
            </div>
        );

    }


    /*
     * Error state
     */

    if (error && urls.length === 0) {

        return (
            <div className="dashboard-state dashboard-error">
                {error}
            </div>
        );

    }


    return (
        <div className="dashboard-page">

            {/* =========================
                Page Header
               ========================= */}

            <header className="dashboard-header">

                <div>

                    <p className="dashboard-eyebrow">
                        Link Management
                    </p>

                    <h1>
                        My URLs
                    </h1>

                    <p>
                        Create and manage your
                        short links.
                    </p>

                </div>


                <button
                    className="dashboard-primary-button"
                    onClick={() =>
                        setShowCreateForm(
                            previous =>
                                !previous
                        )
                    }
                >
                    {showCreateForm
                        ? "Cancel"
                        : "Create new link"}
                </button>

            </header>


            {/* =========================
                Create URL Form
               ========================= */}

            {showCreateForm && (

                <section className="create-url-card">

                    <div className="create-url-header">

                        <h2>
                            Create a short link
                        </h2>

                        <p>
                            Turn a long URL into a
                            simple, shareable link.
                        </p>

                    </div>


                    {createError && (

                        <div className="dashboard-error-box">
                            {createError}
                        </div>

                    )}


                    <form
                        className="create-url-form"
                        onSubmit={handleCreate}
                    >

                        <div className="form-group">

                            <label htmlFor="originalUrl">
                                Original URL
                            </label>

                            <input
                                id="originalUrl"
                                type="url"
                                value={originalUrl}
                                onChange={event =>
                                    setOriginalUrl(
                                        event.target.value
                                    )
                                }
                                placeholder="https://example.com"
                                required
                            />

                        </div>


                        <div className="form-group">

                            <label htmlFor="customAlias">

                                Custom alias

                                <span>
                                    {" "}Optional
                                </span>

                            </label>

                            <input
                                id="customAlias"
                                type="text"
                                value={customAlias}
                                onChange={event =>
                                    setCustomAlias(
                                        event.target.value
                                    )
                                }
                                placeholder="my-link"
                                minLength={3}
                                maxLength={30}
                                pattern="[a-zA-Z0-9_-]+"
                            />

                        </div>


                        <div className="form-group">

                            <label htmlFor="expiresAt">

                                Expiration

                                <span>
                                    {" "}Optional
                                </span>

                            </label>

                            <input
                                id="expiresAt"
                                type="datetime-local"
                                value={expiresAt}
                                onChange={event =>
                                    setExpiresAt(
                                        event.target.value
                                    )
                                }
                            />

                        </div>


                        <button
                            type="submit"
                            className="dashboard-primary-button"
                            disabled={creating}
                        >
                            {creating
                                ? "Creating..."
                                : "Create short link"}
                        </button>

                    </form>

                </section>

            )}


            {/* =========================
                URLs Section
               ========================= */}

            <section className="urls-section">

                <div className="urls-section-header">

                    <div>

                        <h2>
                            All Links
                        </h2>

                        <p>
                            {urls.length} link
                            {urls.length !== 1
                                ? "s"
                                : ""}
                        </p>

                    </div>

                </div>


                {urls.length === 0 ? (

                    <div className="dashboard-empty">

                        <h3>
                            No links yet
                        </h3>

                        <p>
                            Create your first short
                            link to get started.
                        </p>

                    </div>

                ) : (

                    <div className="url-table-wrapper">

                        <table className="url-table">

                            <thead>

                                <tr>

                                    <th>
                                        Short URL
                                    </th>

                                    <th>
                                        Destination
                                    </th>

                                    <th>
                                        Status
                                    </th>

                                    <th>
                                        Expires
                                    </th>

                                    <th>
                                        Actions
                                    </th>

                                </tr>

                            </thead>


                            <tbody>

                                {urls.map(url => (

                                    <Fragment key={url.id}>

                                        {/* =========================
                                            Edit Row
                                           ========================= */}

                                        {editingUrl?.id === url.id && (

                                            <tr className="edit-url-row">

                                                <td colSpan="5">

                                                    <form
                                                        className="edit-url-form"
                                                        onSubmit={
                                                            handleSaveEdit
                                                        }
                                                    >

                                                        <div className="edit-url-header">

                                                            <div>

                                                                <h3>
                                                                    Edit link
                                                                </h3>

                                                                <p>
                                                                    {url.shortUrl}
                                                                </p>

                                                            </div>


                                                            <button
                                                                type="button"
                                                                onClick={
                                                                    handleCancelEdit
                                                                }
                                                            >
                                                                Cancel
                                                            </button>

                                                        </div>


                                                        {editError && (

                                                            <div className="dashboard-error-box">
                                                                {editError}
                                                            </div>

                                                        )}


                                                        <div className="edit-url-fields">

                                                            <div className="form-group">

                                                                <label
                                                                    htmlFor={`edit-url-${url.id}`}
                                                                >
                                                                    Original URL
                                                                </label>

                                                                <input
                                                                    id={`edit-url-${url.id}`}
                                                                    type="url"
                                                                    value={
                                                                        editOriginalUrl
                                                                    }
                                                                    onChange={
                                                                        event =>
                                                                            setEditOriginalUrl(
                                                                                event.target.value
                                                                            )
                                                                    }
                                                                    required
                                                                />

                                                            </div>


                                                            <div className="form-group">

                                                                <label
                                                                    htmlFor={`edit-expiry-${url.id}`}
                                                                >
                                                                    Expiration

                                                                    <span>
                                                                        {" "}Optional
                                                                    </span>

                                                                </label>

                                                                <input
                                                                    id={`edit-expiry-${url.id}`}
                                                                    type="datetime-local"
                                                                    value={
                                                                        editExpiresAt
                                                                    }
                                                                    onChange={
                                                                        event =>
                                                                            setEditExpiresAt(
                                                                                event.target.value
                                                                            )
                                                                    }
                                                                />

                                                            </div>

                                                        </div>


                                                        <div className="edit-url-actions">

                                                            <button
                                                                type="button"
                                                                onClick={
                                                                    handleCancelEdit
                                                                }
                                                            >
                                                                Cancel
                                                            </button>


                                                            <button
                                                                type="submit"
                                                                className="dashboard-primary-button"
                                                                disabled={
                                                                    updating
                                                                }
                                                            >
                                                                {updating
                                                                    ? "Saving..."
                                                                    : "Save changes"}
                                                            </button>

                                                        </div>

                                                    </form>

                                                </td>

                                            </tr>

                                        )}


                                        {/* =========================
                                            URL Row
                                           ========================= */}

                                        <tr>

                                            <td>

                                                <div className="short-url-cell">

                                                    <strong>
                                                        {url.shortCode}
                                                    </strong>

                                                </div>

                                            </td>


                                            <td>

                                                <span className="destination-url">
                                                    {url.originalUrl}
                                                </span>

                                            </td>


                                            <td>

                                                <span
                                                    className={
                                                        url.isActive
                                                            ? "url-status active"
                                                            : "url-status inactive"
                                                    }
                                                >
                                                    {url.isActive
                                                        ? "Active"
                                                        : "Inactive"}
                                                </span>

                                            </td>


                                            <td>

                                                {url.expiresAt
                                                    ? new Date(
                                                        url.expiresAt
                                                    ).toLocaleDateString()
                                                    : "Never"}

                                            </td>


                                            <td>

                                                <div className="url-actions">

                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            handleCopy(
                                                                url
                                                            )
                                                        }
                                                    >
                                                        Copy
                                                    </button>


                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            handleEdit(
                                                                url
                                                            )
                                                        }
                                                    >
                                                        Edit
                                                    </button>


                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            handleToggle(
                                                                url
                                                            )
                                                        }
                                                    >
                                                        {url.isActive
                                                            ? "Deactivate"
                                                            : "Activate"}
                                                    </button>

                                                </div>

                                            </td>

                                        </tr>

                                    </Fragment>

                                ))}

                            </tbody>

                        </table>

                    </div>

                )}

            </section>

        </div>
    );
}


export default MyUrls;