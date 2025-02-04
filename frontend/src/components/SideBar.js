import React, { useState } from "react";

const SideBar = ({ addStamp, uploadDocument, isButtonActive }) => {
  const [file, setFile] = useState(null);

  const handleFileSelect = (e) => {
    setFile(e.target.files[0]);
  };

  const handleUpload = () => {
    if (file) {
      uploadDocument(file);
    }
  };

  return (
    <div className="bg-primary-100 w-60 p-4 flex flex-col gap-4">
      <label className="block">
        <span className="text-blue">Upload Document</span>
        <input
          type="file"
          onChange={handleFileSelect}
          className="mt-1 block w-full"
        />
      </label>
      <button
        onClick={handleUpload}
        className="bg-primary text-white py-2 px-4 rounded hover:bg-accent-900"
      >
        Upload
      </button>
      
    </div>
  );
};

export default SideBar;