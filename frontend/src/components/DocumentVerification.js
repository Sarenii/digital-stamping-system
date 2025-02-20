// src/components/DocumentVerification.js

import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../Context/AuthContext";
import NavBar from "./NavBar";
import * as pdfjsLib from "pdfjs-dist";
import pdfjsWorker from "pdfjs-dist/legacy/build/pdf.worker.min.js";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

const DocumentVerification = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isPdf, setIsPdf] = useState(false);

  // For success/error modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const [modalIsError, setModalIsError] = useState(false);

  // Webcam Refs
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const { user } = useAuth();
  const token = user?.accessToken || localStorage.getItem("accessToken");

  // Start the webcam automatically if needed
  useEffect(() => {
    if (videoRef.current && !videoRef.current.srcObject) {
      startWebcam();
    }
  }, []);

  // -------------- File Upload --------------
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setSelectedFile(file);
    if (!file) return;

    // If it's PDF, show first-page preview
    if (file.type === "application/pdf") {
      setIsPdf(true);
      createPdfPreview(file);
    } else {
      setIsPdf(false);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const createPdfPreview = (file) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      const pdfData = new Uint8Array(e.target.result);
      const pdfDoc = await pdfjsLib.getDocument(pdfData).promise;
      const page = await pdfDoc.getPage(1);
      const scale = 1.0;
      const viewport = page.getViewport({ scale });
      const canvasEl = document.createElement("canvas");
      const ctx = canvasEl.getContext("2d");

      canvasEl.height = viewport.height;
      canvasEl.width = viewport.width;
      await page.render({ canvasContext: ctx, viewport }).promise;
      setPreviewUrl(canvasEl.toDataURL());
    };
    reader.readAsArrayBuffer(file);
  };

  // -------------- Webcam Logic --------------
  const startWebcam = () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      console.log("No webcam support");
      return;
    }
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: "environment" } })
      .then((stream) => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      })
      .catch((err) => {
        console.error("Error accessing webcam:", err);
      });
  };

  const captureImageFromWebcam = () => {
    if (!videoRef.current || !canvasRef.current) return;
    canvasRef.current.width = videoRef.current.videoWidth;
    canvasRef.current.height = videoRef.current.videoHeight;
    const ctx = canvasRef.current.getContext("2d");
    ctx.drawImage(videoRef.current, 0, 0);
    const dataUrl = canvasRef.current.toDataURL("image/png");
    verifyDocument(dataUrl);
  };

  // Convert dataURL to a blob
  const dataURLToBlob = (dataUrl) => {
    const arr = dataUrl.split(",");
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
  };

  // -------------- Verification --------------
  const verifyDocument = async (imageDataUrl = null) => {
    if (!token) {
      openModal("You must be logged in to verify documents.", true);
      return;
    }

    const formData = new FormData();
    if (imageDataUrl) {
      // We have an image from webcam
      const blob = dataURLToBlob(imageDataUrl);
      formData.append("file", blob, "scanned.png");
    } else if (selectedFile) {
      // We have a user-uploaded file
      formData.append("file", selectedFile);
    } else {
      openModal("No file or scanned image to verify.", true);
      return;
    }

    try {
      const res = await axios.post(
        "http://localhost:8000/stamps/documents/verify-document/",
        formData,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const { status, isVerified, message } = res.data;
      if (status === "valid") {
        openModal(message || "Document is authentic!", false);
      } else if (status === "invalid") {
        openModal(message || "Document is not recognized or is altered.", true);
      } else if (status === "error") {
        openModal(message || "An error occurred during verification.", true);
      } else {
        // fallback
        openModal("Unexpected response from server.", true);
      }
    } catch (err) {
      console.error("Verification error:", err);
      openModal("Failed to verify document. Please try again.", true);
    }
  };

  // -------------- Modal Logic --------------
  const openModal = (msg, isError) => {
    setModalMessage(msg);
    setModalIsError(isError);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setModalMessage("");
  };

  // -------------- UI --------------
  return (
    <>
      <NavBar />
      <div className="min-h-screen bg-gray-50 p-6 max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold mb-6 text-center">Document Verification</h2>

        {/* File Upload */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">
            Upload Document (PDF or Image)
          </label>
          <input
            type="file"
            accept="application/pdf,image/*"
            onChange={handleFileChange}
            className="p-2 border"
          />
          {previewUrl && (
            <div className="mt-4">
              {isPdf ? (
                <div>
                  <p className="text-gray-600 text-sm">PDF Preview (Page 1):</p>
                  <img
                    src={previewUrl}
                    alt="PDF Preview"
                    className="border border-gray-300 max-w-full"
                  />
                </div>
              ) : (
                <img
                  src={previewUrl}
                  alt="File Preview"
                  className="border border-gray-300 max-w-full"
                />
              )}
            </div>
          )}
          <button
            onClick={() => verifyDocument()}
            className="mt-3 px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Verify Uploaded
          </button>
        </div>

        <hr className="my-6" />

        {/* Webcam */}
        <div className="mb-4">
          <p className="block text-sm font-medium mb-2">Or Scan QR Code via Webcam</p>
          <video
            ref={videoRef}
            width="320"
            height="240"
            autoPlay
            className="bg-black border border-gray-300"
          />
          <canvas
            ref={canvasRef}
            style={{ display: "none" }}
          />
          <div className="mt-3 space-x-3">
            <button
              onClick={startWebcam}
              className="px-5 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Start Webcam
            </button>
            <button
              onClick={captureImageFromWebcam}
              className="px-5 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Capture & Verify
            </button>
          </div>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded shadow-lg max-w-md w-full">
            <h2
              className={`text-lg font-semibold mb-4 ${
                modalIsError ? "text-red-600" : "text-green-600"
              }`}
            >
              {modalIsError ? "Verification Issue" : "Verification Success"}
            </h2>
            <p className="mb-4">{modalMessage}</p>
            <button
              onClick={closeModal}
              className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default DocumentVerification;
