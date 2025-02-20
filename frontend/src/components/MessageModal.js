// MessageModal.js (or inline in KonvaCanvas)
import React from "react";

const MessageModal = ({ isOpen, message, type = "info", onClose }) => {
  if (!isOpen || !message) return null;

  // Type can be "error", "info", "success", etc. 
  // We'll style background accordingly:
  let bgColor = "bg-blue-100";
  let textColor = "text-blue-800";
  if (type === "error") {
    bgColor = "bg-red-100";
    textColor = "text-red-800";
  } else if (type === "success") {
    bgColor = "bg-green-100";
    textColor = "text-green-800";
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div className="absolute inset-0 bg-black bg-opacity-50"></div>
      <div className={`${bgColor} ${textColor} p-6 rounded shadow-lg max-w-md w-full z-10`}>
        <p className="mb-4 font-semibold text-lg">{message}</p>
        <button
          onClick={onClose}
          className="px-4 py-2 rounded bg-white text-gray-800 hover:bg-gray-100"
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default MessageModal;
