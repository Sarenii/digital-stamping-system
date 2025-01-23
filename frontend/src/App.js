import React, { useRef } from "react";
import NavBar from "./components/NavBar";
import SideBar from "./components/SideBar";
import FabricCanvas from "./components/FabricCanvas";

const App = () => {
  const canvasRef = useRef(null);

  const addStamp = (text) => {
    if (canvasRef.current) {
      canvasRef.current.addStamp(text);
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
        <SideBar addStamp={addStamp} uploadDocument={uploadDocument} />
        <FabricCanvas ref={canvasRef} />
      </div>
    </div>
  );
};

export default App;
