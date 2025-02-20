// src/services/documentService.js
import axios from "axios";
import api from "./api";


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
// Create a new Document (stamped=false, raw file)
export const uploadDocument = async (formData, token) => {
  const response = await api.post("stamps/documents/", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data; // includes document {id, serial_number, stamped=false, etc.}
};

// Overwrite the Document's file field with final stamped PDF => sets stamped=true
export const updateDocumentFile = async (documentId, pdfBlob, token) => {
  const finalForm = new FormData();
  finalForm.append("file", pdfBlob, "stamped.pdf");

  // Perform a PUT request => /documents/<documentId>/
  const response = await api.put(`/stamps/documents/${documentId}/`, finalForm, {
    headers: {
      "Content-Type": "multipart/form-data",
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data; 
};

// Generate a QR code for the doc
export const generateQR = async (documentId, token) => {
  const response = await api.post(`/stamps/documents/${documentId}/generate_qr/`, null, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data; // {qr_base64: "..."}
};
// Additional functions like deleteDocument, renameDocument, etc., can be added here

