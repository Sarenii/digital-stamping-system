import React, { useState } from "react";
import { Stage, Layer } from "react-konva";
import StampComponent from "./StampComponent"; // Assuming this is the path to your stamp component
import StampModal from "./StampModal"; // Assuming this is the path to your stamp modal

const StampContainer = () => {
  const [stamps, setStamps] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);

  const handleCreateStamp = (stampData) => {
    setStamps([...stamps, stampData]); // Add new stamp data to the state
  };

  return (
    <div>
      <button
        className="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600"
        onClick={() => setModalOpen(true)}
      >
        Create Stamp
      </button>
      <Stage width={window.innerWidth} height={window.innerHeight}>
        <Layer>
          {stamps.map((stamp, index) => (
            <StampComponent
              key={index}
              x={100 * (index + 1)} // Example positioning
              y={100 * (index + 1)}
              text={stamp.text}
              shapeColor={stamp.shapeColor}
              textColor={stamp.textColor}
              dateColor={stamp.dateColor}
              zoom={1}
            />
          ))}
        </Layer>
      </Stage>

      <StampModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreateStamp={handleCreateStamp}
      />
    </div>
  );
};

export default StampContainer;
