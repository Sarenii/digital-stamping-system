import React, { useState } from "react";
import axios from "axios";
import { useAuth } from "../Context/AuthContext";
import NavBar from "./NavBar";
import StampVerificationModal from "./StampVerificationModal"; // Dedicated modal for stamp creation verification

const StampCreator = ({ createStamp }) => {
  const [shape, setShape] = useState("Circle");
  const [shapeColor, setShapeColor] = useState("#FF5733");
  const [textColor, setTextColor] = useState("#000000");
  const [dateColor, setDateColor] = useState("#000000");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [topText, setTopText] = useState("");
  const [bottomText, setBottomText] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  // For individual users: track if they've been verified for stamp creation
  const [stampVerified, setStampVerified] = useState(false);
  const [showStampVerificationModal, setShowStampVerificationModal] = useState(false);

  const { user } = useAuth();
  const token = user?.accessToken || localStorage.getItem("accessToken");

  // Call backend to create the stamp
  const proceedStampCreation = async () => {
    const stampData = {
      shape,
      shape_color: shapeColor,
      text_color: textColor,
      date_color: dateColor,
      date,
      top_text: topText,
      bottom_text: bottomText,
    };

    try {
      const response = await axios.post(
        "http://localhost:8000/stamps/stamps/",
        stampData,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setSuccessMessage("Stamp created successfully!");
      setErrorMessage("");
      createStamp(response.data);
    } catch (error) {
      setErrorMessage("Error creating stamp. Please try again.");
      setSuccessMessage("");
      console.error("Error creating stamp:", error.response || error);
    }
  };

  // When clicking "Create Stamp", if individual and not verified, request OTP then show modal.
  const handleCreateStamp = async () => {
    if (!token) {
      setErrorMessage("No token found! Please log in.");
      return;
    }
    if (user?.role === "INDIVIDUAL" && !stampVerified) {
      try {
        // Request OTP for stamp verification for individual users.
        await axios.post(
          "http://localhost:8000/auth/request-stamp-otp",
          null,
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } catch (err) {
        console.error("Failed to send stamp OTP for individual:", err);
      }
      setShowStampVerificationModal(true);
      return;
    }
    // For companies or already verified individuals, create the stamp immediately.
    await proceedStampCreation();
  };

  return (
    <>
      <NavBar />
      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md mx-auto mt-4">
        <h2 className="text-lg font-bold mb-6">Create Your Stamp</h2>

        {successMessage && (
          <div className="mb-4 p-3 bg-green-100 text-green-700 rounded">
            {successMessage}
          </div>
        )}
        {errorMessage && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
            {errorMessage}
          </div>
        )}

        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Shape</label>
          <select
            className="w-full p-2 border rounded"
            value={shape}
            onChange={(e) => setShape(e.target.value)}
          >
            <option value="Circle">Circle</option>
            <option value="Square">Square</option>
            <option value="Star">Star</option>
          </select>
        </div>

        {/* Shape Color */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Shape Color</label>
          <input
            type="color"
            className="w-full p-2 border rounded"
            value={shapeColor}
            onChange={(e) => setShapeColor(e.target.value)}
          />
          <hr
            className="mt-2"
            style={{ borderColor: shapeColor, borderWidth: "2px" }}
          />
        </div>

        {/* Text Color */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Text Color</label>
          <input
            type="color"
            className="w-full p-2 border rounded"
            value={textColor}
            onChange={(e) => setTextColor(e.target.value)}
          />
          <hr
            className="mt-2"
            style={{ borderColor: textColor, borderWidth: "2px" }}
          />
        </div>

        {/* Date Color */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Date Color</label>
          <input
            type="color"
            className="w-full p-2 border rounded"
            value={dateColor}
            onChange={(e) => setDateColor(e.target.value)}
          />
          <hr
            className="mt-2"
            style={{ borderColor: dateColor, borderWidth: "2px" }}
          />
        </div>

        {/* Date Field */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Date</label>
          <input
            type="date"
            className="w-full p-2 border rounded"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>

        {/* Top Text */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">
            Top Text (Required)
          </label>
          <input
            type="text"
            className="w-full p-2 border rounded"
            placeholder="Enter text for the top line"
            value={topText}
            onChange={(e) => setTopText(e.target.value)}
            required
          />
        </div>

        {/* Bottom Text */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">
            Bottom Text (Optional)
          </label>
          <input
            type="text"
            className="w-full p-2 border rounded"
            placeholder="Enter text for the bottom line"
            value={bottomText}
            onChange={(e) => setBottomText(e.target.value)}
          />
        </div>

        <button
          className="w-full bg-primary text-white py-2 rounded hover:bg-accent transition"
          onClick={handleCreateStamp}
        >
          Create Stamp
        </button>
      </div>

      {/* Dedicated Stamp Verification Modal for individual users */}
      <StampVerificationModal
        isOpen={showStampVerificationModal}
        onClose={() => setShowStampVerificationModal(false)}
        onVerify={() => {
          setStampVerified(true);
          proceedStampCreation();
        }}
      />
    </>
  );
};

export default StampCreator;
