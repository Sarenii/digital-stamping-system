import React, { useRef, useState } from "react";
import NavBar from "./NavBar";
import SideBar from "./SideBar";
import KonvaCanvas from "./KonvaCanvas";
import StampModal from "./StampModal"; // The StampModal component

const CanvasWithSidebar = () => {
  const canvasRef = useRef(null);
  const [isButtonActive, setIsButtonActive] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false); // State for modal visibility
  const [stampData, setStampData] = useState(null); // State for storing the stamp data

  // Function to handle opening the stamp creation modal
  const addStamp = () => {
    setIsModalOpen(true); // Open the modal when "Add Stamp" is clicked
  };

  // Function to handle document upload
  const uploadDocument = (file) => {
    if (canvasRef.current && canvasRef.current.uploadDocument) {
      canvasRef.current.uploadDocument(file);
    }
  };

  // Function to handle the creation of a new stamp
  const handleCreateStamp = (data) => {
    setStampData(data); // Store the stamp data in the state

    // If we want to create a stamp right away on the canvas
    if (canvasRef.current && canvasRef.current.addStamp) {
      canvasRef.current.addStamp(data); 
    }
    setIsModalOpen(false); // Close the modal after creating the stamp
  };

  return (
    <div className="flex flex-col h-screen">
      <NavBar />
      <div className="flex flex-1">
        <SideBar
          addStamp={addStamp}
          uploadDocument={uploadDocument}
          isButtonActive={isButtonActive}
        />
        <KonvaCanvas
          ref={canvasRef}
          setIsButtonActive={setIsButtonActive}
          stampData={stampData} 
        />
      </div>

      {/* Stamp Modal */}
      <StampModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)} // Close modal
        onCreateStamp={handleCreateStamp} // Pass function to create stamp
      />
    </div>
  );
};

export default CanvasWithSidebar;