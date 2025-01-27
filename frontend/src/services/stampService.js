// src/services/stampsService.js
import axios from 'axios';

// Base URL for the stamps API (replace with your actual API URL)
const API_URL = 'http://127.0.0.1:8000/stamps/';

// Function to get all stamps
export const getStamps = async () => {
  try {
    const response = await axios.get(API_URL);
    return response.data; // List of all stamps
  } catch (error) {
    console.error('Error fetching stamps:', error);
    throw error;
  }
};

// Function to create a new stamp
export const createStamp = async (stampData) => {
  try {
    const response = await axios.post(API_URL, stampData);
    return response.data; // Created stamp data
  } catch (error) {
    console.error('Error creating stamp:', error);
    throw error;
  }
};

// Function to get a specific stamp by ID
export const getStampById = async (id) => {
  try {
    const response = await axios.get(`${API_URL}${id}/`);
    return response.data; // Specific stamp data
  } catch (error) {
    console.error(`Error fetching stamp with id ${id}:`, error);
    throw error;
  }
};

// Function to update a specific stamp by ID
export const updateStamp = async (id, updatedData) => {
  try {
    const response = await axios.put(`${API_URL}${id}/`, updatedData);
    return response.data; // Updated stamp data
  } catch (error) {
    console.error(`Error updating stamp with id ${id}:`, error);
    throw error;
  }
};

// Function to delete a specific stamp by ID
export const deleteStamp = async (id) => {
  try {
    const response = await axios.delete(`${API_URL}${id}/`);
    return response.data; // Response confirming deletion
  } catch (error) {
    console.error(`Error deleting stamp with id ${id}:`, error);
    throw error;
  }
};
