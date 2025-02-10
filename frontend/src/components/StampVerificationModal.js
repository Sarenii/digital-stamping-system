import React, { useState } from "react";
import axios from "axios";

const StampVerificationModal = ({ isOpen, onClose, onVerify }) => {
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleVerify = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Call the dedicated endpoint for stamp verification.
      await axios.post("http://localhost:8000/auth/verify-stamp", { otp });
      onVerify();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || "Verification failed. Please try again.");
      console.error("Stamp verification error:", err);
    }
    setLoading(false);
  };

  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-white p-6 rounded-lg shadow-md max-w-md w-full">
        <h2 className="text-xl font-bold mb-4">
          Verify Your Identity for Stamp Creation
        </h2>
        <form onSubmit={handleVerify}>
          <input
            type="text"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            placeholder="Enter OTP"
            className="w-full p-3 border rounded mb-4"
            required
          />
          {error && <div className="text-red-500 mb-4">{error}</div>}
          <button type="submit" className="w-full bg-primary text-white p-3 rounded" disabled={loading}>
            {loading ? "Verifying..." : "Verify OTP"}
          </button>
        </form>
        <button onClick={onClose} className="mt-4 w-full text-center text-gray-500 underline">
          Cancel
        </button>
      </div>
    </div>
  );
};

export default StampVerificationModal;
