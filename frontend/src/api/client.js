import axios from "axios";

const apiClient = axios.create({
    baseURL: `${import.meta.env.VITE_API_URL}/api/v1`,
    withCredentials: true
});


/*
 * Prevent multiple API requests from
 * creating multiple refresh requests.
 */

let refreshPromise = null;


apiClient.interceptors.response.use(

    (response) => {
        return response;
    },


    async (error) => {

        const originalRequest = error.config;


        /*
         * If the failed request itself is
         * /auth/refresh, DO NOT try refreshing again.
         *
         * This prevents an infinite loop.
         */

        if (
            originalRequest?.url?.includes(
                "/auth/refresh"
            )
        ) {
            return Promise.reject(error);
        }


        /*
         * Only try refreshing for 401 errors.
         */

        if (
            error.response?.status !== 401 ||
            originalRequest?._retry
        ) {
            return Promise.reject(error);
        }


        originalRequest._retry = true;


        try {

            /*
             * If another request is already
             * refreshing the token, wait for it.
             */

            if (!refreshPromise) {

                refreshPromise =
                    apiClient.post(
                        "/auth/refresh"
                    );

            }


            await refreshPromise;


            /*
             * Refresh succeeded.
             *
             * Backend has issued new
             * access + refresh cookies.
             *
             * Retry original request.
             */

            return apiClient(
                originalRequest
            );


        } catch (refreshError) {

            /*
             * Refresh failed.
             *
             * The refresh token/session is no
             * longer valid.
             */

            console.error(
                "Refresh failed. Redirecting to login.",
                refreshError
            );


            /*
             * Avoid redirecting if we're already
             * on the login page.
             */

            if (
                window.location.pathname !== "/login"
            ) {

                window.location.replace(
                    "/login"
                );

            }


            return Promise.reject(
                refreshError
            );

        } finally {

            refreshPromise = null;

        }

    }

);


export default apiClient;