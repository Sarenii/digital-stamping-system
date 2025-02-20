// src/components/StampVerificationModal.js
import React, { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../Context/AuthContext";

/**
 * Props:
 * - isOpen (bool): Whether to show the modal.
 * - onClose (func): Called to close the modal.
 * - onVerify (func): Called after successful OTP verification.
 * - forStamping (bool): If true, the backend sets user.stamp_verified for individuals.
 */
const StampVerificationModal = ({
  isOpen,
  onClose,
  onVerify,
  forStamping = false,
}) => {
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { user } = useAuth();
  const token = user?.accessToken || localStorage.getItem("accessToken");
  const userEmail = user?.email || localStorage.getItem("userEmail") || "";

  useEffect(() => {
    if (isOpen && userEmail) {
      console.log("DEBUG: StampVerificationModal => isOpen, userEmail =>", userEmail);
      // Optionally request OTP automatically
      axios
        .post("http://localhost:8000/auth/request-otp/", null, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
        .then(() => {
          console.log("DEBUG: OTP requested automatically for stamping/email verification.");
        })
        .catch((err) => {
          console.error("DEBUG: Failed to request OTP in StampVerificationModal:", err);
        });
    }
  }, [isOpen, userEmail, token]);

  const handleVerify = async () => {
    console.log("DEBUG: handleVerify => verifying OTP", otp, "for userEmail:", userEmail);
    setError("");
    setLoading(true);
    try {
      await axios.post(
        "http://localhost:8000/auth/verify-otp/",
        {
          email: userEmail,
          otp,
          for_stamping: forStamping,
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      // If no error => OTP is correct
      console.log("DEBUG: OTP verified successfully => calling onVerify()");
      onVerify();
      onClose();
    } catch (err) {
      setError("Invalid or expired OTP. Please try again.");
      console.error("DEBUG: OTP verification error:", err);
    }
    setLoading(false);
  };

  const handleResend = async () => {
    console.log("DEBUG: Resend OTP => calling request-otp again");
    try {
      await axios.post(
        "http://localhost:8000/auth/request-otp/",
        null,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      alert("A new OTP has been sent to your email.");
    } catch (err) {
      alert("Failed to resend OTP. Please try again later.");
      console.error("DEBUG: Resend OTP error:", err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
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
          onClick={() => {
            console.log("DEBUG: Cancelling OTP modal => onClose()");
            onClose();
          }}
          className="mt-4 text-gray-500 underline w-full text-center"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

export default StampVerificationModal;
