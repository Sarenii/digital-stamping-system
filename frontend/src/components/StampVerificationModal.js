// src/services/StampVerificationModal.js
import React, { useState, useEffect } from "react";
import axios from "axios";

const StampVerificationModal = ({ isOpen, onClose, onVerify, forStamping = false }) => {
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      axios
        .post(
          "http://localhost:8000/auth/request-otp",
          {},
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
            },
          }
        )
        .then((res) => {
          console.log("OTP requested:", res.data);
        })
        .catch((err) =>
          console.error("Failed to request OTP in modal:", err)
        );
    }
  }, [isOpen]);

  const handleVerify = async () => {
    setLoading(true);
    try {
      await axios.post(
        "http://localhost:8000/auth/verify-otp",
        { otp, for_stamping: forStamping },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        }
      );
      onVerify();
      onClose();
    } catch (err) {
      setError("Invalid or expired OTP. Please try again.");
      console.error("OTP verification error:", err);
    }
    setLoading(false);
  };

  const handleResend = async () => {
    try {
      await axios.post(
        "http://localhost:8000/auth/request-otp",
        {},
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        }
      );
      alert("OTP has been resent to your registered email.");
    } catch (err) {
      alert("Failed to resend OTP. Please try again later.");
    }
  };

  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 flex justify-center items-center bg-black bg-opacity-50 z-50">
      <div className="bg-white p-6 rounded shadow-lg max-w-md w-full">
        <h2 className="text-lg font-bold mb-4">OTP Verification</h2>
        {error && <div className="mb-4 text-red-600">{error}</div>}
        <input
          type="text"
          placeholder="Enter OTP"
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
          className="w-full p-2 border rounded mb-4"
        />
        <button
          onClick={handleVerify}
          disabled={loading}
          className="w-full bg-primary text-white py-2 rounded mb-2"
        >
          {loading ? "Verifying..." : "Verify OTP"}
        </button>
        <button
          onClick={handleResend}
          className="w-full bg-gray-200 text-black py-2 rounded"
        >
          Resend OTP
        </button>
        <button
          onClick={onClose}
          className="mt-4 text-gray-500 underline w-full text-center"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

export default StampVerificationModal;
