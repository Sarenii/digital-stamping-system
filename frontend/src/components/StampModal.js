import React, { useState, useEffect } from "react";
import { getStamps } from "../services/stampService";

const StampModal = ({ isOpen, onClose, onCreateStamp }) => {
  const [view, setView] = useState("default");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [existingStamps, setExistingStamps] = useState([]);

  useEffect(() => {
    const fetchStamps = async () => {
      try {
        const stampsData = await getStamps();
        setExistingStamps(stampsData);
        setLoading(false);
      } catch (error) {
        setError("Error fetching stamps");
        setLoading(false);
      }
    };

    if (isOpen) {
      fetchStamps();
    }
  }, [isOpen]);

  const generalStamps = ["Confidential", "Top Secret", "Approved"];

  const handleSelectGeneralStamp = (stampText) => {
    // You can create a general stamp object with default properties
    const generalStamp = {
      id: Date.now(), // Generate a unique ID for general stamps
      shape: "Circle", // Default shape for general stamps
      shape_color: "#f0f0f0", // Example color
      text_color: "#000", // Example text color
      date_color: "#888", // Example date color
      top_text: stampText,
      bottom_text: "", // No bottom text for general stamps
      date: new Date().toLocaleDateString(),
    };

    onCreateStamp(generalStamp); // Pass the general stamp details
    onClose(); // Close the modal after selection
  };

  const handleSelectExistingStamp = (stamp) => {
    // Pass the full stamp object to the parent component
    onCreateStamp(stamp);
    onClose(); // Close the modal after selection
  };

  const handleSimpleStamp = () => {
    // Create a simple default stamp
    const simpleStamp = {
      id: Date.now(),
      shape: "Circle", // Simple shape
      shape_color: "#ff5733", // A different color for visibility
      text_color: "#fff", // White text color
      date_color: "#888", // Date color
      top_text: "Simple Stamp",
      bottom_text: "", // No bottom text
      date: new Date().toLocaleDateString(),
    };

    onCreateStamp(simpleStamp); // Pass the simple stamp to the parent component
    onClose(); // Close the modal after creation
  };

  const renderDefaultView = () => (
    <div className="flex flex-col gap-4">
      <h3 className="text-lg font-bold">Choose a Stamp Type</h3>
      <button
        className="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600"
        onClick={() => setView("general")}
      >
        Choose General Stamps
      </button>
      <button
        className="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600"
        onClick={() => setView("existing")}
      >
        Choose Existing Stamp
      </button>
      <button
        className="bg-green-500 text-white py-2 px-4 rounded hover:bg-green-600"
        onClick={handleSimpleStamp} // Trigger simple stamp creation
      >
        Simple Stamp
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

  const renderExistingStamps = () => {
    if (loading) return <p>Loading existing stamps...</p>;
    if (error) return <p>{error}</p>;
    if (existingStamps.length === 0) {
      return <p>No existing stamps available</p>;
    }

    return (
      <div className="flex flex-col gap-4">
        <h3 className="text-lg font-bold">Existing Stamps</h3>
        {existingStamps.map((stamp) => (
          <button
            key={stamp.id}
            className="border border-blue-500 text-blue-500 py-2 px-4 rounded hover:bg-blue-500 hover:text-white"
            onClick={() => handleSelectExistingStamp(stamp)}
          >
            {stamp.top_text}
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
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex justify-center items-center bg-black bg-opacity-50">
      <div className="bg-white p-6 rounded shadow-lg w-1/3">
        {view === "default" && renderDefaultView()}
        {view === "general" && renderGeneralStamps()}
        {view === "existing" && renderExistingStamps()}
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
