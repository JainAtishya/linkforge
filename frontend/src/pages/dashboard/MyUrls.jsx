import {
    Fragment,
    useEffect,
    useState
} from "react";

import {
    useLocation,
    useNavigate
} from "react-router-dom";

import {
    getUrls,
    createUrl,
    updateUrl,
    requestDeleteUrl,
    restoreDeletedUrl
} from "../../api/url.api";


function MyUrls() {

    const location = useLocation();
    const navigate = useNavigate();


    /*
     * =========================
     * URL list state
     * =========================
     */

    const [urls, setUrls] =
        useState([]);

    const [loading, setLoading] =
        useState(true);

    const [error, setError] =
        useState("");


    /*
     * =========================
     * Pagination state
     * =========================
     */

    const [currentPage, setCurrentPage] =
        useState(1);

    const [totalUrls, setTotalUrls] =
        useState(0);

    const pageSize = 10;


    const totalPages =
        Math.max(
            Math.ceil(
                totalUrls / pageSize
            ),
            1
        );


    /*
     * =========================
     * Create URL state
     * =========================
     */

    const [showCreateForm, setShowCreateForm] =
        useState(
            location.state?.openCreateForm === true
        );

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

    const [passwordProtected, setPasswordProtected] =
        useState(false);

    const [password, setPassword] =
        useState("");


    /*
     * =========================
     * Edit URL state
     * =========================
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
     * =========================
     * Handle navigation
     * =========================
     */

    useEffect(() => {

        if (location.state?.openCreateForm) {

            setShowCreateForm(true);

            navigate(
                location.pathname,
                {
                    replace: true,
                    state: {}
                }
            );
        }

    }, [
        location,
        navigate
    ]);


    /*
     * =========================
     * Load URLs
     * =========================
     */

    async function loadUrls(
        requestedPage = currentPage
    ) {

        try {

            setLoading(true);
            setError("");

            const response =
                await getUrls(
                    requestedPage,
                    pageSize
                );


            const data =
                response.data;


            setUrls(
                Array.isArray(data.urls)
                    ? data.urls
                    : []
            );

            setTotalUrls(
                data.total || 0
            );

            setCurrentPage(
                data.page || requestedPage
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

        loadUrls(1);

    }, []);


    /*
     * =========================
     * Pagination
     * =========================
     */

    async function handlePageChange(
        page
    ) {

        if (
            page < 1 ||
            page > totalPages ||
            page === currentPage
        ) {
            return;
        }

        setEditingUrl(null);

        await loadUrls(page);
    }


    /*
     * =========================
     * Create URL
     * =========================
     */

    async function handleCreate(
        event
    ) {

        event.preventDefault();

        setCreating(true);
        setCreateError("");

        try {

            await createUrl({

                originalUrl,

                customAlias:
                    customAlias.trim() ||
                    undefined,

                expiresAt:
                    expiresAt ||
                    undefined,

                password:
                    passwordProtected
                        ? password
                        : undefined

            });


            /*
             * Reset form
             */

            setOriginalUrl("");
            setCustomAlias("");
            setExpiresAt("");
            setPassword("");
            setPasswordProtected(false);

            setShowCreateForm(false);


            /*
             * New URLs are created at
             * the beginning of page 1.
             */

            await loadUrls(1);

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
     * =========================
     * Start editing URL
     * =========================
     */

    function handleEdit(url) {

        /*
         * Backend does not allow
         * modification while deletion
         * is pending.
         */

        if (url.deletionRequestedAt) {
            return;
        }


        setEditingUrl(url);

        setEditOriginalUrl(
            url.originalUrl
        );


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
     * =========================
     * Cancel editing
     * =========================
     */

    function handleCancelEdit() {

        setEditingUrl(null);

        setEditOriginalUrl("");
        setEditExpiresAt("");

        setEditError("");
    }


    /*
     * =========================
     * Save edited URL
     * =========================
     */

    async function handleSaveEdit(
        event
    ) {

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


            setUrls(
                previousUrls =>
                    previousUrls.map(
                        url =>
                            url.id ===
                            editingUrl.id
                                ? response.data
                                : url
                    )
            );


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
     * =========================
     * Activate / Deactivate
     * =========================
     */

    async function handleToggle(
        url
    ) {

        /*
         * Do not allow toggling a URL
         * that is pending deletion.
         */

        if (url.deletionRequestedAt) {
            return;
        }


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
                            currentUrl.id ===
                            url.id
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
     * =========================
     * Delete URL
     * =========================
     */

    async function handleDelete(
        url
    ) {

        const confirmed =
            window.confirm(
                "Delete this URL?\n\n" +
                "The URL will be deactivated immediately " +
                "and permanently deleted after 30 days."
            );


        if (!confirmed) {
            return;
        }


        try {

            const response =
                await requestDeleteUrl(
                    url.id
                );


            setUrls(
                previousUrls =>
                    previousUrls.map(
                        currentUrl =>
                            currentUrl.id ===
                            url.id
                                ? {
                                    ...currentUrl,

                                    isActive:
                                        response.data
                                            .isActive,

                                    deletionRequestedAt:
                                        response.data
                                            .deletionRequestedAt
                                }
                                : currentUrl
                    )
            );


            if (
                editingUrl?.id === url.id
            ) {
                handleCancelEdit();
            }

        } catch (error) {

            console.error(
                "Failed to delete URL:",
                error
            );

            setError(
                error.response?.data?.message ||
                "Unable to delete URL."
            );
        }
    }


    /*
     * =========================
     * Restore URL
     * =========================
     */

    async function handleRestore(
        url
    ) {

        try {

            const response =
                await restoreDeletedUrl(
                    url.id
                );


            setUrls(
                previousUrls =>
                    previousUrls.map(
                        currentUrl =>
                            currentUrl.id ===
                            url.id
                                ? {
                                    ...currentUrl,

                                    isActive:
                                        response.data
                                            .isActive,

                                    deletionRequestedAt:
                                        response.data
                                            .deletionRequestedAt
                                }
                                : currentUrl
                    )
            );

        } catch (error) {

            console.error(
                "Failed to restore URL:",
                error
            );

            setError(
                error.response?.data?.message ||
                "Unable to restore URL."
            );
        }
    }


    /*
     * =========================
     * Copy short URL
     * =========================
     */

    async function handleCopy(
        url
    ) {

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
     * =========================
     * Loading state
     * =========================
     */

    if (loading) {

        return (
            <div className="dashboard-state">
                Loading your URLs...
            </div>
        );
    }


    /*
     * =========================
     * Error state
     * =========================
     */

    if (
        error &&
        urls.length === 0
    ) {

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
                    type="button"
                    className={`dashboard-primary-button ${
                        showCreateForm
                            ? "create-link-header-button"
                            : ""
                    }`}
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

                <>

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


                            {/* Original URL */}

                            <div className="form-group">

                                <label htmlFor="originalUrl">
                                    Original URL
                                </label>

                                <input
                                    id="originalUrl"
                                    type="url"
                                    value={originalUrl}
                                    onChange={
                                        event =>
                                            setOriginalUrl(
                                                event.target.value
                                            )
                                    }
                                    placeholder="https://example.com"
                                    required
                                />

                            </div>


                            {/* Custom Alias */}

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
                                    onChange={
                                        event =>
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


                            {/* Expiration */}

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
                                    onChange={
                                        event =>
                                            setExpiresAt(
                                                event.target.value
                                            )
                                    }
                                />

                            </div>


                            {/* Password Protection */}

                            <div className="form-group">

                                <label className="checkbox-label">

                                    <input
                                        type="checkbox"
                                        checked={
                                            passwordProtected
                                        }
                                        onChange={
                                            event =>
                                                setPasswordProtected(
                                                    event.target.checked
                                                )
                                        }
                                    />

                                    <span>
                                        Password protect this URL
                                    </span>

                                </label>

                                <small className="form-help">
                                    Visitors will need a password
                                    before accessing the destination.
                                </small>

                            </div>


                            {/* Password */}

                            {passwordProtected && (

                                <div className="form-group">

                                    <label htmlFor="urlPassword">
                                        Password
                                    </label>

                                    <input
                                        id="urlPassword"
                                        type="password"
                                        value={password}
                                        onChange={
                                            event =>
                                                setPassword(
                                                    event.target.value
                                                )
                                        }
                                        placeholder="Enter a password"
                                        minLength={4}
                                        maxLength={100}
                                        required
                                    />

                                    <small className="form-help">
                                        Minimum 4 characters.
                                    </small>

                                </div>

                            )}


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


                    {/* Mobile Cancel Button */}

                    <button
                        type="button"
                        className="dashboard-primary-button create-link-mobile-cancel"
                        onClick={() =>
                            setShowCreateForm(false)
                        }
                    >
                        Cancel
                    </button>

                </>

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
                            {totalUrls} link
                            {totalUrls !== 1
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

                    <>


                        {/* =========================
                            URL Table
                           ========================= */}

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

                                    {urls.map(
                                        url => (

                                            <Fragment
                                                key={url.id}
                                            >


                                                {/* =========================
                                                    Edit Row
                                                   ========================= */}

                                                {editingUrl?.id ===
                                                    url.id && (

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

                                                    {/* Short URL */}

                                                    <td>

                                                        <div className="short-url-cell">

                                                            <a
                                                                href={url.shortUrl}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="short-url-link"
                                                            >
                                                                {url.shortUrl}
                                                            </a>


                                                            {url.isPasswordProtected && (

                                                                <span className="url-protected-badge">
                                                                    Protected
                                                                </span>

                                                            )}

                                                        </div>

                                                    </td>


                                                    {/* Destination */}

                                                    <td>

                                                        <span className="destination-url">
                                                            {url.originalUrl}
                                                        </span>

                                                    </td>


                                                    {/* Status */}

                                                    <td>

                                                        <span
                                                            className={
                                                                url.deletionRequestedAt
                                                                    ? "url-status pending"
                                                                    : url.isActive
                                                                        ? "url-status active"
                                                                        : "url-status inactive"
                                                            }
                                                        >

                                                            {url.deletionRequestedAt
                                                                ? "Pending deletion"
                                                                : url.isActive
                                                                    ? "Active"
                                                                    : "Inactive"}

                                                        </span>

                                                    </td>


                                                    {/* Expiration */}

                                                    <td>

                                                        {url.expiresAt
                                                            ? new Date(
                                                                url.expiresAt
                                                            ).toLocaleDateString()
                                                            : "Never"}

                                                    </td>


                                                    {/* Actions */}

                                                    <td>

                                                        <div className="url-actions">


                                                            {/* Copy */}

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


                                                            {!url.deletionRequestedAt && (

                                                                <>

                                                                    {/* Edit */}

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


                                                                    {/* Activate / Deactivate */}

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


                                                                    {/* Delete */}

                                                                    <button
                                                                        type="button"
                                                                        className="url-delete-button"
                                                                        onClick={() =>
                                                                            handleDelete(
                                                                                url
                                                                            )
                                                                        }
                                                                    >
                                                                        Delete
                                                                    </button>

                                                                </>

                                                            )}


                                                            {url.deletionRequestedAt && (

                                                                <button
                                                                    type="button"
                                                                    className="url-restore-button"
                                                                    onClick={() =>
                                                                        handleRestore(
                                                                            url
                                                                        )
                                                                    }
                                                                >
                                                                    Restore
                                                                </button>

                                                            )}

                                                        </div>

                                                    </td>

                                                </tr>

                                            </Fragment>

                                        )
                                    )}

                                </tbody>

                            </table>

                        </div>


                        {/* =========================
                            Pagination
                           ========================= */}

                        {totalPages > 1 && (

                            <div className="url-pagination">

                                <button
                                    type="button"
                                    className="pagination-button"
                                    disabled={
                                        currentPage === 1
                                    }
                                    onClick={() =>
                                        handlePageChange(
                                            currentPage - 1
                                        )
                                    }
                                >
                                    Previous
                                </button>


                                <div className="pagination-info">

                                    Page{" "}

                                    <strong>
                                        {currentPage}
                                    </strong>

                                    {" "}of{" "}

                                    <strong>
                                        {totalPages}
                                    </strong>

                                </div>


                                <button
                                    type="button"
                                    className="pagination-button"
                                    disabled={
                                        currentPage ===
                                        totalPages
                                    }
                                    onClick={() =>
                                        handlePageChange(
                                            currentPage + 1
                                        )
                                    }
                                >
                                    Next
                                </button>

                            </div>

                        )}

                    </>

                )}

            </section>

        </div>
    );
}


export default MyUrls;