import api from "./api";

// User registration
export const registerUser = async (formData) => {
  return await api.post("/auth/signup/", formData);
};

// OTP Verification for registration
export const verifyOtp = async (email, otp) => {
  return await api.post("/auth/verify-otp/", { email, otp });
};

// User login
export const loginUser = async (email, password) => {
  const response = await api.post("/auth/login/", { email, password });
  localStorage.setItem("accessToken", response.data.access);
  localStorage.setItem("refreshToken", response.data.refresh);
  return response.data;
};

// Refresh token
export const refreshToken = async () => {
  const refreshToken = localStorage.getItem("refreshToken");
  if (!refreshToken) throw new Error("Refresh token missing");

  const response = await api.post("/auth/token/refresh/", { refresh: refreshToken });
  localStorage.setItem("accessToken", response.data.access);
  return response.data;
};

// User profile retrieval
export const getUserProfile = async () => {
  return await api.get("/auth/profile/");
};

// Update user profile
export const updateUserProfile = async (profileData) => {
  return await api.put("/auth/profile/update/", profileData);
};

// Update profile picture
export const updateUserProfilePicture = async (profilePicture) => {
  const formData = new FormData();
  formData.append("profile_picture", profilePicture);
  return await api.put("/auth/profile/update-picture/", formData, { headers: { "Content-Type": "multipart/form-data" } });
};

// Change user password
export const changeUserPassword = async (passwordData) => {
  return await api.post("/auth/profile/change-password/", passwordData);
};

// Forgot password - send OTP
export const forgotPassword = async (email) => {
  return await api.post("/auth/forgot-password/", { email });
};

// Verify reset OTP
export const verifyResetOtp = async (email, otp) => {
  return await api.post("/auth/verify-reset-otp/", { email, otp });
};

// Reset password
export const resetPassword = async (email, newPassword) => {
  return await api.post("/auth/reset-password/", { email, new_password: newPassword });
};

// Logout user
export const logoutUser = () => {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  window.location.href = "/login";   
};
