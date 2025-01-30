import React, { useState } from "react";

function StampCreationModal({ onCreate, onClose }) {
  const [stampText, setStampText] = useState("");
  const [borderColor, setBorderColor] = useState("#FF0000");

  const handleCreate = () => {
    // Return the user’s choices
    onCreate({
      text: stampText,
      borderColor,
    });
  };

  return (
    <div className="fixed inset-0 flex justify-center items-center bg-black bg-opacity-50 z-50">
      <div className="bg-white p-4 rounded shadow-lg w-[300px] relative">
        <h2 className="font-bold mb-4 text-center">
          Create a Custom Stamp
        </h2>

        <label className="block mb-2">
          <span className="text-sm">Stamp Text:</span>
          <input
            type="text"
            className="w-full p-2 border rounded"
            value={stampText}
            onChange={(e) => setStampText(e.target.value)}
          />
        </label>

        <label className="block mb-2">
          <span className="text-sm">Border Color:</span>
          <input
            type="color"
            className="w-full p-2 border rounded"
            value={borderColor}
            onChange={(e) => setBorderColor(e.target.value)}
          />
        </label>

        <div className="flex justify-end space-x-2 mt-4">
          <button
            className="bg-gray-200 px-4 py-2 rounded"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className="bg-primary text-white px-4 py-2 rounded"
            onClick={handleCreate}
          >
            Create
          </button>
        </div>

        <button
          className="absolute top-2 right-2 text-gray-500 hover:text-black"
          onClick={onClose}
        >
          X
        </button>
      </div>
    </div>
  );
}

export default StampCreationModal;