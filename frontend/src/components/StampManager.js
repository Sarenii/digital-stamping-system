import React, { useEffect, useState } from "react";
import { getStamps, deleteStamp } from "../services/stampService";
import { useAuth } from "../Context/AuthContext";

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
        console.log("Fetched stamps:", stampsData); // Log the fetched stamps
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
    <div className="stamp-manager p-4">
      <h2 className="text-xl font-bold mb-4">Manage Stamps</h2>
      {stamps.length === 0 ? (
        <p>No stamps available.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {stamps.map((stamp) => {
            console.log("Stamp shape:", stamp.shape); // Log each stamp's shape value

            // Logic to apply different styles based on the shape
            let shapeClasses = "";
            if (stamp.shape === "Circle") {
              shapeClasses = "rounded-full";
            } else if (stamp.shape === "Square") {
              shapeClasses = "rounded-md";
            } else if (stamp.shape === "Star") {
              shapeClasses = "star-shape"; // Custom class for Star (define it in CSS)
            } else {
              shapeClasses = "rounded-md"; // Default to square if no known shape
            }

            return (
              <div
                key={stamp.id}
                className="relative w-48 h-48 mx-auto flex items-center justify-center bg-accent text-primary shadow-lg"
              >
                {/* Outer Shape */}
                <div
                  className={`absolute ${shapeClasses} w-full h-full border-4 border-primary`}
                  style={{ backgroundColor: stamp.shape_color }}
                ></div>

                {/* Inner Shape */}
                <div
                  className={`absolute ${shapeClasses} w-32 h-32 flex items-center justify-center`}
                  style={{
                    backgroundColor: "#fff",
                  }}
                >
                  <p className="text-sm" style={{ color: stamp.date_color }}>
                    {stamp.date}
                  </p>
                </div>

                {/* Top Text */}
                <p
                  className="absolute text-sm font-bold w-full text-center top-4"
                  style={{ color: stamp.text_color }}
                >
                  {stamp.top_text}
                </p>

                {/* Bottom Text */}
                {stamp.bottom_text && (
                  <p
                    className="absolute text-sm font-bold w-full text-center bottom-4"
                    style={{ color: stamp.text_color }}
                  >
                    {stamp.bottom_text}
                  </p>
                )}

                {/* Delete Button */}
                <button
                  className="absolute bottom-0 right-0 bg-primary text-accent px-2 py-1 rounded-lg text-xs shadow-md"
                  onClick={() => handleDelete(stamp.id)}
                >
                  Delete
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default StampManager;
