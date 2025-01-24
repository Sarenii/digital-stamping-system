import React from "react";
import { useNavigate } from "react-router-dom";

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-r from-blue-500 to-indigo-600 text-white">
      <h1 className="text-5xl font-bold mb-6">Digital Stamping System</h1>
      <p className="text-lg mb-12 max-w-md text-center">
        Welcome to the Digital Stamping System! Manage and authenticate your documents with ease.
      </p>
      <button
        onClick={() => navigate("/login")}
        className="px-6 py-3 bg-white text-blue-600 font-semibold rounded-lg hover:bg-gray-100 transition duration-300"
      >
        Get Started
      </button>
    </div>
  );
};

export default LandingPage;
