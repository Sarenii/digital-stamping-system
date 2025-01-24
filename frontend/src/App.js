import React, { useRef, useState } from "react";
import NavBar from "./components/NavBar";
import SideBar from "./components/SideBar";
import KonvaCanvas from "./components/KonvaCanvas";

const App = () => {
  const canvasRef = useRef(null);
  const [isButtonActive, setIsButtonActive] = useState(false);

  const addStamp = () => {
    if (canvasRef.current) {
      canvasRef.current.handleAddStamp(); // Activate the modal and button
    }
  };

  const uploadDocument = (file) => {
    if (canvasRef.current) {
      canvasRef.current.uploadDocument(file);
    }
  };

  return (
    <div className="flex flex-col h-screen">
      <NavBar />
      <div className="flex flex-1">
        <SideBar
          addStamp={addStamp}
          uploadDocument={uploadDocument}
          isButtonActive={isButtonActive} // Pass the active state to the sidebar
        />
        <KonvaCanvas
          ref={canvasRef}
          setIsButtonActive={setIsButtonActive} // Pass state setter to KonvaCanvas
        />
      </div>
    </div>
  );
};

export default App;
