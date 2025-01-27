// src/components/ManageStamps.js
import React, { useEffect, useState } from "react";
import { getStamps, deleteStamp } from "../services/stampService";

const ManageStamps = () => {
  const [stamps, setStamps] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch stamps when the component mounts
    const fetchStamps = async () => {
      try {
        const fetchedStamps = await getStamps();
        setStamps(fetchedStamps);
      } catch (error) {
        console.error("Error fetching stamps:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStamps();
  }, []);

  const handleDelete = async (stampId) => {
    try {
      await deleteStamp(stampId);
      // After deletion, remove the stamp from the state
      setStamps(stamps.filter((stamp) => stamp._id !== stampId));
    } catch (error) {
      console.error("Error deleting stamp:", error);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Manage Stamps</h2>
      {stamps.length === 0 ? (
        <p>No stamps available.</p>
      ) : (
        <ul className="space-y-4">
          {stamps.map((stamp) => (
            <li key={stamp._id} className="flex justify-between items-center">
              <div>
                <strong>{stamp.topText}</strong>
                <br />
                <span>{stamp.shape}</span>
              </div>
              <button
                onClick={() => handleDelete(stamp._id)}
                className="text-red-500 hover:text-red-700"
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default ManageStamps;
