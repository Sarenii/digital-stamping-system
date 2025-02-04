// src/components/StampManager.js
import React, { useEffect, useState } from "react";
import { Stage, Layer } from "react-konva";
import { getStamps, deleteStamp } from "../services/stampService";
import { useAuth } from "../Context/AuthContext";
import NavBar from "./NavBar";
import StampComponent from "./StampComponent"; // <<-- Import the Konva-based StampComponent

const StampManager = () => {
  const [stamps, setStamps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const { user } = useAuth();
  const token = user?.accessToken || localStorage.getItem("accessToken");

  useEffect(() => {
    const fetchStamps = async () => {
      try {
        if (!token) {
          console.error("No token found! Please log in.");
          setError("No token found! Please log in.");
          setLoading(false);
          return;
        }

        const stampsData = await getStamps();
        console.log("Fetched stamps:", stampsData);
        setStamps(stampsData);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching stamps:", error);
        setError("Error fetching stamps");
        setLoading(false);
      }
    };

    fetchStamps();
  }, [token]);

  const handleDelete = async (id) => {
    try {
      await deleteStamp(id, token);
      setStamps(stamps.filter((stamp) => stamp.id !== id));
    } catch (error) {
      console.error("Error deleting stamp:", error);
      setError("Error deleting stamp");
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <>
      <NavBar />
      <div className="p-4">
        <h2 className="text-xl font-bold mb-4">Manage Stamps</h2>
        {stamps.length === 0 ? (
          <p>No stamps available.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {stamps.map((stamp) => (
              <div key={stamp.id} className="relative w-[140px] h-[140px]">
                {/* 
                  We create a Konva Stage at a fixed width/height 
                  that matches what StampComponent expects (120px, 120px).
                  If you need a larger or smaller preview, adjust as desired.
                */}
                <Stage width={120} height={120}>
                  <Layer>
                    <StampComponent
                      // We only need enough props to draw the stamp
                      id={stamp.id}
                      x={0}
                      y={0}
                      zoom={1}
                      pageY={0}
                      shape={stamp.shape}
                      shape_color={stamp.shape_color}
                      text_color={stamp.text_color}
                      date_color={stamp.date_color}
                      top_text={stamp.top_text}
                      bottom_text={stamp.bottom_text}
                      date={stamp.date}
                      // Remove onDrag/onDelete if you just want a static preview
                    />
                  </Layer>
                </Stage>

                {/* 
                  Absolute-positioned DELETE button in the corner.
                  Adjust styling as needed.
                */}
                <button
                  className="absolute bottom-0 right-0 bg-primary text-white px-2 py-1 rounded text-xs"
                  onClick={() => handleDelete(stamp.id)}
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default StampManager;
