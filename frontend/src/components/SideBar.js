import React, { useRef } from "react";

const SideBar = ({ addStamp, uploadDocument }) => {
  const fileInputRef = useRef(null);

  return (
    <aside className="bg-secondary text-accent w-1/4 p-6 shadow-lg">
      <h2 className="text-lg font-bold mb-6">Tools</h2>

      {/* Add Stamp Button */}
      <button
        className="w-full bg-primary text-white py-2 rounded mb-4 hover:bg-accent hover:text-primary transition"
        onClick={() => addStamp("New Stamp")}
      >
        Add Stamp
      </button>

      {/* Upload Document Button */}
      <button
        className="w-full bg-primary text-white py-2 rounded mb-4 hover:bg-accent hover:text-primary transition"
        onClick={() => fileInputRef.current.click()}
      >
        Upload Document
      </button>

      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        accept=".jpg,.jpeg,.png,.pdf,.docx"
        className="hidden"
        onChange={(e) => {
          if (e.target.files.length > 0) {
            uploadDocument(e.target.files[0]);
          }
        }}
      />

      {/* Additional Tools Placeholder */}
      <button
        className="w-full bg-primary text-white py-2 rounded hover:bg-accent hover:text-primary transition"
        onClick={() => alert("More tools coming soon!")}
      >
        Manage Stamps
      </button>
    </aside>
  );
};

export default SideBar;
