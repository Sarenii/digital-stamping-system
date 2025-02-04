import React from "react";
import { Link } from "react-router-dom";

const NavBar = () => {
  return (
    <nav className="bg-primary text-neutral px-6 py-4 shadow-md flex justify-between items-center">
      <h1 className="text-2xl font-semibold font-heading">Digital Stamping System</h1>
      <div className="flex gap-6">
        <Link to="/canvas" className="hover:text-lightgray transition">Home</Link>
        <Link to="/creator" className="hover:text-lightgray transition">Create Stamp</Link>
        <Link to="/manage-stamps" className="hover:text-lightgray transition">Manage Stamps</Link>
        <Link to="/documents" className="hover:text-lightgray transition">Documents</Link>
      </div>
    </nav>
  );
};

export default NavBar;
