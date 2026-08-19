import apiClient from "./client";

export const login = async (email, password) => {
    const response = await apiClient.post("/auth/login", {
        email,
        password
    });

    return response.data;
};

export const register = async (name, email, password) => {
    const response = await apiClient.post("/auth/register", {
        name,
        email,
        password
    });

    return response.data;
};

export const loginWithGoogle = () => {
    window.location.href = "/api/v1/auth/google";
};