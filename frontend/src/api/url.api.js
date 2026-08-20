import apiClient from "./client";


export const getUrls = async (
    page = 1,
    limit = 10
) => {

    const response =
        await apiClient.get(
            "/urls",
            {
                params: {
                    page,
                    limit
                }
            }
        );

    return response.data;
};


export const createUrl = async ({
    originalUrl,
    expiresAt,
    customAlias
}) => {

    const response =
        await apiClient.post(
            "/urls",
            {
                originalUrl,
                expiresAt,
                customAlias
            }
        );

    return response.data;
};


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


export const deleteUrl = async (
    id
) => {

    const response =
        await apiClient.delete(
            `/urls/${id}`
        );

    return response.data;
};

export async function getAnalytics(
    id,
    period = "7d"
) {

    const response = await apiClient.get(
        `/urls/${id}/analytics`,
        {
            params: {
                period
            }
        }
    );

    return response.data;
}


export async function getAnalyticsByDate(
    id,
    date
) {

    const response = await apiClient.get(
        `/urls/${id}/analytics/date`,
        {
            params: {
                date
            }
        }
    );

    return response.data;
}