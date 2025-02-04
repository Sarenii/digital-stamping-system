// src/services/documentService.js
import axios from "axios";

const API_URL = "http://localhost:8000/stamps/documents/";

/**
 * Fetch all documents belonging to the user.
 */
export const getDocuments = async (token) => {
  try {
    const response = await axios.get(API_URL, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data; // Adjust if your API returns data differently
  } catch (error) {
    console.error("Error fetching documents:", error);
    throw error;
  }
};

/**
 * Upload a new document.
 * @param {FormData} documentData
 * @param {string} token
 */
export const uploadDocument = async (documentData, token) => {
  try {
    const response = await axios.post(API_URL, documentData, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data; // Return the uploaded document data
  } catch (error) {
    console.error("Error uploading document:", error);
    throw error;
  }
};

/**
 * Update/replace an existing document's file (e.g., after stamping).
 * @param {number|string} documentId
 * @param {Blob|File} updatedFile
 * @param {string} token
 */
export const updateDocumentFile = async (documentId, updatedFile, token) => {
  try {
    const formData = new FormData();
    formData.append("file", updatedFile);

    // Depending on your backend, you might use PATCH or PUT. Below we assume PATCH:
    const response = await axios.patch(`${API_URL}/${documentId}/`, formData, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data; // The updated document data
  } catch (error) {
    console.error("Error updating document file:", error);
    throw error;
  }
};

export const generateQR = async (documentId, token) => {
  const response = await fetch(`http://localhost:8000/stamps/documents/${documentId}/generate_qr/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });
  if (!response.ok) {
    throw new Error("Failed to generate QR");
  }
  return response.json();
};
// Additional functions like deleteDocument, renameDocument, etc., can be added here
