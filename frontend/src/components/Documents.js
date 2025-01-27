import React, { useState, useEffect } from "react";
import { useAuth } from "../Context/AuthContext"; // Import useAuth hook
import { getDocuments, createDocument, deleteDocument, applyStampToDocument } from "../services/documents";

const Documents = () => {
  const [documents, setDocuments] = useState([]);
  const [newDocument, setNewDocument] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  
  // Access the token from context
  const { getAccessToken } = useAuth();

  // Fetch documents when the component mounts
  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        const token = getAccessToken();
        const docs = await getDocuments(token);  // Pass token to API call
        setDocuments(docs);
      } catch (error) {
        console.error("Error fetching documents: ", error);
      }
    };

    fetchDocuments();
  }, [getAccessToken]); // Re-run when getAccessToken changes

  // Handle document creation
  const handleCreateDocument = async () => {
    if (!newDocument) return;

    setIsUploading(true);
    try {
      const token = getAccessToken();
      const doc = await createDocument(newDocument, token); // Pass token to API call
      setDocuments([...documents, doc]);
      setNewDocument(null); // Reset input field
    } catch (error) {
      console.error("Error creating document: ", error);
    } finally {
      setIsUploading(false);
    }
  };

  // Handle document deletion
  const handleDeleteDocument = async (id) => {
    try {
      const token = getAccessToken();
      await deleteDocument(id, token);  // Pass token to API call
      setDocuments(documents.filter((doc) => doc.id !== id));
    } catch (error) {
      console.error("Error deleting document: ", error);
    }
  };

  // Handle applying a stamp to a document
  const handleApplyStamp = async (docId, stampId) => {
    try {
      const token = getAccessToken();
      await applyStampToDocument(docId, stampId, token);  // Pass token to API call
      const updatedDocs = await getDocuments(token);  // Fetch updated documents
      setDocuments(updatedDocs);
    } catch (error) {
      console.error("Error applying stamp: ", error);
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold">Document Management</h2>
      <div className="my-4">
        <input
          type="file"
          onChange={(e) => setNewDocument(e.target.files[0])}
          className="border p-2 my-2"
        />
        <button
          onClick={handleCreateDocument}
          disabled={isUploading || !newDocument}
          className={`bg-primary text-white px-4 py-2 rounded ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {isUploading ? "Uploading..." : "Upload Document"}
        </button>
      </div>
      <div className="mt-6">
        <h3 className="text-lg font-medium">Documents List</h3>
        <ul>
          {documents.map((doc) => (
            <li key={doc.id} className="flex justify-between items-center py-2">
              <span>{doc.name}</span>
              <div>
                <button
                  onClick={() => handleDeleteDocument(doc.id)}
                  className="bg-red-500 text-white px-3 py-1 rounded mr-2"
                >
                  Delete
                </button>
                <button
                  onClick={() => handleApplyStamp(doc.id, doc.stampId)}
                  className="bg-accent text-white px-3 py-1 rounded"
                >
                  Apply Stamp
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default Documents;
