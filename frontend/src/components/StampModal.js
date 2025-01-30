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
        const stampsData = await getStamps(); // fetch from backend
        setExistingStamps(stampsData);
        setLoading(false);
      } catch (err) {
        setError("Error fetching stamps");
        setLoading(false);
      }
    };

    if (isOpen) {
      fetchStamps();
    }
  }, [isOpen]);

  /**
   * "General stamps" are just text-based stamps with default circle shape
   */
  const generalStamps = ["Confidential", "Top Secret", "Approved"];

  /** Create a general stamp object and pass it to onCreateStamp */
  const handleSelectGeneralStamp = (stampText) => {
    const generalStamp = {
      id: Date.now(),
      shape: "Circle",       // default shape
      shape_color: "#f0f0f0",
      text_color: "#000",
      date_color: "#888",
      top_text: stampText,
      bottom_text: "",
      date: new Date().toLocaleDateString(),
    };
    onCreateStamp(generalStamp);
    onClose();
  };

  /** Choose an existing stamp from backend */
  const handleSelectExistingStamp = (stamp) => {
    onCreateStamp(stamp);
    onClose();
  };

  /** A “simple stamp” example */
  const handleSimpleStamp = () => {
    const simpleStamp = {
      id: Date.now(),
      shape: "Circle",
      shape_color: "#ff5733",
      text_color: "#fff",
      date_color: "#888",
      top_text: "Simple Stamp",
      bottom_text: "",
      date: new Date().toLocaleDateString(),
    };
    onCreateStamp(simpleStamp);
    onClose();
  };

  /** Default modal view: choose General, Existing, or Simple stamp */
  const renderDefaultView = () => (
    <div className="flex flex-col gap-4">
      <h3 className="text-lg font-bold">Choose a Stamp Type</h3>
      <button
        className="bg-primary text-white py-2 px-4 rounded hover:bg-primary"
        onClick={() => setView("general")}
      >
        Choose General Stamps
      </button>
      <button
        className="bg-primary text-white py-2 px-4 rounded hover:bg-primary"
        onClick={() => setView("existing")}
      >
        Choose Existing Stamp
      </button>
      <button
        className="bg-green-500 text-white py-2 px-4 rounded hover:bg-green-600"
        onClick={handleSimpleStamp}
      >
        Simple Stamp
      </button>
    </div>
  );

  /** Show the "General Stamps" list */
  const renderGeneralStamps = () => (
    <div className="flex flex-col gap-4">
      <h3 className="text-lg font-bold">General Stamps</h3>
      {generalStamps.map((stamp, index) => (
        <button
          key={index}
          className="border border-primary text-primary py-2 px-4 rounded hover:bg-primary hover:text-white"
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

  /** Show the existing stamps (fetched from backend) */
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
            className="border border-primary text-primary py-2 px-4 rounded hover:bg-primary hover:text-white"
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
    <div className="fixed inset-0 flex justify-center items-center bg-black bg-opacity-50 z-50">
      <div className="relative bg-white p-6 rounded shadow-lg w-1/3">
        {view === "default" && renderDefaultView()}
        {view === "general" && renderGeneralStamps()}
        {view === "existing" && renderExistingStamps()}
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-500 hover:text-black"
        >
          ✕
        </button>
      </div>
    </div>
  );
};

export default StampModal;