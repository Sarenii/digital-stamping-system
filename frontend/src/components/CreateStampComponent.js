import React, { useState } from "react";

const CreateStampComponent = ({ onCreate, onClose }) => {
  const [text, setText] = useState("");
  const [color, setColor] = useState("rgba(255, 0, 0, 0.5)"); // Default red color
  const [size, setSize] = useState(1);

  const handleCreate = () => {
    if (text.trim() !== "") {
      onCreate({ text, color, size });
      onClose();
    } else {
      alert("Please enter text for the stamp.");
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-800 bg-opacity-70 flex justify-center items-center">
      <div className="bg-gray-900 p-6 rounded-xl shadow-lg w-1/3 relative">
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-white text-2xl"
        >
          &times;
        </button>
        <h3 className="text-lg font-semibold text-white mb-4">Create Custom Stamp</h3>
        
        <label className="text-white block mb-2">Stamp Text:</label>
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="w-full p-2 rounded mb-4 text-black"
        />

        <label className="text-white block mb-2">Stamp Color:</label>
        <input
          type="color"
          value={color}
          onChange={(e) => setColor(e.target.value)}
          className="w-full mb-4"
        />

        <label className="text-white block mb-2">Stamp Size:</label>
        <input
          type="range"
          min="0.5"
          max="3"
          step="0.1"
          value={size}
          onChange={(e) => setSize(parseFloat(e.target.value))}
          className="w-full mb-4"
        />

        <div className="flex justify-between items-center">
          <button
            onClick={handleCreate}
            className="bg-primary hover:bg-primary text-white py-2 rounded-xl"
          >
            Create Stamp
          </button>
          <button
            onClick={onClose}
            className="bg-gray-600 hover:bg-gray-700 text-white py-2 rounded-xl"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateStampComponent;