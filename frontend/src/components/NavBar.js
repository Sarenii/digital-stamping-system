import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../Context/AuthContext"; // Adjust the path as needed

const NavBar = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    // Call the logout function from your AuthContext
    logout();
    navigate("/login");
  };

  // Styling for navigation links that swap the colors when active
  const linkClasses = ({ isActive }) =>
    isActive
      ? "py-1 px-4 transition-all duration-200 rounded bg-primary text-neutral shadow-lg"
      : "py-1 px-4 transition-all duration-200 rounded text-primary hover:bg-primary hover:text-neutral hover:shadow";

  return (
    <nav
      className="px-6 py-4 flex justify-between items-center"
      style={{
        background:
          "repeating-linear-gradient(45deg, #F3F4F6, #F3F4F6 10px, #E5E7EB 10px, #E5E7EB 20px)",
      }}
    >
      <h1 className="text-2xl font-semibold font-heading text-primary">
        Chakan Stamp & Verify (CS&V)
      </h1>
      <div className="flex gap-4 items-center">
        <NavLink to="/canvas" className={linkClasses}>
          Home
        </NavLink>
        <NavLink to="/creator" className={linkClasses}>
          Create Stamp
        </NavLink>
        <NavLink to="/manage-stamps" className={linkClasses}>
          Manage Stamps
        </NavLink>
        <NavLink to="/documents" className={linkClasses}>
          Documents
        </NavLink>
        <NavLink to="/document-verification" className={linkClasses}>
          Document Verification
        </NavLink>
        <button
          onClick={handleLogout}
          className="px-4 py-2 rounded border border-primary text-primary hover:bg-primary hover:text-neutral transition-colors duration-200"
        >
          Logout
        </button>
      </div>
    </nav>
  );
};

export default NavBar;
