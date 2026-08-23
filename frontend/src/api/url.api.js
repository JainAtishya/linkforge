import apiClient from "./client";


/* =========================================
   Get My URLs
   ========================================= */

export const getUrls = async (
    page = 1,
    limit = 10,
    search = ""
) => {

    const response =
        await apiClient.get(
            "/urls",
            {
                params: {
                    page,
                    limit,
                    search
                }
            }
        );

    return response.data;
};


/* =========================================
   Create Short URL
   ========================================= */

export const createUrl = async ({
    originalUrl,
    expiresAt,
    customAlias,
    isPasswordProtected,
    password
}) => {

    const response =
        await apiClient.post(
            "/urls",
            {
                originalUrl,
                expiresAt,
                customAlias,
                isPasswordProtected,
                password
            }
        );

    return response.data;
};


/* =========================================
   Update URL
   ========================================= */

export const updateUrl = async (
    id,
    data
) => {

    const response =
        await apiClient.patch(
            `/urls/${id}`,
            data
        );

    return response.data;
};


/* =========================================
   Request URL Deletion
   =========================================
   
   URL is not immediately removed.
   Backend puts it into the 30-day
   deletion grace period.
*/

export const requestDeleteUrl = async (
    id
) => {

    const response =
        await apiClient.post(
            `/urls/${id}/delete`
        );

    return response.data;
};


/* =========================================
   Restore Deleted URL
   ========================================= */

export const restoreDeletedUrl = async (
    id
) => {

    const response =
        await apiClient.post(
            `/urls/${id}/restore`
        );

    return response.data;
};


/* =========================================
   Analytics
   ========================================= */

export async function getAnalytics(
    id,
    period = "7d"
) {

    const response =
        await apiClient.get(
            `/urls/${id}/analytics`,
            {
                params: {
                    period
                }
            }
        );

    return response.data;
}


/* =========================================
   Analytics By Date
   ========================================= */

export async function getAnalyticsByDate(
    id,
    date
) {

    const response =
        await apiClient.get(
            `/urls/${id}/analytics/date`,
            {
                params: {
                    date
                }
            }
        );

    return response.data;
}


/* =========================================
   Access Password Protected URL
   ========================================= */

export const accessProtectedUrl = async (
    shortCode,
    password
) => {

    const response =
        await apiClient.post(
            `/urls/access/${shortCode}`,
            {
                password
            }
        );

    return response.data;
};