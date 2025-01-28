import React from "react";

const StampSelectionModal = ({ onSelect, onClose }) => {
  return (
    <div className="fixed inset-0 bg-gray-800 bg-opacity-70 flex justify-center items-center">
      <div className="bg-gray-900 p-6 rounded-xl shadow-lg w-1/4 relative">
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-white text-2xl"
        >
          &times;
        </button>
        <h3 className="text-lg font-semibold text-white mb-4">Select a Stamp</h3>
        <div className="space-y-4">
          <button
            onClick={() => onSelect("APPROVED")}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-xl transition duration-200"
          >
            APPROVED
          </button>
          <button
            onClick={() => onSelect("CONFIDENTIAL")}
            className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded-xl transition duration-200"
          >
            CONFIDENTIAL
          </button>
        </div>
      </div>
    </div>
  );
};

export default StampSelectionModal;