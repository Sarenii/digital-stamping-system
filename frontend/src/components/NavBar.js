// src/components/NavBar.js
import React from "react";
import { Link } from "react-router-dom";

const NavBar = () => {
  return (
    <nav className="bg-primary text-accent px-6 py-4 shadow-md flex justify-between items-center">
      <h1 className="text-2xl font-semibold">Digital Stamping System</h1>
      <div className="flex gap-6">
        <Link to="/canvas" className="hover:text-white transition">Home</Link> {/* Added Documents link */}
        <Link to="/creator" className="hover:text-white transition">Create Stamp</Link>
        <Link to="/manage-stamps" className="hover:text-white transition">Manage Stamps</Link>
        <Link to="/documents" className="hover:text-white transition">Documents</Link> {/* Added Documents link */}
      </div>
    </nav>
  );
};

export default NavBar;
