// src/components/StampCreator.js
import React, { useState } from "react";
import axios from "axios";
import { useAuth } from "../Context/AuthContext";
import NavBar from "./NavBar";
import StampVerificationModal from "./StampVerificationModal";

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

  // Controls the OTP modal for first-time stamping
  const [showStampVerificationModal, setShowStampVerificationModal] = useState(false);

  const { user } = useAuth();
  const token = user?.accessToken || localStorage.getItem("accessToken");

  // DEBUG: show logs for role and stamp_verified
  const role = (user?.role || "").toUpperCase();
  const userStampVerified = !!user?.stamp_verified; // boolean
  console.log("DEBUG: StampCreator => role:", role, "stamp_verified:", userStampVerified);

  /**
   * Actually create the stamp
   */
  const proceedStampCreation = async () => {
    setErrorMessage("");
    setSuccessMessage("");

    if (!token) {
      setErrorMessage("No token found! Please log in.");
      return;
    }

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
      console.log("DEBUG: Proceeding to create stamp with data:", stampData);
      const response = await axios.post(
        "http://localhost:8000/stamps/stamps/",
        stampData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSuccessMessage("Stamp created successfully!");
      setErrorMessage("");
      if (createStamp) createStamp(response.data);
    } catch (error) {
      console.error("Error creating stamp:", error.response || error);
      setSuccessMessage("");
      setErrorMessage("Error creating stamp. Please try again.");
    }
  };

  /**
   * Called when user clicks "Create Stamp"
   * - If user is INDIVIDUAL and user.stamp_verified===false => show stamping OTP
   * - Otherwise, just create the stamp
   */
  const handleCreateStamp = async () => {
    console.log("DEBUG: handleCreateStamp fired!");
    if (!token) {
      console.log("DEBUG: No token => returning");
      setErrorMessage("No token found! Please log in.");
      return;
    }

    if (role === "INDIVIDUAL" && !userStampVerified) {
      console.log("DEBUG: Individual user with stamp_verified=false => requesting OTP & showing modal");
      try {
        await axios.post(
          "http://localhost:8000/auth/request-otp",
          null,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        console.log("DEBUG: request-otp call succeeded for INDIVIDUAL stamping");
      } catch (err) {
        console.error("DEBUG: Failed to send stamp OTP for individual:", err);
      }
      setShowStampVerificationModal(true);
    } else {
      // If user is COMPANY or userStampVerified = true => proceed
      console.log("DEBUG: role not INDIVIDUAL or stamp_verified already true => creating stamp now");
      await proceedStampCreation();
    }
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

        {/* Fields for shape, color, text, etc. */}
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

        {/* shapeColor */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Shape Color</label>
          <input
            type="color"
            className="w-full p-2 border rounded"
            value={shapeColor}
            onChange={(e) => setShapeColor(e.target.value)}
          />
          <hr className="mt-2" style={{ borderColor: shapeColor, borderWidth: "2px" }} />
        </div>

        {/* textColor */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Text Color</label>
          <input
            type="color"
            className="w-full p-2 border rounded"
            value={textColor}
            onChange={(e) => setTextColor(e.target.value)}
          />
          <hr className="mt-2" style={{ borderColor: textColor, borderWidth: "2px" }} />
        </div>

        {/* dateColor */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Date Color</label>
          <input
            type="color"
            className="w-full p-2 border rounded"
            value={dateColor}
            onChange={(e) => setDateColor(e.target.value)}
          />
          <hr className="mt-2" style={{ borderColor: dateColor, borderWidth: "2px" }} />
        </div>

        {/* date */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Date</label>
          <input
            type="date"
            className="w-full p-2 border rounded"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>

        {/* top text */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Top Text (Required)</label>
          <input
            type="text"
            className="w-full p-2 border rounded"
            placeholder="Enter text for the top line"
            value={topText}
            onChange={(e) => setTopText(e.target.value)}
            required
          />
        </div>

        {/* bottom text */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Bottom Text (Optional)</label>
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

      {/* Stamp Verification Modal => only for INDIVIDUAL if stamp_verified===false */}
      <StampVerificationModal
        isOpen={showStampVerificationModal}
        onClose={() => {
          console.log("DEBUG: Closing stamping OTP modal");
          setShowStampVerificationModal(false);
        }}
        onVerify={() => {
          console.log("DEBUG: OTP verified for stamping => calling proceedStampCreation");
          // After user verifies OTP for stamping, the server sets user.stamp_verified=true
          proceedStampCreation();
        }}
        forStamping={true}
      />
    </>
  );
};

export default StampCreator;
