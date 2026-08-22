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


export const getCurrentUser = async () => {

    const response = await apiClient.get("/auth/me");

    return response.data.data.user;
};


/* =========================
   Logout current session
   ========================= */

export const logout = async () => {

    const response =
        await apiClient.post("/auth/logout");

    return response.data;
};


/* =========================
   Logout from all devices
   ========================= */

export const logoutAll = async () => {

    const response =
        await apiClient.post("/auth/logout-all");

    return response.data;
};