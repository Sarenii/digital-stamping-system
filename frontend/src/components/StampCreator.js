import React, { useState } from "react";
import axios from "axios";
import { useAuth } from "../Context/AuthContext";
import NavBar from "./NavBar";

const StampCreator = ({ createStamp }) => {
  const [shape, setShape] = useState("Circle");
  const [shapeColor, setShapeColor] = useState("#FF5733");
  const [textColor, setTextColor] = useState("#000000");
  const [dateColor, setDateColor] = useState("#000000");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [topText, setTopText] = useState("");
  const [bottomText, setBottomText] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const { user } = useAuth();
  const token = user?.accessToken || localStorage.getItem("accessToken");

  const handleCreateStamp = async () => {
    if (!token) {
      setErrorMessage("No token found! Please log in.");
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

    try {
      const response = await axios.post(
        "http://localhost:8000/stamps/stamps/",
        stampData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setSuccessMessage("Stamp created successfully!");
      setErrorMessage("");
      createStamp(response.data);
    } catch (error) {
      setErrorMessage("Error creating stamp. Please try again.");
      setSuccessMessage("");
      console.error("Error creating stamp:", error.response || error);
    }
  };

  return (
    <>
      <NavBar />
      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md mx-auto mt-4">
        <h2 className="text-lg font-bold mb-6">Create Your Stamp</h2>

        {successMessage && (
          <div className="mb-4 p-3 bg-green-100 text-green-700 rounded">{successMessage}</div>
        )}

        {errorMessage && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">{errorMessage}</div>
        )}

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

        {/* Shape Color Selection */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Shape Color</label>
          <input
            type="color"
            className="w-full p-2 border rounded"
            value={shapeColor}
            onChange={(e) => setShapeColor(e.target.value)}
          />
          {/* Preview line that updates to the selected shape color */}
          <hr
            className="mt-2"
            style={{
              borderColor: shapeColor,
              borderWidth: "2px",
            }}
          />
        </div>

        {/* Text Color Selection */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Text Color</label>
          <input
            type="color"
            className="w-full p-2 border rounded"
            value={textColor}
            onChange={(e) => setTextColor(e.target.value)}
          />
          {/* Preview line that updates to the selected text color */}
          <hr
            className="mt-2"
            style={{
              borderColor: textColor,
              borderWidth: "2px",
            }}
          />
        </div>

        {/* Date Color Selection */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Date Color</label>
          <input
            type="color"
            className="w-full p-2 border rounded"
            value={dateColor}
            onChange={(e) => setDateColor(e.target.value)}
          />
          {/* Preview line that updates to the selected date color */}
          <hr
            className="mt-2"
            style={{
              borderColor: dateColor,
              borderWidth: "2px",
            }}
          />
        </div>

        {/* Date Field */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Date</label>
          <input
            type="date"
            className="w-full p-2 border rounded"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>

        {/* Top Text Field */}
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

        {/* Bottom Text Field */}
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
