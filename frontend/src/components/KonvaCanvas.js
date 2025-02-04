import React, { useState, useEffect, useRef, forwardRef } from "react";
import { Stage, Layer, Image as KonvaImage } from "react-konva";
import * as pdfjsLib from "pdfjs-dist";
import pdfWorker from "pdfjs-dist/legacy/build/pdf.worker.min.js";
import { v4 as uuidv4 } from "uuid";
import StampComponent from "./StampComponent";
import StampModal from "./StampModal";
import { jsPDF } from "jspdf";
import { saveAs } from "file-saver";

// Service functions for doc upload/update, plus your new QR endpoint
import { uploadDocument, updateDocumentFile, generateQR } from "../services/documentService";
import { useAuth } from "../Context/AuthContext";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

const A4_WIDTH = 595; // PDF points for A4
const A4_HEIGHT = 842;

const KonvaCanvas = forwardRef((props, ref) => {
  // Pages of the PDF (converted to <img> for preview)
  const [pages, setPages] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [zoom, setZoom] = useState(1);

  // Track doc ID from backend
  const [documentId, setDocumentId] = useState(null);

  // Whether a doc is loaded
  const [isDocumentUploaded, setIsDocumentUploaded] = useState(false);

  // Array of stamps (Circle, Square, Star, or QR)
  const [stampsOnPdf, setStampsOnPdf] = useState([]);

  // For adding a new stamp
  const [selectedStampData, setSelectedStampData] = useState(null);
  const [isAddingStamp, setIsAddingStamp] = useState(false);

  // Download/Save UI
  const [showDownloadOptions, setShowDownloadOptions] = useState(false);

  // Stamp Modal
  const [stampModalOpen, setStampModalOpen] = useState(false);

  // Refs
  const stageRef = useRef(null);
  const scrollContainerRef = useRef(null);

  // Auth
  const { user } = useAuth();
  const token = user?.accessToken || localStorage.getItem("accessToken");

  useEffect(() => {
    // Expose an uploadDocument function to parent
    if (ref) {
      ref.current = {
        uploadDocument: async (file) => {
          if (!token) {
            alert("You must be logged in to upload documents.");
            return;
          }
          // 1) Load file for preview
          await loadDocumentIntoCanvas(file);
          // 2) Upload to backend
          try {
            const formData = new FormData();
            formData.append("file", file);
            const result = await uploadDocument(formData, token);
            setDocumentId(result.id);
          } catch (err) {
            console.error("Error uploading document to backend:", err);
          }
        },
      };
    }
  }, [ref, token]);

  /**
   * Loads PDF or image into pages[] for Konva preview
   */
  const loadDocumentIntoCanvas = async (file) => {
    const fileType = file.type;

    if (fileType.startsWith("image/")) {
      // If the file is an image
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new window.Image();
        img.src = e.target.result;
        img.onload = () => {
          setPages([img]);
          setIsDocumentUploaded(true);
        };
      };
      reader.readAsDataURL(file);
    } else if (fileType === "application/pdf") {
      // If file is PDF
      const reader = new FileReader();
      reader.onload = async (e) => {
        const pdf = await pdfjsLib.getDocument(e.target.result).promise;
        const pageImages = [];
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const viewport = page.getViewport({ scale: 1 });
          const canvasEl = document.createElement("canvas");
          const context = canvasEl.getContext("2d");

          canvasEl.width = A4_WIDTH;
          canvasEl.height = A4_HEIGHT;

          const scale = Math.min(
            A4_WIDTH / viewport.width,
            A4_HEIGHT / viewport.height
          );
          const scaledViewport = page.getViewport({ scale });
          canvasEl.width = scaledViewport.width;
          canvasEl.height = scaledViewport.height;

          await page.render({
            canvasContext: context,
            viewport: scaledViewport,
          }).promise;

          const img = new window.Image();
          img.src = canvasEl.toDataURL();
          await new Promise((resolve) => {
            img.onload = () => {
              pageImages.push(img);
              resolve();
            };
          });
        }
        setPages(pageImages);
        setIsDocumentUploaded(true);
      };
      reader.readAsArrayBuffer(file);
    } else {
      alert("Unsupported file type.");
    }
  };

  /**
   * Called when user picks a stamp from the StampModal
   */
  const handleCreateStamp = (stampData) => {
    const newStamp = {
      ...stampData,
      id: uuidv4(),
      x: 100,
      y: 100,
      pageIndex: currentPage - 1,
    };
    setSelectedStampData(newStamp);
    setIsAddingStamp(true);
  };

  /**
   * Stage click => place stamp if in 'adding' mode
   */
  const handleStageClick = (e) => {
    if (isAddingStamp && selectedStampData) {
      const { x, y } = e.target.getStage().getPointerPosition();
      setStampsOnPdf((prev) => [
        ...prev,
        {
          ...selectedStampData,
          id: uuidv4(),
          x,
          y,
        },
      ]);
      setIsAddingStamp(false);
      setSelectedStampData(null);
    }
  };

  /**
   * Generate QR from backend, then create a "QR" stamp
   */
  const handleGenerateQR = async () => {
    if (!documentId) {
      alert("No document to generate a QR for. Please upload first.");
      return;
    }
    try {
      // Call your backend endpoint e.g. /documents/:id/generate_qr
      // We'll assume you have a function generateQR(documentId, token)
      const { qr_base64 } = await generateQR(documentId, token);

      // Convert base64 to an <img> object
      const qrImg = new window.Image();
      qrImg.src = `data:image/png;base64,${qr_base64}`;
      qrImg.onload = () => {
        // Create a new stamp with shape= 'QR'
        const newStamp = {
          id: uuidv4(),
          shape: "QR",
          qrImage: qrImg, // the image object for Konva to render
          x: 100,
          y: 100,
          pageIndex: currentPage - 1,
        };
        setStampsOnPdf((prev) => [...prev, newStamp]);
      };
    } catch (error) {
      console.error("Error generating QR code:", error);
      alert("Failed to generate QR code.");
    }
  };

  /**
   * Delete a stamp
   */
  const handleDeleteStamp = (stampId) => {
    setStampsOnPdf((prev) => prev.filter((s) => s.id !== stampId));
  };

  /**
   * When a stamp is dragged, update coords
   */
  const handleStampDragEnd = (stampId, newX, newY) => {
    setStampsOnPdf((prevStamps) =>
      prevStamps.map((stamp) =>
        stamp.id === stampId ? { ...stamp, x: newX, y: newY } : stamp
      )
    );
  };

  /**
   * Zoom in/out
   */
  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.1, 3));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.1, 0.5));

  /**
   * Track scroll => set current page
   */
  const handleScroll = () => {
    const container = scrollContainerRef.current;
    if (container) {
      const scrollTop = container.scrollTop;
      const pageHeight = A4_HEIGHT * zoom;
      const pageNumber = Math.floor(scrollTop / pageHeight) + 1;
      setCurrentPage(pageNumber);
    }
  };

  /**
   * Rebuild an unzoomed PDF with stamps
   */
  const buildFinalPdf = () => {
    const doc = new jsPDF({ unit: "pt", format: [A4_WIDTH, A4_HEIGHT] });

    pages.forEach((pageImage, pageIndex) => {
      const canvasEl = document.createElement("canvas");
      canvasEl.width = A4_WIDTH;
      canvasEl.height = A4_HEIGHT;
      const ctx = canvasEl.getContext("2d");

      // draw the page background
      ctx.drawImage(pageImage, 0, 0, A4_WIDTH, A4_HEIGHT);

      // draw stamps for this page
      const stampsForPage = stampsOnPdf.filter((s) => s.pageIndex === pageIndex);
      stampsForPage.forEach((stamp) => {
        drawStampOnCanvas(ctx, stamp);
      });

      const pageDataUrl = canvasEl.toDataURL("image/jpeg", 1.0);
      if (pageIndex > 0) doc.addPage();
      doc.addImage(pageDataUrl, "JPEG", 0, 0, A4_WIDTH, A4_HEIGHT);
    });

    return doc;
  };

  /**
   * drawStampOnCanvas => for shape= 'QR', draw the QR image
   */
  const drawStampOnCanvas = (ctx, stamp) => {
    // If it's a normal shape (Circle, Square, Star),
    // we do the old approach. If it's "QR", we draw the image.
    const size = 120;
    const { x, y, shape } = stamp;

    // For "QR" shape
    if (shape === "QR" && stamp.qrImage) {
      ctx.drawImage(stamp.qrImage, x, y, size, size);
      return;
    }

    // Otherwise, same shape-based logic
    // star helper:
    const drawStar = (cx, cy, outerR, innerR, spikes = 5) => {
      let rot = (Math.PI / 2) * 3;
      const step = Math.PI / spikes;
      ctx.beginPath();
      for (let i = 0; i < spikes; i++) {
        let xPos = cx + Math.cos(rot) * outerR;
        let yPos = cy + Math.sin(rot) * outerR;
        ctx.lineTo(xPos, yPos);
        rot += step;
        xPos = cx + Math.cos(rot) * innerR;
        yPos = cy + Math.sin(rot) * innerR;
        ctx.lineTo(xPos, yPos);
        rot += step;
      }
      ctx.lineTo(cx, cy - outerR);
      ctx.closePath();
    };

    const { shape_color, text_color, date_color, top_text, bottom_text, date } = stamp;

    // Outer shape
    ctx.save();
    ctx.strokeStyle = "#000";
    ctx.lineWidth = 2;
    ctx.fillStyle = shape_color || "#ddd";

    if (shape === "Circle") {
      ctx.beginPath();
      ctx.arc(x + size / 2, y + size / 2, size / 2, 0, 2 * Math.PI);
      ctx.fill();
      ctx.stroke();
    } else if (shape === "Square") {
      ctx.beginPath();
      ctx.rect(x, y, size, size);
      ctx.fill();
      ctx.stroke();
    } else if (shape === "Star") {
      drawStar(x + size / 2, y + size / 2, size / 2, size / 4, 5);
      ctx.fill();
      ctx.stroke();
    }

    // Inner shape
    ctx.fillStyle = "#fff";
    ctx.strokeStyle = "transparent";
    const innerOffset = size / 6;
    const innerSize = (size * 2) / 3;

    if (shape === "Circle") {
      ctx.beginPath();
      ctx.arc(
        x + size / 2,
        y + size / 2,
        innerSize / 2,
        0,
        2 * Math.PI
      );
      ctx.fill();
    } else if (shape === "Square") {
      ctx.beginPath();
      ctx.rect(x + innerOffset, y + innerOffset, innerSize, innerSize);
      ctx.fill();
    } else if (shape === "Star") {
      drawStar(
        x + size / 2,
        y + size / 2,
        innerSize / 2,
        innerSize / 4,
        5
      );
      ctx.fill();
    }

    // Text inside
    ctx.fillStyle = text_color || "#000";
    ctx.font = "bold 14px Arial";
    ctx.textAlign = "center";

    if (top_text) {
      ctx.fillText(top_text, x + size / 2, y + size * 0.2);
    }
    if (date) {
      ctx.fillStyle = date_color || "#888";
      ctx.font = "12px Arial";
      ctx.fillText(date, x + size / 2, y + size * 0.55);
    }
    if (bottom_text) {
      ctx.fillStyle = text_color || "#000";
      ctx.font = "bold 14px Arial";
      ctx.fillText(bottom_text, x + size / 2, y + size * 0.8);
    }
    ctx.restore();
  };

  /**
   * Download final PDF
   */
  const handleDownload = () => {
    const finalDoc = buildFinalPdf();
    finalDoc.save("document.pdf");
  };

  /**
   * Download + also update file in backend
   */
  const handleDownloadAndSave = async () => {
    const finalDoc = buildFinalPdf();
    const pdfBlob = finalDoc.output("blob");
    saveAs(pdfBlob, "document.pdf");

    if (documentId) {
      try {
        await updateDocumentFile(documentId, pdfBlob, token);
        alert("Stamped document successfully saved to backend.");
      } catch (error) {
        console.error("Error updating document file:", error);
      }
    } else {
      alert("No documentId found. Please upload first.");
    }
  };

  /**
   * Save doc to backend, no local download
   */
  const saveDocument = async () => {
    if (!documentId) {
      alert("No document to update! Please upload first.");
      return;
    }
    const finalDoc = buildFinalPdf();
    const pdfBlob = finalDoc.output("blob");
    try {
      await updateDocumentFile(documentId, pdfBlob, token);
      alert("Stamped document saved to backend!");
    } catch (error) {
      console.error("Error saving stamped document:", error);
    }
  };

  return (
    <div className="flex-1 p-4 border-dotted border-4 border-gray-400 flex flex-col items-center">
      {/* Button to open the Stamp Modal */}
      {isDocumentUploaded && (
        <button
          onClick={() => setStampModalOpen(true)}
          className="mb-2 px-4 py-2 bg-primary text-white rounded hover:bg-primary"
        >
          Add Stamp
        </button>
      )}

      {/* OPTIONAL: Generate QR Code button */}
      {isDocumentUploaded && (
        <button
          onClick={handleGenerateQR}
          className="mb-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
        >
          Generate QR Code
        </button>
      )}

      {/* Stamp Modal */}
      <StampModal
        isOpen={stampModalOpen}
        onClose={() => setStampModalOpen(false)}
        onCreateStamp={handleCreateStamp}
      />

      {/* Download/Save Options */}
      {isDocumentUploaded && (
        <div className="w-full flex justify-between items-center bg-blue-100 p-4 rounded-t-lg shadow-md mb-2">
          <button
            onClick={() => setShowDownloadOptions(!showDownloadOptions)}
            className="px-6 py-3 bg-primary text-white rounded-md hover:bg-primary transition duration-200"
          >
            Download Options
          </button>
          {showDownloadOptions && (
            <div className="flex flex-col space-y-2 mt-2">
              <button
                onClick={handleDownload}
                className="px-6 py-2 bg-white text-gray-700 border border-gray-300 rounded-md hover:bg-gray-100 transition duration-200"
              >
                Download
              </button>
              <button
                onClick={handleDownloadAndSave}
                className="px-6 py-2 bg-white text-gray-700 border border-gray-300 rounded-md hover:bg-gray-100 transition duration-200"
              >
                Download and Save
              </button>
              <button
                onClick={saveDocument}
                className="px-6 py-2 bg-white text-gray-700 border border-gray-300 rounded-md hover:bg-gray-100 transition duration-200"
              >
                Save Document
              </button>
            </div>
          )}
        </div>
      )}

      {/* The PDF/image preview area */}
      {pages.length === 0 ? (
        <div className="text-center text-gray-500 flex-1 flex items-center justify-center">
          <p>Upload a document to view here.</p>
        </div>
      ) : (
        <div
          ref={scrollContainerRef}
          className="overflow-y-auto max-h-[70vh] w-full border flex-1"
          onScroll={handleScroll}
          style={{ backgroundColor: "white" }}
        >
          <Stage
            width={A4_WIDTH * zoom}
            height={pages.length * A4_HEIGHT * zoom}
            ref={stageRef}
            onClick={handleStageClick}
            style={{ cursor: isAddingStamp ? "crosshair" : "default" }}
          >
            <Layer>
              {pages.map((pageImage, pageIndex) => (
                <React.Fragment key={pageIndex}>
                  {/* Render each page */}
                  <KonvaImage
                    image={pageImage}
                    width={A4_WIDTH * zoom}
                    height={A4_HEIGHT * zoom}
                    x={0}
                    y={pageIndex * A4_HEIGHT * zoom}
                  />

                  {/* Render stamps for this page */}
                  {stampsOnPdf
                    .filter((stamp) => stamp.pageIndex === pageIndex)
                    .map((stamp) => (
                      <StampComponent
                        key={stamp.id}
                        id={stamp.id}
                        pageY={pageIndex * A4_HEIGHT * zoom}
                        zoom={zoom}
                        x={stamp.x}
                        y={stamp.y}
                        shape={stamp.shape}
                        shape_color={stamp.shape_color}
                        text_color={stamp.text_color}
                        date_color={stamp.date_color}
                        top_text={stamp.top_text}
                        bottom_text={stamp.bottom_text}
                        date={stamp.date}
                        qrImage={stamp.qrImage}  // pass the QR image if shape= "QR"
                        onDelete={handleDeleteStamp}
                        onDragEnd={handleStampDragEnd}
                      />
                    ))}
                </React.Fragment>
              ))}
            </Layer>
          </Stage>
        </div>
      )}

      {/* Page & Zoom controls */}
      <div className="flex justify-between items-center mt-2 w-full px-4 text-sm">
        <div className="text-gray-500">
          Page {currentPage} / {pages.length}
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={handleZoomOut}
            className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300"
          >
            Zoom Out
          </button>
          <button
            onClick={handleZoomIn}
            className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300"
          >
            Zoom In
          </button>
        </div>
      </div>
    </div>
  );
});

export default KonvaCanvas;
