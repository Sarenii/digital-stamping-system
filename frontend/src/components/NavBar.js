import React from "react";

const NavBar = () => {
  return (
    <nav className="bg-primary text-accent px-6 py-4 shadow-md flex justify-between items-center">
      <h1 className="text-2xl font-semibold">Digital Stamping System</h1>
      <div className="flex gap-6">
        <a href="#" className="hover:text-white transition">Dashboard</a>
        <a href="#" className="hover:text-white transition">Stamps</a>
        <a href="#" className="hover:text-white transition">Documents</a>
      </div>
    </nav>
  );
};

export default NavBar;
