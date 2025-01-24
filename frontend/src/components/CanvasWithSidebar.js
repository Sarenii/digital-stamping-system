import React from "react";
import SideBar from "./SideBar";
import KonvaCanvas from "./KonvaCanvas";

const CanvasWithSidebar = () => {
  return (
    <div className="flex h-screen">
      <SideBar />
      <div className="flex-1">
        <KonvaCanvas />
      </div>
    </div>
  );
};

export default CanvasWithSidebar;
