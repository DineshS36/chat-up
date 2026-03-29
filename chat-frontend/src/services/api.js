import axios from "axios";

// Read from Vite environment variable with a localhost fallback for local development
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const API = axios.create({
    baseURL: `${API_URL}/api`
});

// Automatically attach JWT token to every request
API.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export default API;