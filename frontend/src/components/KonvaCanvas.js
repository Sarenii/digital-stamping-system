// src/components/KonvaCanvas.js
import React, { useState, useEffect, useRef, forwardRef } from "react";
import { Stage, Layer, Image as KonvaImage } from "react-konva";
import * as pdfjsLib from "pdfjs-dist";
import pdfWorker from "pdfjs-dist/legacy/build/pdf.worker.min.js";
import { v4 as uuidv4 } from "uuid";
import { jsPDF } from "jspdf";
import { saveAs } from "file-saver";

import StampComponent from "./StampComponent";
import StampModal from "./StampModal";
import StampVerificationModal from "./StampVerificationModal";
import MessageModal from "./MessageModal";

import { uploadDocument, updateDocumentFile, generateQR } from "../services/documentService";
import { useAuth } from "../Context/AuthContext";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

const A4_WIDTH = 595;
const A4_HEIGHT = 842;

// For shape rendering
const STAMP_SIZE = 120;
const BORDER_WIDTH = 1.5;
const RING_GAP = 15;

/**
 * Build arc text for circle shape, from startAngle to endAngle in radians
 */
function drawArcTextOnCanvas(ctx, text, centerX, centerY, radius, startAngle, endAngle, color, fontSize) {
  if (!text) return;
  const letters = text.split("");
  const arcLength = endAngle - startAngle;
  const anglePerLetter = arcLength / letters.length;

  ctx.save();
  ctx.fillStyle = color;
  ctx.font = `bold ${fontSize}px Arial`;
  ctx.textBaseline = "middle";
  ctx.textAlign = "center";

  for (let i = 0; i < letters.length; i++) {
    const char = letters[i];
    const theta = startAngle + i * anglePerLetter;
    const xPos = centerX + radius * Math.cos(theta);
    const yPos = centerY + radius * Math.sin(theta);

    ctx.save();
    ctx.translate(xPos, yPos);
    ctx.rotate(theta + Math.PI / 2);
    ctx.fillText(char, 0, 0);
    ctx.restore();
  }
  ctx.restore();
}

/**
 * Draw star shape on a given context, for the Star stamps
 */
function drawStar(ctx, size) {
  const spikes = 5;
  const outerRadius = size / 2;
  const innerRadius = size / 4;
  let rot = (Math.PI / 2) * 3;
  const step = Math.PI / spikes;
  ctx.beginPath();
  for (let i = 0; i < spikes; i++) {
    const xPos = size / 2 + Math.cos(rot) * outerRadius;
    const yPos = size / 2 + Math.sin(rot) * outerRadius;
    ctx.lineTo(xPos, yPos);
    rot += step;
    const xPos2 = size / 2 + Math.cos(rot) * innerRadius;
    const yPos2 = size / 2 + Math.sin(rot) * innerRadius;
    ctx.lineTo(xPos2, yPos2);
    rot += step;
  }
  ctx.closePath();
}

/**
 * Replicate shape logic from StampComponent for final PDF drawing
 */
function drawStampOnCanvas(ctx, stamp, showSerialNumber, docSerialNumber) {
  const size = STAMP_SIZE;
  const { x, y, shape, qrImage, shape_color, text_color, date_color, top_text, bottom_text, date } = stamp;

  // If QR, just draw the code
  if (shape === "QR" && qrImage) {
    ctx.drawImage(qrImage, x, y, size, size);
    return;
  }

  ctx.save();
  ctx.lineWidth = BORDER_WIDTH;

  if (shape === "Circle") {
    // Outer ring
    ctx.strokeStyle = shape_color;
    ctx.beginPath();
    ctx.arc(x + size / 2, y + size / 2, size / 2, 0, 2 * Math.PI);
    ctx.stroke();

    // Inner ring
    ctx.beginPath();
    ctx.arc(x + size / 2, y + size / 2, size / 2 - RING_GAP, 0, 2 * Math.PI);
    ctx.stroke();

    // arcs for top/bottom text
    const centerX = x + size / 2;
    const centerY = y + size / 2;
    const outerRadius = size / 2 - 8;

    // Top text: π to 2π
    if (top_text) {
      drawArcTextOnCanvas(
        ctx,
        top_text.toUpperCase(),
        centerX,
        centerY,
        outerRadius,
        Math.PI,
        2 * Math.PI,
        text_color,
        14
      );
    }
    // Bottom text: to avoid it spreading too widely, use ~0.2π to ~0.8π
    // You can tweak these angles slightly if needed
    if (bottom_text) {
      drawArcTextOnCanvas(
        ctx,
        bottom_text.toUpperCase(),
        centerX,
        centerY,
        outerRadius,
        0.2 * Math.PI,
        0.8 * Math.PI,
        text_color,
        14
      );
    }

    // Date in center => bold
    if (date) {
      ctx.fillStyle = date_color;
      ctx.font = "bold 12px Arial";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(date, centerX, centerY);
    }
  }
  else if (shape === "Square") {
    ctx.strokeStyle = shape_color;
    ctx.beginPath();
    ctx.rect(x, y, size, size);
    ctx.stroke();

    ctx.beginPath();
    ctx.rect(x + RING_GAP, y + RING_GAP, size - RING_GAP * 2, size - RING_GAP * 2);
    ctx.stroke();

    ctx.textAlign = "center";
    ctx.font = "bold 14px Arial";

    if (top_text) {
      ctx.fillStyle = text_color;
      ctx.fillText(top_text.toUpperCase(), x + size / 2, y + RING_GAP + 12);
    }
    if (bottom_text) {
      ctx.fillStyle = text_color;
      ctx.fillText(bottom_text.toUpperCase(), x + size / 2, y + size - (RING_GAP + 12));
    }
    if (date) {
      ctx.fillStyle = date_color;
      ctx.font = "bold 12px Arial";
      ctx.fillText(date, x + size / 2, y + size / 2);
    }
  }
  else if (shape === "Star") {
    ctx.strokeStyle = shape_color;
    ctx.beginPath();
    ctx.translate(x, y);
    drawStar(ctx, size);
    ctx.stroke();
    ctx.setTransform(1, 0, 0, 1, 0, 0);

    ctx.save();
    ctx.translate(x + RING_GAP, y + RING_GAP);
    drawStar(ctx, size - RING_GAP * 2);
    ctx.stroke();
    ctx.restore();

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = "bold 14px Arial";

    if (top_text) {
      ctx.fillStyle = text_color;
      ctx.fillText(top_text.toUpperCase(), x + size / 2, y + RING_GAP + 12);
    }
    if (bottom_text) {
      ctx.fillStyle = text_color;
      ctx.fillText(bottom_text.toUpperCase(), x + size / 2, y + size - RING_GAP - 12);
    }
    if (date) {
      ctx.fillStyle = date_color;
      ctx.font = "bold 12px Arial";
      ctx.fillText(date, x + size / 2, y + size / 2);
    }
  }

  ctx.restore();
}

const KonvaCanvas = forwardRef((props, ref) => {
  const [pages, setPages] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [zoom, setZoom] = useState(1);

  const [documentId, setDocumentId] = useState(null);
  const [isDocumentUploaded, setIsDocumentUploaded] = useState(false);
  const [stampsOnPdf, setStampsOnPdf] = useState([]);
  const [selectedStampData, setSelectedStampData] = useState(null);
  const [isAddingStamp, setIsAddingStamp] = useState(false);

  const [showDownloadOptions, setShowDownloadOptions] = useState(false);
  const [stampModalOpen, setStampModalOpen] = useState(false);

  // OTP verification if company
  const [showStampVerificationModal, setShowStampVerificationModal] = useState(false);
  const [pendingStampCoords, setPendingStampCoords] = useState(null);

  // Server-provided serial number
  const [serialNumber, setSerialNumber] = useState("");
  const [showSerialNumber, setShowSerialNumber] = useState(false);

  // For messages
  const [alertMessage, setAlertMessage] = useState("");
  const [alertType, setAlertType] = useState("info");
  const [showAlert, setShowAlert] = useState(false);

  const scrollContainerRef = useRef(null);
  const stageRef = useRef(null);

  const { user } = useAuth();
  const token = user?.accessToken || localStorage.getItem("accessToken");

  // Helper to show a message modal
  const triggerMessage = (msg, type = "info") => {
    setAlertMessage(msg);
    setAlertType(type);
    setShowAlert(true);
  };
  const closeMessage = () => {
    setShowAlert(false);
    setAlertMessage("");
  };

  // Expose uploadDocument to the parent
  useEffect(() => {
    if (ref) {
      ref.current = {
        uploadDocument: async (file) => {
          if (!token) {
            triggerMessage("You must be logged in to upload documents.", "error");
            return;
          }
          await loadDocumentIntoCanvas(file);
          try {
            const formData = new FormData();
            formData.append("file", file);
            const result = await uploadDocument(formData, token);
            setDocumentId(result.id);
            if (result.serial_number) {
              setSerialNumber(result.serial_number);
            }
            triggerMessage("Document uploaded successfully!", "success");
          } catch (err) {
            console.error("Error uploading document:", err);
            triggerMessage("Error uploading document. Please try again.", "error");
          }
        },
      };
    }
  }, [ref, token]);

  // Load doc => images
  const loadDocumentIntoCanvas = async (file) => {
    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new window.Image();
        img.src = e.target.result;
        img.onload = () => {
          setPages([img]);
          setIsDocumentUploaded(true);
          triggerMessage("Image loaded for stamping.", "success");
        };
      };
      reader.readAsDataURL(file);
    } else if (file.type === "application/pdf") {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const pdf = await pdfjsLib.getDocument(e.target.result).promise;
          const pageImages = [];
          for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const viewport = page.getViewport({ scale: 1 });
            const canvasEl = document.createElement("canvas");
            const context = canvasEl.getContext("2d");
            canvasEl.width = A4_WIDTH;
            canvasEl.height = A4_HEIGHT;

            const scale = Math.min(A4_WIDTH / viewport.width, A4_HEIGHT / viewport.height);
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
          triggerMessage("PDF loaded for stamping.", "success");
        } catch (error) {
          console.error("Failed to parse PDF:", error);
          triggerMessage("Failed to parse PDF. Please try another file.", "error");
        }
      };
      reader.readAsArrayBuffer(file);
    } else {
      triggerMessage("Unsupported file type. Please use PDF or image.", "error");
    }
  };

  // Called when user picks a stamp from StampModal
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

  // When stage is clicked => place or prompt OTP
  const handleStageClick = (e) => {
    if (!isAddingStamp || !selectedStampData) return;
    const pointer = e.target.getStage().getPointerPosition();
    if (!pointer) {
      triggerMessage("Unable to get pointer position. Try again.", "error");
      return;
    }
    const { x, y } = pointer;
    const role = (user?.role || "").toUpperCase();

    if (role === "COMPANY") {
      setPendingStampCoords({ x, y });
      setShowStampVerificationModal(true);
    } else {
      setStampsOnPdf((prev) => [
        ...prev,
        { ...selectedStampData, id: uuidv4(), x, y },
      ]);
      setIsAddingStamp(false);
      setSelectedStampData(null);
    }
  };
  const handleStageMouseDown = (e) => {
    handleStageClick(e);
  };

  // Called after OTP => place stamp
  const handleOTPVerifiedForStamp = () => {
    if (pendingStampCoords && selectedStampData) {
      setStampsOnPdf((prev) => [
        ...prev,
        {
          ...selectedStampData,
          id: uuidv4(),
          x: pendingStampCoords.x,
          y: pendingStampCoords.y,
        },
      ]);
      setIsAddingStamp(false);
      setSelectedStampData(null);
      setPendingStampCoords(null);
      setShowStampVerificationModal(false);
      triggerMessage("Stamp placed successfully!", "success");
    }
  };

  // Generate QR => place as stamp
  const handleGenerateQR = async () => {
    if (!documentId) {
      triggerMessage("No document found to generate QR for. Upload first.", "error");
      return;
    }
    try {
      const { qr_base64 } = await generateQR(documentId, token);
      const qrImg = new window.Image();
      qrImg.src = `data:image/png;base64,${qr_base64}`;
      qrImg.onload = () => {
        const newStamp = {
          id: uuidv4(),
          shape: "QR",
          qrImage: qrImg,
          x: 100,
          y: 100,
          pageIndex: currentPage - 1,
        };
        setStampsOnPdf((prev) => [...prev, newStamp]);
        triggerMessage("QR code generated and added as a stamp!", "success");
      };
    } catch (error) {
      console.error("Error generating QR code:", error);
      triggerMessage("Failed to generate QR code. Please try again.", "error");
    }
  };

  // Deleting a stamp
  const handleDeleteStamp = (stampId) => {
    setStampsOnPdf((prev) => prev.filter((s) => s.id !== stampId));
    triggerMessage("Stamp deleted.", "info");
  };

  // Drag end => update coords
  const handleStampDragEnd = (stampId, newX, newY) => {
    setStampsOnPdf((prev) =>
      prev.map((s) => (s.id === stampId ? { ...s, x: newX, y: newY } : s))
    );
  };

  // Zoom
  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.1, 3));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.1, 0.5));

  const handleScroll = () => {
    const container = scrollContainerRef.current;
    if (!container) return;
    const scrollTop = container.scrollTop;
    const pageHeight = A4_HEIGHT * zoom;
    const pageNumber = Math.floor(scrollTop / pageHeight) + 1;
    setCurrentPage(pageNumber);
  };

  // Build final PDF
  const buildFinalPdf = () => {
    const doc = new jsPDF({ unit: "pt", format: [A4_WIDTH, A4_HEIGHT] });
    pages.forEach((pageImage, pageIndex) => {
      const canvasEl = document.createElement("canvas");
      canvasEl.width = A4_WIDTH;
      canvasEl.height = A4_HEIGHT;
      const ctx = canvasEl.getContext("2d");
      ctx.drawImage(pageImage, 0, 0, A4_WIDTH, A4_HEIGHT);

      const stampsForPage = stampsOnPdf.filter((s) => s.pageIndex === pageIndex);
      stampsForPage.forEach((stamp) => {
        drawStampOnCanvas(ctx, stamp, showSerialNumber, serialNumber);
      });

      // If "Show SerialNumber"
      if (serialNumber && showSerialNumber) {
        ctx.save();
        ctx.fillStyle = "#000";
        ctx.font = "bold 12px Arial";
        ctx.textAlign = "right";
        ctx.fillText(`Serial No: ${serialNumber}`, A4_WIDTH - 10, A4_HEIGHT - 10);
        ctx.restore();
      }

      const pageDataUrl = canvasEl.toDataURL("image/jpeg", 1.0);
      if (pageIndex > 0) doc.addPage();
      doc.addImage(pageDataUrl, "JPEG", 0, 0, A4_WIDTH, A4_HEIGHT);
    });
    return doc;
  };

  // Download local
  const handleDownload = () => {
    const doc = buildFinalPdf();
    doc.save("document.pdf");
    triggerMessage("Document downloaded locally.", "success");
  };

  // Download + also update in backend
  const handleDownloadAndSave = async () => {
    const doc = buildFinalPdf();
    const pdfBlob = doc.output("blob");
    saveAs(pdfBlob, "document.pdf");

    if (!documentId) {
      triggerMessage("No document to save. Please upload first.", "error");
      return;
    }
    try {
      await updateDocumentFile(documentId, pdfBlob, token);
      triggerMessage("Stamped doc saved & downloaded.", "success");
    } catch (error) {
      console.error("Error updating doc file:", error);
      triggerMessage("Failed to save doc to backend. Please try again.", "error");
    }
  };

  const saveDocument = async () => {
    if (!documentId) {
      triggerMessage("No document to update! Please upload first.", "error");
      return;
    }
    const doc = buildFinalPdf();
    const pdfBlob = doc.output("blob");
    try {
      await updateDocumentFile(documentId, pdfBlob, token);
      triggerMessage("Stamped document saved to backend!", "success");
    } catch (error) {
      console.error("Error saving doc:", error);
      triggerMessage("Failed to save doc to backend. Please try again.", "error");
    }
  };

  // Toggling the "show serial number"
  const toggleSerialNumber = () => {
    setShowSerialNumber(!showSerialNumber);
    if (!showSerialNumber) {
      triggerMessage("Serial number will be displayed on the final PDF.", "info");
    } else {
      triggerMessage("Serial number display disabled.", "info");
    }
  };

  return (
    <div className="flex-1 p-4 border-dotted border-4 border-gray-400 flex flex-col items-center relative">
      {isDocumentUploaded && (
        <div className="flex items-center space-x-3 mb-4">
          <button
            onClick={() => setStampModalOpen(true)}
            className="px-4 py-2 bg-primary text-white rounded hover:bg-primary"
          >
            Add Stamp
          </button>

          <button
            onClick={handleGenerateQR}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Generate QR Code
          </button>

          {/* Toggle Serial # with a button */}
          <button
            onClick={toggleSerialNumber}
            className="px-4 py-2 bg-blue-400 text-white rounded hover:bg-blue-500"
          >
            {showSerialNumber ? "Hide Serial Number" : "Show Serial Number"}
          </button>
        </div>
      )}

      {/* Stamp Modal */}
      <StampModal
        isOpen={stampModalOpen}
        onClose={() => setStampModalOpen(false)}
        onCreateStamp={handleCreateStamp}
      />

      {/* Download Options */}
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
            onMouseDown={handleStageMouseDown}
            style={{ cursor: isAddingStamp ? "crosshair" : "default" }}
          >
            <Layer>
              {pages.map((pageImage, pageIndex) => (
                <React.Fragment key={pageIndex}>
                  <KonvaImage
                    image={pageImage}
                    width={A4_WIDTH * zoom}
                    height={A4_HEIGHT * zoom}
                    x={0}
                    y={pageIndex * A4_HEIGHT * zoom}
                  />
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
                        qrImage={stamp.qrImage}
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

      {pages.length > 0 && (
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
      )}

      <StampVerificationModal
        isOpen={showStampVerificationModal}
        onClose={() => setShowStampVerificationModal(false)}
        onVerify={handleOTPVerifiedForStamp}
        forStamping={true}
      />

      {/* Our custom message modal for alerts */}
      <MessageModal
        isOpen={showAlert}
        message={alertMessage}
        type={alertType}
        onClose={closeMessage}
      />
    </div>
  );
});

export default KonvaCanvas;
