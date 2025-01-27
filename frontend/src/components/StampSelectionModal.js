import React, { useState } from "react";

const StampSelectionModal = ({ showModal, stamps, onSelect, onCreate, onClose }) => {
  const [showGeneralStamps, setShowGeneralStamps] = useState(false); // Add state here

  return (
    <div
      className={`fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center ${showModal ? "block" : "hidden"}`}
    >
      <div className="bg-secondary p-6 rounded-lg w-1/2">
        <h3 className="text-xl mb-4">Add Stamp</h3>
        
        {stamps.length > 0 ? (
          <div>
            <h4 className="text-lg mb-2">Your Custom Stamps:</h4>
            <ul>
              {stamps.map((stamp) => (
                <li key={stamp.id}>
                  <button
                    onClick={() => onSelect(stamp.text)}
                    className="px-4 py-2 bg-accent text-white hover:bg-accent-dark rounded w-full text-left"
                  >
                    {stamp.text}
                  </button>
                </li>
              ))}
            </ul>
            <div className="mt-4">
              <button
                onClick={onCreate}
                className="px-4 py-2 bg-green-500 text-white rounded w-full"
              >
                Create Custom Stamp
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center text-gray-500">
            <p>You haven't created any custom stamps yet.</p>
          </div>
        )}
        <button
          onClick={onClose}
          className="mt-4 px-4 py-2 bg-red-500 text-white rounded w-full"
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default StampSelectionModal;
