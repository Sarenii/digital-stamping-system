import React, { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../Context/AuthContext"; // adjust path to your AuthContext
import Navbar from "../components/NavBar"; // adjust path to your NavBar
// If using your new documentService file:
import { getDocuments } from "../services/documentService";

const Documents = () => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionMenu, setActionMenu] = useState(null); // controls which document's menu is open
  const [newName, setNewName] = useState(""); // for renaming
  const [viewDocument, setViewDocument] = useState(null); // for viewing
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false); // for delete modal
  const [documentToDelete, setDocumentToDelete] = useState(null);

  // Auth
  const { user } = useAuth();
  const token = user?.accessToken || localStorage.getItem("accessToken");

  useEffect(() => {
    const fetchDocuments = async () => {
      if (!token) {
        setError("No access token found. Please log in.");
        return;
      }
      setLoading(true);
      try {
        // Using the getDocuments function from documentService:
        const data = await getDocuments(token);

        // If your backend returns { results: [...] }, adjust as needed:
        if (data.results) {
          setDocuments(data.results);
        } else {
          // If the data is an array directly, you can do: setDocuments(data);
          // Or if data is an object with documents in a different key, adjust.
          setDocuments(data);
        }
      } catch (error) {
        console.error("Error fetching documents:", error);
        setError("Error fetching documents. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchDocuments();
  }, [token]);

  const handleMenuClick = (documentId) => {
    // toggle the menu
    setActionMenu(documentId === actionMenu ? null : documentId);
  };

  const handleRename = async (documentId) => {
    if (!newName) return;
    try {
      // Using axios directly for rename (adjust endpoint as needed):
      await axios.patch(
        `http://localhost:8000/stamps/documents/${documentId}/`,
        { title: newName },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setDocuments((prevDocs) =>
        prevDocs.map((doc) =>
          doc.id === documentId ? { ...doc, title: newName } : doc
        )
      );
      setActionMenu(null);
    } catch (error) {
      console.error("Error renaming document:", error);
      setError("Error renaming document. Please try again.");
    }
  };

  const handleDelete = async () => {
    try {
      await axios.delete(
        `http://localhost:8000/stamps/documents/${documentToDelete.id}/`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setDocuments((prevDocs) =>
        prevDocs.filter((doc) => doc.id !== documentToDelete.id)
      );
      setIsDeleteModalOpen(false);
    } catch (error) {
      console.error("Error deleting document:", error);
      setError("Error deleting document. Please try again.");
    }
  };

  const handleView = (document) => {
    setViewDocument(document);
  };

  const closeViewModal = () => {
    setViewDocument(null);
  };

  return (
    <div className="p-6">
      <Navbar />
      <h2 className="text-xl font-bold mb-4">My Documents</h2>
      {loading && <p>Loading documents...</p>}
      {error && <p className="text-red-500">{error}</p>}
      {!loading && !error && documents.length === 0 && (
        <p>No documents available. Please upload or save a document to begin.</p>
      )}
      <div className="overflow-x-auto">
        <table className="min-w-full table-auto border-collapse">
          <thead>
            <tr>
              <th className="border p-2">Document Name</th>
              <th className="border p-2">Uploaded By</th>
              <th className="border p-2">Created At</th>
              <th className="border p-2">Version</th>
              <th className="border p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {documents.map((document) => {
              // Fall back to "Unknown" file name if needed
              const fileName = document.file
                ? document.file.split("/").pop()
                : "No filename";
              return (
                <tr key={document.id}>
                  <td className="border p-2">
                    {document.title || fileName}
                  </td>
                  <td className="border p-2">
                    {document.metadata?.uploaded_by || "Unknown"}
                  </td>
                  <td className="border p-2">
                    {new Date(document.created_at).toLocaleString()}
                  </td>
                  <td className="border p-2">{document.version}</td>
                  <td className="border p-2">
                    <div className="relative">
                      <button
                        onClick={() => handleMenuClick(document.id)}
                        className="text-gray-500 hover:text-gray-700"
                      >
                        &#8226;&#8226;&#8226;
                      </button>
                      {actionMenu === document.id && (
                        <div className="absolute right-0 mt-2 bg-white shadow-lg rounded-md w-40 z-10">
                          <div
                            onClick={() => handleView(document)}
                            className="py-2 px-4 cursor-pointer hover:bg-gray-100"
                          >
                            View
                          </div>
                          <div
                            onClick={() => {
                              const name = prompt(
                                "Enter new name:",
                                document.title || fileName
                              );
                              if (name) {
                                setNewName(name);
                                handleRename(document.id);
                              }
                            }}
                            className="py-2 px-4 cursor-pointer hover:bg-gray-100"
                          >
                            Rename
                          </div>
                          <div
                            onClick={() => {
                              setDocumentToDelete(document);
                              setIsDeleteModalOpen(true);
                            }}
                            className="py-2 px-4 cursor-pointer hover:bg-gray-100 text-red-500"
                          >
                            Delete
                          </div>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* View Document Modal */}
      {viewDocument && (
        <div className="fixed inset-0 flex items-center justify-center bg-gray-800 bg-opacity-50">
          <div className="bg-white p-6 rounded-lg w-96">
            <h3 className="text-xl font-bold mb-4">Document Details</h3>
            <p>
              <strong>Title:</strong>{" "}
              {viewDocument.title || "Untitled"}
            </p>
            <p>
              <strong>Uploaded By:</strong>{" "}
              {viewDocument.metadata?.uploaded_by || "Unknown"}
            </p>
            <p>
              <strong>Created At:</strong>{" "}
              {new Date(viewDocument.created_at).toLocaleString()}
            </p>
            <p>
              <strong>Version:</strong> {viewDocument.version}
            </p>
            {viewDocument.file && (
              <p>
                <strong>File:</strong>{" "}
                <a
                  href={viewDocument.file}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary"
                >
                  View File
                </a>
              </p>
            )}

            <button
              onClick={closeViewModal}
              className="mt-4 bg-red-500 text-white py-2 px-4 rounded-md hover:bg-red-600"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Delete Document Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-gray-800 bg-opacity-50">
          <div className="bg-white p-6 rounded-lg w-96">
            <h3 className="text-xl font-bold mb-4">Delete Document</h3>
            <p>Are you sure you want to delete this document?</p>
            <div className="mt-4 flex justify-between">
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="bg-gray-500 text-white py-2 px-4 rounded-md hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="bg-red-500 text-white py-2 px-4 rounded-md hover:bg-red-600"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Documents;
