import React from "react";
import { useNavigate } from "react-router-dom";
import backgroundImage from '../assets/images/hero.jpg'; // Adjust the path

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-start min-h-screen bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
      {/* Hero Section with Background Image */}
      <div
        className="relative w-full h-[60vh] bg-cover bg-center"
        style={{
          backgroundImage: `url(${backgroundImage})`, // Using the imported image
          backgroundSize: 'cover', // Cover the entire background
          backgroundPosition: 'center', // Center the background image
          backgroundRepeat: 'no-repeat', // Prevent image repetition
        }}
      >
        <div className="absolute inset-0 bg-black opacity-40"></div>
        <div className="relative z-10 flex flex-col items-center justify-center h-full px-6">
          <h1 className="text-5xl font-bold mb-6 text-center">Digital Stamping System</h1>
          <p className="text-lg mb-12 max-w-md text-center">
            Manage and authenticate your documents with ease, using our secure and customizable digital stamping solution.
          </p>
          <button
            onClick={() => navigate("/login")}
            className="px-10 py-4 text-2xl font-semibold bg-accent text-white rounded-lg hover:bg-primary transition duration-300"
          >
            Get Started
          </button>
        </div>
      </div>

      {/* Features Section */}
      <div className="flex flex-col items-center py-16 bg-gray-100 w-full pt-12">
        <h2 className="text-4xl font-bold mb-8 text-primary">Features</h2>
        <div className="flex flex-wrap justify-center gap-12">
          {/* Feature 1 */}
          <div className="w-64 bg-white p-6 rounded-lg shadow-lg text-center">
            <h3 className="text-2xl font-semibold text-accent mb-4">Customizable Stamps</h3>
            <p className="text-gray-700">Design your own digital stamps and apply them to your documents with ease.</p>
          </div>

          {/* Feature 2 */}
          <div className="w-64 bg-white p-6 rounded-lg shadow-lg text-center">
            <h3 className="text-2xl font-semibold text-accent mb-4">Secure Authentication</h3>
            <p className="text-gray-700">Ensure the authenticity of your documents with our secure digital signature system.</p>
          </div>

          {/* Feature 3 */}
          <div className="w-64 bg-white p-6 rounded-lg shadow-lg text-center">
            <h3 className="text-2xl font-semibold text-accent mb-4">Easy Document Management</h3>
            <p className="text-gray-700">Upload, stamp, and download documents without any hassle. Manage them in one place.</p>
          </div>
        </div>
      </div>

      {/* Call to Action Section */}
      <div className="flex flex-col items-center py-16 bg-primary w-full">
        <h2 className="text-3xl font-bold text-white mb-6">Ready to Get Started?</h2>
        <p className="text-lg text-white mb-8">Create an account and start authenticating your documents today!</p>
        <button
          onClick={() => navigate("/signup")}
          className="px-8 py-3 bg-white text-primary font-semibold rounded-lg hover:bg-accent transition duration-300"
        >
          Sign Up Now
        </button>
      </div>
    </div>
  );
};

export default LandingPage;
