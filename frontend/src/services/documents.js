// src/services/documents.js
import axios from "axios";

const API_URL = "http://127.0.0.1:8000/stamps";  // Replace with your actual API base URL

export const getDocuments = async () => {
  try {
    const response = await axios.get(`${API_URL}/documents`);
    return response.data;
  } catch (error) {
    throw new Error("Error fetching documents");
  }
};

export const createDocument = async (document) => {
  try {
    const formData = new FormData();
    formData.append("file", document);  // Assuming you are uploading a file
    const response = await axios.post(`${API_URL}/documents`, formData);
    return response.data;
  } catch (error) {
    throw new Error("Error creating document");
  }
};

export const deleteDocument = async (id) => {
  try {
    await axios.delete(`${API_URL}/documents/${id}`);
  } catch (error) {
    throw new Error("Error deleting document");
  }
};

export const applyStampToDocument = async (docId, stampId) => {
  try {
    await axios.post(`${API_URL}/documents/${docId}/apply_stamp`, { stampId });
  } catch (error) {
    throw new Error("Error applying stamp to document");
  }
};
