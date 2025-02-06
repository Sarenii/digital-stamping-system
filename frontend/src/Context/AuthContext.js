import React, { createContext, useContext, useState, useEffect } from "react";
import {
  loginUser,
  logoutUser,
  getUserProfile,
  updateUserProfile,
  updateUserProfilePicture,
  changeUserPassword,
  refreshToken,
  forgotPassword,
  verifyResetOtp,
  resetPassword,
} from "../services/auth";

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem("accessToken");
      if (token) {
        try {
          const userProfile = await getUserProfile();
          setUser(userProfile);
        } catch (error) {
          logout();
        }
      }
      setLoading(false);
    };
    initializeAuth();
  }, []);

  const login = async (email, password) => {
    try {
      const { user: userProfile, accessToken } = await loginUser(email, password);
      localStorage.setItem("accessToken", accessToken);
      setUser({ ...userProfile, accessToken });
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    setUser(null);
    logoutUser();
  };

  const updateProfile = async (profileData) => {
    try {
      const updatedProfile = await updateUserProfile(profileData);
      setUser((prevUser) => ({ ...prevUser, ...updatedProfile }));
      return "Profile updated successfully.";
    } catch (error) {
      throw error;
    }
  };

  const updateProfilePicture = async (profilePicture) => {
    try {
      const updatedPicture = await updateUserProfilePicture(profilePicture);
      setUser((prevUser) => ({ ...prevUser, profile_picture: updatedPicture.profile_picture }));
      return "Profile picture updated successfully.";
    } catch (error) {
      throw error;
    }
  };

  const changePassword = async (oldPassword, newPassword) => {
    try {
      return await changeUserPassword({ old_password: oldPassword, new_password: newPassword });
    } catch (error) {
      throw error;
    }
  };

  const initiateForgotPassword = async (email) => {
    try {
      return await forgotPassword(email);
    } catch (error) {
      throw error;
    }
  };

  const verifyForgotPasswordOtp = async (email, otp) => {
    try {
      return await verifyResetOtp(email, otp);
    } catch (error) {
      throw error;
    }
  };

  const resetUserPassword = async (email, newPassword) => {
    try {
      return await resetPassword(email, newPassword);
    } catch (error) {
      throw error;
    }
  };

  const value = {
    user,
    login,
    logout,
    updateProfile,
    updateProfilePicture,
    changePassword,
    initiateForgotPassword,
    verifyForgotPasswordOtp,
    resetUserPassword,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{!loading ? children : <div>Loading...</div>}</AuthContext.Provider>;
};
