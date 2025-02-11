// src/services/api.js
import axios from "axios";

const BASE_URL = "http://127.0.0.1:8000/"; // Backend base URL

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (
      error.response &&
      error.response.status === 401 &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;
      try {
        const refreshToken = localStorage.getItem("refreshToken");
        if (!refreshToken) throw new Error("Refresh token not found");
        const { data } = await axios.post(`${BASE_URL}auth/token/refresh/`, {
          refresh: refreshToken,
        });
        localStorage.setItem("accessToken", data.access);
        originalRequest.headers.Authorization = `Bearer ${data.access}`;
        return api(originalRequest);
      } catch (refreshError) {
        console.error("Token refresh failed:", refreshError);
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        window.location.href = "/login";
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

export const registerUser = async (formData) => {
  return await api.post("auth/signup/", formData);
};

export const verifyOtp = async (email, otp, forStamping = false) => {
  return await api.post("auth/verify-otp/", { email, otp, for_stamping: forStamping });
};

export const loginUser = async (email, password) => {
  const response = await api.post("auth/login/", { email, password });
  localStorage.setItem("accessToken", response.data.access);
  localStorage.setItem("refreshToken", response.data.refresh);
  return response.data;
};

export const refreshToken = async () => {
  const refreshToken = localStorage.getItem("refreshToken");
  if (!refreshToken) throw new Error("Refresh token missing");
  const response = await api.post("auth/token/refresh/", { refresh: refreshToken });
  localStorage.setItem("accessToken", response.data.access);
  return response.data;
};

export const getUserProfile = async () => {
  return await api.get("auth/profile/");
};

export const updateUserProfile = async (profileData) => {
  return await api.put("auth/profile/update/", profileData);
};

export const updateUserProfilePicture = async (profilePicture) => {
  const formData = new FormData();
  formData.append("profile_picture", profilePicture);
  return await api.put("auth/profile/update-picture/", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

export const changeUserPassword = async (passwordData) => {
  return await api.post("auth/profile/change-password/", passwordData);
};

export const forgotPassword = async (email) => {
  return await api.post("auth/forgot-password/", { email });
};

export const verifyResetOtp = async (email, otp) => {
  return await api.post("auth/verify-reset-otp/", { email, otp });
};

export const resetPassword = async (email, newPassword) => {
  return await api.post("auth/reset-password/", { email, new_password: newPassword });
};

export const logoutUser = () => {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  window.location.href = "/login";
};

export default api;
