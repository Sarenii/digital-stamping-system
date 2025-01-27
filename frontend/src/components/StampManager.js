// src/components/StampManager.js
import React, { useEffect, useState } from 'react';
import { getStamps, deleteStamp } from '../services/stampsService'; // Import the service

const StampManager = () => {
  const [stamps, setStamps] = useState([]);

  useEffect(() => {
    const fetchStamps = async () => {
      try {
        const stampsData = await getStamps();
        setStamps(stampsData);
      } catch (error) {
        console.error('Error fetching stamps:', error);
      }
    };
    fetchStamps();
  }, []);

  const handleDelete = async (id) => {
    try {
      await deleteStamp(id);
      setStamps(stamps.filter(stamp => stamp.id !== id)); // Update the state after deleting
    } catch (error) {
      console.error('Error deleting stamp:', error);
    }
  };

  return (
    <div className="stamp-manager">
      <h2>Manage Stamps</h2>
      <ul>
        {stamps.map(stamp => (
          <li key={stamp.id}>
            <div>{stamp.topText} - {stamp.shape}</div>
            <button onClick={() => handleDelete(stamp.id)}>Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default StampManager;
