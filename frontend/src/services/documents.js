// services/documents.js
import axios from 'axios';

// Define the base URL for your API (replace with your backend URL)
const API_URL = 'https://localhost:8000/stamps';

const getAuthHeaders = (token) => ({
  headers: {
    Authorization: `Bearer ${token}`,
  },
});

// Fetch all documents for the logged-in user
export const getDocuments = async (token) => {
  try {
    const response = await axios.get(`${API_URL}/documents`, getAuthHeaders(token));
    return response.data; // Return the list of documents
  } catch (error) {
    console.error("Error fetching documents:", error);
    throw new Error("Failed to fetch documents.");
  }
};

// Delete a document by its ID
export const deleteDocument = async (id, token) => {
  try {
    const response = await axios.delete(`${API_URL}/documents/${id}`, getAuthHeaders(token));
    return response.data; // Return the response from the backend
  } catch (error) {
    console.error("Error deleting document:", error);
    throw new Error("Failed to delete document.");
  }
};

// Upload a new document
export const uploadDocument = async (file, token) => {
  const formData = new FormData();
  formData.append('file', file);

  try {
    const response = await axios.post(`${API_URL}/documents/upload`, formData, getAuthHeaders(token));
    return response.data; // Return the uploaded document details
  } catch (error) {
    console.error("Error uploading document:", error);
    throw new Error("Failed to upload document.");
  }
};
