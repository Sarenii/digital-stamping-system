import React, { useRef } from "react";
import FabricCanvas from "./FabricCanvas";

const ParentComponent = () => {
  const fabricCanvasRef = useRef();

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      fabricCanvasRef.current.uploadDocument(file);  // Call the uploadDocument function
    }
  };

  return (
    <div>
      <input type="file" onChange={handleFileChange} />
      <FabricCanvas ref={fabricCanvasRef} />
    </div>
  );
};

export default ParentComponent;
