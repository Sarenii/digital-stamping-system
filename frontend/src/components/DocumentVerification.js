import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../Context/AuthContext';
import NavBar from './NavBar';
import * as pdfjsLib from 'pdfjs-dist';

const DocumentVerification = () => {
  const [document, setDocument] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [verificationStatus, setVerificationStatus] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [isVerified, setIsVerified] = useState(false);
  const [isPdf, setIsPdf] = useState(false);  // Track if the document is a PDF

  const { user } = useAuth();
  const token = user?.accessToken || localStorage.getItem('accessToken');

  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  // Handle file upload
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setDocument(file);
      setIsPdf(file.type === 'application/pdf');
      setPreviewUrl(URL.createObjectURL(file)); // Show preview of uploaded file
      if (file.type === 'application/pdf') {
        previewPdf(file);  // Preview the PDF
      }
    }
  };

  // Preview PDF file (render the first page)
  const previewPdf = (file) => {
    const fileReader = new FileReader();
    fileReader.onload = (e) => {
      const pdfData = new Uint8Array(e.target.result);
      pdfjsLib.getDocument(pdfData).promise.then((pdf) => {
        pdf.getPage(1).then((page) => {
          const canvas = document.createElement('canvas');
          const context = canvas.getContext('2d');
          const viewport = page.getViewport({ scale: 1.5 });
          canvas.height = viewport.height;
          canvas.width = viewport.width;
          page.render({ canvasContext: context, viewport: viewport }).promise.then(() => {
            setPreviewUrl(canvas.toDataURL());  // Set the preview URL
          });
        });
      });
    };
    fileReader.readAsArrayBuffer(file);
  };

  // Start webcam for scanning
  const startWebcam = () => {
    if (videoRef.current) {
      navigator.mediaDevices
        .getUserMedia({ video: { facingMode: 'environment' } })
        .then((stream) => {
          videoRef.current.srcObject = stream;
        })
        .catch((err) => {
          console.error('Error accessing webcam:', err);
          setErrorMessage('Unable to access webcam.');
        });
    }
  };

  // Capture image from webcam
  const captureImage = () => {
    if (canvasRef.current && videoRef.current) {
      const context = canvasRef.current.getContext('2d');
      context.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);
      const imageData = canvasRef.current.toDataURL('image/jpeg');
      handleVerifyDocument(imageData);  // Use handleVerifyDocument here to verify the scanned image
    }
  };

  // Handle document verification for both uploaded file and scanned image
  const handleVerifyDocument = async (imageData = null) => {
    if (!document && !imageData) {
      setErrorMessage('Please upload or scan a document first.');
      return;
    }
    if (!token) {
      setErrorMessage('You must be logged in to verify documents.');
      return;
    }

    const formData = new FormData();
    if (document) {
      formData.append('file', document);
    } else if (imageData) {
      const byteArray = dataURItoBlob(imageData);
      formData.append('file', byteArray);
    }

    try {
      const response = await axios.post(
        'http://localhost:8000/stamps/documents/verify-document/', // Your backend API
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setVerificationStatus(response.data.status);
      setIsVerified(response.data.isVerified);
      setErrorMessage('');
    } catch (error) {
      console.error(error);
      setErrorMessage('Error verifying document. Please try again.');
    }
  };

  // Helper function to convert data URI to blob for scanning images
  const dataURItoBlob = (dataURI) => {
    const byteString = atob(dataURI.split(',')[1]);
    const arrayBuffer = new ArrayBuffer(byteString.length);
    const uintArray = new Uint8Array(arrayBuffer);
    for (let i = 0; i < byteString.length; i++) {
      uintArray[i] = byteString.charCodeAt(i);
    }
    return new Blob([uintArray], { type: 'image/jpeg' });
  };

  useEffect(() => {
    // Make sure videoRef and canvasRef are available
    if (videoRef.current && !videoRef.current.srcObject) {
      startWebcam();  // Start the webcam when component mounts
    }
  }, []);

  return (
    <>
      <NavBar />
      <div className="min-h-screen bg-gray-50 p-6 max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold mb-6 text-center">Document Verification</h2>

        {/* File Upload Section */}
        <div className="mb-4">
          <input
            type="file"
            onChange={handleFileUpload}
            className="w-full p-3 border-2 border-gray-300 rounded-md"
            accept="image/*,application/pdf"
          />
        </div>

        {/* Display Preview of Uploaded File */}
        {previewUrl && (
          <div className="mb-6">
            {isPdf ? (
              <img
                src={previewUrl}
                alt="Document Preview"
                className="max-w-full h-auto mx-auto border border-gray-300 rounded-md"
              />
            ) : (
              <img
                src={previewUrl}
                alt="Document Preview"
                className="max-w-full h-auto mx-auto border border-gray-300 rounded-md"
              />
            )}
          </div>
        )}

        {/* Webcam and Image Capture Section */}
        <div className="mb-6">
          <button
            onClick={startWebcam}
            className="px-6 py-3 bg-green-500 text-white rounded-md hover:bg-green-600 transition"
          >
            Start Scanning Document
          </button>
        </div>
        <div className="mb-6 flex justify-center">
          <video ref={videoRef} width="320" height="240" autoPlay></video>
        </div>
        <div className="mb-6 flex justify-center">
          <canvas ref={canvasRef} width="320" height="240" style={{ display: 'none' }}></canvas>
        </div>
        <div className="mb-6 flex justify-center">
          <button
            onClick={captureImage}
            className="px-6 py-3 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition"
          >
            Capture Image from Scan
          </button>
        </div>

        {/* Verification Button */}
        <div className="flex justify-center mb-6">
          <button
            onClick={() => handleVerifyDocument()}
            className="px-6 py-3 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition"
          >
            Verify Document
          </button>
        </div>

        {/* Display Verification Results */}
        {verificationStatus && (
          <div
            className={`p-4 rounded-md ${isVerified ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}
          >
            <h3 className="font-semibold">
              {isVerified ? 'Document Verified Successfully!' : 'Document Verification Failed'}
            </h3>
            <p>{verificationStatus}</p>
          </div>
        )}

        {/* Error Message */}
        {errorMessage && (
          <div className="mt-6 p-4 bg-red-100 text-red-700 rounded-md">
            <strong>Error:</strong> {errorMessage}
          </div>
        )}
      </div>
    </>
  );
};

export default DocumentVerification;
