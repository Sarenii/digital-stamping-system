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

import { uploadDocument, updateDocumentFile, generateQR } from "../services/documentService";
import { useAuth } from "../Context/AuthContext";

// Replicate shape drawing from StampComponent so final PDF matches
const STAMP_SIZE = 120;
const BORDER_WIDTH = 1.5;
const RING_GAP = 15;
const ARC_PADDING = 8;

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

const A4_WIDTH = 595;
const A4_HEIGHT = 842;

function drawStar(ctx, size) {
  const spikes = 5;
  const outerRadius = size / 2;
  const innerRadius = size / 4;
  let rot = (Math.PI / 2) * 3;
  const step = Math.PI / spikes;
  const centerX = size / 2;
  const centerY = size / 2;

  ctx.beginPath();
  for (let i = 0; i < spikes; i++) {
    let xPos = centerX + Math.cos(rot) * outerRadius;
    let yPos = centerY + Math.sin(rot) * outerRadius;
    ctx.lineTo(xPos, yPos);
    rot += step;

    xPos = centerX + Math.cos(rot) * innerRadius;
    yPos = centerY + Math.sin(rot) * innerRadius;
    ctx.lineTo(xPos, yPos);
    rot += step;
  }
  ctx.closePath();
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

  // OTP for stamping => companies require every time
  const [showStampVerificationModal, setShowStampVerificationModal] = useState(false);
  const [pendingStampCoords, setPendingStampCoords] = useState(null);

  // Serial number from backend => displayed if user chooses
  const [serialNumber, setSerialNumber] = useState("");
  const [showSerialNumber, setShowSerialNumber] = useState(false);

  const scrollContainerRef = useRef(null);
  const stageRef = useRef(null);

  const { user } = useAuth();
  const token = user?.accessToken || localStorage.getItem("accessToken");

  // Provide a function for the parent to call => upload a raw doc
  useEffect(() => {
    if (ref) {
      ref.current = {
        uploadDocument: async (file) => {
          if (!token) {
            alert("You must be logged in to upload documents.");
            return;
          }
          await loadDocumentIntoCanvas(file);
          try {
            const formData = new FormData();
            formData.append("file", file);
            // create doc => stamped=false
            const result = await uploadDocument(formData, token);
            setDocumentId(result.id);
            if (result.serial_number) {
              setSerialNumber(result.serial_number);
            }
          } catch (err) {
            console.error("Error uploading document:", err);
          }
        },
      };
    }
  }, [ref, token]);

  const loadDocumentIntoCanvas = async (file) => {
    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.src = e.target.result;
        img.onload = () => {
          setPages([img]);
          setIsDocumentUploaded(true);
        };
      };
      reader.readAsDataURL(file);
    } else if (file.type === "application/pdf") {
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

          const img = new Image();
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

  // The user chooses a stamp from the StampModal
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

  // Stage click => if company => OTP each time
  const handleStageClick = (e) => {
    if (!isAddingStamp || !selectedStampData) return;
    const pointer = e.target.getStage().getPointerPosition();
    if (!pointer) return;
    const { x, y } = pointer;

    // If user is a company => always require OTP
    if (((user?.role || "").toUpperCase()) === "COMPANY") {
      setPendingStampCoords({ x, y });
      setShowStampVerificationModal(true);
      return;
    } else {
      // For individuals => place stamp immediately
      setStampsOnPdf((prev) => [
        ...prev,
        { ...selectedStampData, id: uuidv4(), x, y },
      ]);
      setIsAddingStamp(false);
      setSelectedStampData(null);
    }
  };

  const handleStageMouseDown = async (e) => {
    handleStageClick(e);
  };

  // Called after OTP verification => place stamp
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
    }
  };

  // Generate a QR => place as a stamp
  const handleGenerateQR = async () => {
    if (!documentId) {
      alert("No document to generate a QR for. Please upload first.");
      return;
    }
    try {
      const { qr_base64 } = await generateQR(documentId, token);
      const qrImg = new Image();
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
      };
    } catch (error) {
      console.error("Error generating QR code:", error);
      alert("Failed to generate QR code.");
    }
  };

  // Delete a stamp
  const handleDeleteStamp = (stampId) => {
    setStampsOnPdf((prev) => prev.filter((s) => s.id !== stampId));
  };

  // On drag end => update stamp coords
  const handleStampDragEnd = (stampId, newX, newY) => {
    setStampsOnPdf((prevStamps) =>
      prevStamps.map((stamp) =>
        stamp.id === stampId ? { ...stamp, x: newX, y: newY } : stamp
      )
    );
  };

  // Zoom controls
  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.1, 3));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.1, 0.5));

  // Track page number based on scroll
  const handleScroll = () => {
    const container = scrollContainerRef.current;
    if (!container) return;
    const scrollTop = container.scrollTop;
    const pageHeight = A4_HEIGHT * zoom;
    const pageNumber = Math.floor(scrollTop / pageHeight) + 1;
    setCurrentPage(pageNumber);
  };

  // Build final PDF => replicate shape logic from StampComponent
  const buildFinalPdf = () => {
    const doc = new jsPDF({ unit: "pt", format: [A4_WIDTH, A4_HEIGHT] });

    pages.forEach((pageImage, pageIndex) => {
      // Render page background to an offscreen canvas
      const canvasEl = document.createElement("canvas");
      canvasEl.width = A4_WIDTH;
      canvasEl.height = A4_HEIGHT;
      const ctx = canvasEl.getContext("2d");
      ctx.drawImage(pageImage, 0, 0, A4_WIDTH, A4_HEIGHT);

      // Draw stamps for this page
      const stampsForPage = stampsOnPdf.filter((s) => s.pageIndex === pageIndex);
      stampsForPage.forEach((stamp) => drawStampOnCanvas(ctx, stamp));

      // If user checks "Display Serial Number," place it bottom-right
      if (serialNumber && showSerialNumber) {
        ctx.save();
        ctx.fillStyle = "#000";
        ctx.font = "bold 12px Arial";
        ctx.textAlign = "right";
        ctx.fillText(`Serial No: ${serialNumber}`, A4_WIDTH - 10, A4_HEIGHT - 10);
        ctx.restore();
      }

      // Convert canvas to dataURL => add to jsPDF
      const pageDataUrl = canvasEl.toDataURL("image/jpeg", 1.0);
      if (pageIndex > 0) doc.addPage();
      doc.addImage(pageDataUrl, "JPEG", 0, 0, A4_WIDTH, A4_HEIGHT);
    });

    return doc;
  };

  // Replicate shape logic from StampComponent
  const drawStampOnCanvas = (ctx, stamp) => {
    const size = STAMP_SIZE;
    const { x, y, shape, qrImage, shape_color, text_color, date_color, top_text, bottom_text, date } = stamp;

    // If it's QR, just draw the image
    if (shape === "QR" && qrImage) {
      ctx.drawImage(qrImage, x, y, size, size);
      return;
    }

    // Otherwise, replicate shape-based stamping
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

      // Place top_text near top, bottom_text near bottom, date in center
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      if (top_text) {
        ctx.fillStyle = text_color;
        ctx.font = "bold 14px Arial";
        ctx.fillText(top_text.toUpperCase(), x + size / 2, y + 14);
      }
      if (bottom_text) {
        ctx.fillStyle = text_color;
        ctx.font = "bold 14px Arial";
        ctx.fillText(bottom_text.toUpperCase(), x + size / 2, y + size - 14);
      }
      if (date) {
        ctx.fillStyle = date_color;
        ctx.font = "bold 12px Arial";
        ctx.fillText(date, x + size / 2, y + size / 2);
      }

    } else if (shape === "Square") {
      // Outer square
      ctx.strokeStyle = shape_color;
      ctx.beginPath();
      ctx.rect(x, y, size, size);
      ctx.stroke();
      // Inner square
      ctx.beginPath();
      ctx.rect(x + RING_GAP, y + RING_GAP, size - RING_GAP * 2, size - RING_GAP * 2);
      ctx.stroke();

      // top_text, bottom_text, date
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

    } else if (shape === "Star") {
      // Outer star
      ctx.strokeStyle = shape_color;
      ctx.beginPath();
      ctx.translate(x, y);
      drawStar(ctx, size);
      ctx.stroke();
      ctx.setTransform(1, 0, 0, 1, 0, 0);

      // Inner star
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
  };

  // ============= DOWNLOAD & SAVE ==============
  const handleDownload = () => {
    const doc = buildFinalPdf();
    doc.save("document.pdf");
  };

  const handleDownloadAndSave = async () => {
    const doc = buildFinalPdf();
    const pdfBlob = doc.output("blob");
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

  const saveDocument = async () => {
    if (!documentId) {
      alert("No document to update! Please upload first.");
      return;
    }
    const doc = buildFinalPdf();
    const pdfBlob = doc.output("blob");
    try {
      await updateDocumentFile(documentId, pdfBlob, token);
      alert("Stamped document saved to backend!");
    } catch (error) {
      console.error("Error saving stamped document:", error);
    }
  };

  return (
    <div className="flex-1 p-4 border-dotted border-4 border-gray-400 flex flex-col items-center">
      {isDocumentUploaded && (
        <button
          onClick={() => setStampModalOpen(true)}
          className="mb-2 px-4 py-2 bg-primary text-white rounded hover:bg-primary"
        >
          Add Stamp
        </button>
      )}
      {isDocumentUploaded && (
        <button
          onClick={handleGenerateQR}
          className="mb-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
        >
          Generate QR Code
        </button>
      )}

      <StampModal
        isOpen={stampModalOpen}
        onClose={() => setStampModalOpen(false)}
        onCreateStamp={handleCreateStamp}
      />

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

      {/* Checkbox for serial number display */}
      {isDocumentUploaded && (
        <div className="mt-2">
          <label className="inline-flex items-center">
            <input
              type="checkbox"
              className="form-checkbox"
              checked={showSerialNumber}
              onChange={(e) => setShowSerialNumber(e.target.checked)}
            />
            <span className="ml-2">Display Serial Number on Document</span>
          </label>
        </div>
      )}

      {/* OTP modal => for companies each time they place a stamp */}
      <StampVerificationModal
        isOpen={showStampVerificationModal}
        onClose={() => setShowStampVerificationModal(false)}
        onVerify={handleOTPVerifiedForStamp}
        forStamping={true}
      />
    </div>
  );
});

export default KonvaCanvas;
