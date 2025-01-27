import React, { useState } from "react";
import { useNavigate } from "react-router-dom"; // Import useNavigate

const StampModal = ({ isOpen, onClose, onCreateStamp }) => {
  const [view, setView] = useState("default");
  const [stampText, setStampText] = useState(""); // For custom text input
  const [shapeColor, setShapeColor] = useState("blue");
  const [textColor, setTextColor] = useState("blue");
  const [dateColor, setDateColor] = useState("black");
  const navigate = useNavigate(); // Use navigate hook for navigation

  const generalStamps = ["Confidential", "Top Secret", "Approved"];

  const handleSelectGeneralStamp = (stampText) => {
    onCreateStamp({
      text: stampText,
      type: "general",
      shapeColor,
      textColor,
      dateColor,
    });
    onClose();
  };

  const renderDefaultView = () => (
    <div className="flex flex-col gap-4">
      <p>No stamps created yet</p>
      <button
        className="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600"
        onClick={() => setView("general")}
      >
        Choose General Stamps
      </button>
      <button
        className="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600"
        onClick={() => {
          setView("custom");
          navigate('/creator');  // Navigate to the creator page
        }}
      >
        Create Your Stamp
      </button>
    </div>
  );

  const renderGeneralStamps = () => (
    <div className="flex flex-col gap-4">
      <h3 className="text-lg font-bold">General Stamps</h3>
      {generalStamps.map((stamp, index) => (
        <button
          key={index}
          className="border border-blue-500 text-blue-500 py-2 px-4 rounded hover:bg-blue-500 hover:text-white"
          onClick={() => handleSelectGeneralStamp(stamp)}
        >
          {stamp}
        </button>
      ))}
      <button
        className="mt-4 text-gray-500 underline"
        onClick={() => setView("default")}
      >
        Back
      </button>
    </div>
  );

  const renderCustomStampForm = () => (
    <div className="flex flex-col gap-4">
      <h3 className="text-lg font-bold">Create Custom Stamp</h3>
      <button
        className="mt-4 text-gray-500 underline"
        onClick={() => setView("default")}
      >
        Back
      </button>
    </div>
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex justify-center items-center bg-black bg-opacity-50">
      <div className="bg-white p-6 rounded shadow-lg w-1/3">
        {view === "default" && renderDefaultView()}
        {view === "general" && renderGeneralStamps()}
        {view === "custom" && renderCustomStampForm()}
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-500 hover:text-black"
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default StampModal;
