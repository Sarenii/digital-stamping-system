import React, { useState } from "react";
import axios from "axios"; // Make sure axios is imported
import { useAuth } from "../Context/AuthContext"; // Assuming your context is in the contexts folder
import NavBar from "./NavBar"; // Import the NavBar component

const StampCreator = ({ createStamp }) => {
  const [shape, setShape] = useState("Circle");
  const [shapeColor, setShapeColor] = useState("#FF5733");
  const [textColor, setTextColor] = useState("#000000");
  const [dateColor, setDateColor] = useState("#000000");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [topText, setTopText] = useState("");
  const [bottomText, setBottomText] = useState("");

  // Access user info and token from AuthContext
  const { user } = useAuth();
  const token = user?.accessToken || localStorage.getItem("accessToken"); // Get the token from context or localStorage

  const handleCreateStamp = async () => {
    if (!token) {
      console.error("No token found! Please log in.");
      return;
    }

    const stampData = {
      shape,
      shape_color: shapeColor,
      text_color: textColor,
      date_color: dateColor,
      date,
      top_text: topText,
      bottom_text: bottomText,
    };

    console.log("Token being used:", token); // Debugging log

    try {
      const response = await axios.post(
        "http://localhost:8000/stamps/stamps/",
        stampData,
        {
          headers: {
            Authorization: `Bearer ${token}`, // Pass token here
          },
        }
      );
      console.log("Stamp created:", response.data);
      createStamp(response.data); // Update UI if necessary with the created stamp
    } catch (error) {
      console.error("Error creating stamp:", error.response || error);
    }
  };

  return (
    <>
      <NavBar /> {/* Add the NavBar component here */}
      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md mx-auto mt-4">
        <h2 className="text-lg font-bold mb-6">Create Your Stamp</h2>

        {/* Shape selection */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Shape</label>
          <select
            className="w-full p-2 border rounded"
            value={shape}
            onChange={(e) => setShape(e.target.value)}
          >
            <option value="Circle">Circle</option>
            <option value="Square">Square</option>
            <option value="Star">Star</option>
          </select>
        </div>

        {/* Shape color */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Shape Color</label>
          <input
            type="color"
            className="w-full p-2 border rounded"
            value={shapeColor}
            onChange={(e) => setShapeColor(e.target.value)}
          />
        </div>

        {/* Text color */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Text Color</label>
          <input
            type="color"
            className="w-full p-2 border rounded"
            value={textColor}
            onChange={(e) => setTextColor(e.target.value)}
          />
        </div>

        {/* Date color */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Date Color</label>
          <input
            type="color"
            className="w-full p-2 border rounded"
            value={dateColor}
            onChange={(e) => setDateColor(e.target.value)}
          />
        </div>

        {/* Date input */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Date</label>
          <input
            type="date"
            className="w-full p-2 border rounded"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>

        {/* Top text input */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Top Text (Required)</label>
          <input
            type="text"
            className="w-full p-2 border rounded"
            placeholder="Enter text for the top line"
            value={topText}
            onChange={(e) => setTopText(e.target.value)}
            required
          />
        </div>

        {/* Bottom text input */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Bottom Text (Optional)</label>
          <input
            type="text"
            className="w-full p-2 border rounded"
            placeholder="Enter text for the bottom line"
            value={bottomText}
            onChange={(e) => setBottomText(e.target.value)}
          />
        </div>

        {/* Create stamp button */}
        <button
          className="w-full bg-primary text-white py-2 rounded hover:bg-accent hover:text-primary transition"
          onClick={handleCreateStamp}
        >
          Create Stamp
        </button>
      </div>
    </>
  );
};

export default StampCreator;
