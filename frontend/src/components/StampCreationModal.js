import React, { useState } from "react";

const StampCreationModal = ({ onCreate, onClose }) => {
  const [text, setText] = useState("");
  const [borderColor, setBorderColor] = useState("blue");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (text.trim()) {
      onCreate({ text, borderColor });
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
      <div className="bg-secondary p-6 rounded-lg w-1/2">
        <h3 className="text-xl mb-4">Create Custom Stamp</h3>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Stamp text"
            className="px-4 py-2 mb-4 w-full border border-gray-300 rounded"
          />
          <input
            type="color"
            value={borderColor}
            onChange={(e) => setBorderColor(e.target.value)}
            className="mb-4"
          />
          <div className="flex justify-between">
            <button
              type="submit"
              className="px-4 py-2 bg-green-500 text-white rounded"
            >
              Create
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-red-500 text-white rounded"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StampCreationModal;
