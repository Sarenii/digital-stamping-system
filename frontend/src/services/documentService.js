// src/services/documentService.js
import axios from "axios";

const API_URL = "http://localhost:8000/stamps/documents";

export const getDocuments = async (token) => {
  try {
    const response = await axios.get(API_URL, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data; // Assuming it returns an array of documents
  } catch (error) {
    console.error("Error fetching documents:", error);
    throw error;
  }
};

export const uploadDocument = async (documentData, token) => {
  try {
    const response = await axios.post(API_URL, documentData, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data; // Return the uploaded document data
  } catch (error) {
    console.error("Error uploading document:", error);
    throw error;
  }
};

// Other document-related API functions (update, delete, etc.) can be added here.
