// src/App.js
import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./Context/AuthContext"; // Import AuthProvider
import LandingPage from "./components/LandingPage";
import Login from "./components/Auths/Login";
import Signup from "./components/Auths/Signup";
import ForgotPassword from "./components/Auths/ForgotPassword";
import CanvasWithSidebar from "./components/CanvasWithSidebar"; // Corrected import
import StampCreator from "./components/StampCreator"; // This is where the StampCreator will be displayed
import Documents from "./components/Documents"; // Import the Documents component
import ManageStamps from "./components/StampManager";
const App = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const handleLogin = (isAuthenticated) => {
    setIsLoggedIn(isAuthenticated);
  };

  // Create the createStamp function here
  const createStamp = (stampData) => {
    console.log("Stamp created: ", stampData);  // You can replace this with your actual stamp handling logic
  };

  return (
    <AuthProvider>  {/* Wrap the app with AuthProvider */}
      <Router>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login onLogin={handleLogin} />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/canvas" element={<CanvasWithSidebar />} />
          <Route path="/creator" element={<StampCreator createStamp={createStamp} />} />
          <Route path="/manage-stamps" element={<ManageStamps/>} />
          <Route path="/documents" element={<Documents />} /> {/* Add the Documents route */}
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;
