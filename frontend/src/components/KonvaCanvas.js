import React, { useState, useEffect, useRef, forwardRef } from "react";
import { Stage, Layer, Image } from "react-konva";
import * as pdfjsLib from "pdfjs-dist";
import pdfWorker from "pdfjs-dist/legacy/build/pdf.worker.min.js";
import { v4 as uuidv4 } from "uuid";
import StampComponent from "./StampComponent";
import StampModal from "./StampModal";
import { jsPDF } from "jspdf";
import { saveAs } from "file-saver";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

const A4_WIDTH = 595;  // PDF points for A4
const A4_HEIGHT = 842;

const KonvaCanvas = forwardRef((props, ref) => {
  const [pages, setPages] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [zoom, setZoom] = useState(1);

  const [isDocumentUploaded, setIsDocumentUploaded] = useState(false);

  // Stamps placed on the PDF
  const [stampsOnPdf, setStampsOnPdf] = useState([]);

  // For adding a new stamp
  const [selectedStampData, setSelectedStampData] = useState(null);
  const [isAddingStamp, setIsAddingStamp] = useState(false);

  // Download/Save UI
  const [showDownloadOptions, setShowDownloadOptions] = useState(false);

  // StampModal
  const [stampModalOpen, setStampModalOpen] = useState(false);

  // Refs
  const stageRef = useRef(null);
  const scrollContainerRef = useRef(null);

  /**
   * Expose functions to parent via ref (uploadDocument, etc.)
   */
  useEffect(() => {
    if (ref) {
      ref.current = {
        uploadDocument: async (file) => {
          const fileType = file.type;
          // If the file is an image
          if (fileType.startsWith("image/")) {
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
          }
          // If the file is a PDF
          else if (fileType === "application/pdf") {
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
        },
      };
    }
  }, [ref]);

  /**
   * Called when the user picks a stamp from the StampModal
   * We'll store it so that the next stage click places it.
   */
  const handleCreateStamp = (stampData) => {
    // We'll store the stamp in state, 
    // then on the next stage click, we place it.
    const newStamp = {
      ...stampData,
      // ensure each stamp has a unique ID, etc.
      id: uuidv4(),
      x: 100,
      y: 100,
      pageIndex: currentPage - 1,
    };
    setSelectedStampData(newStamp);
    setIsAddingStamp(true);
  };

  /**
   * Stage click: place the stamp if we're in adding mode
   */
  const handleStageClick = (e) => {
    if (isAddingStamp && selectedStampData) {
      const { x, y } = e.target.getStage().getPointerPosition();
      // Add the new stamp to the array
      setStampsOnPdf((prev) => [
        ...prev,
        {
          ...selectedStampData,
          // Each placed stamp needs its own ID
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
   * Delete a stamp from the PDF
   */
  const handleDeleteStamp = (stampId) => {
    setStampsOnPdf((prev) => prev.filter((s) => s.id !== stampId));
  };

  /**
   * Drag end: update the stamp coordinates
   */
  const handleStampDragEnd = (stampId, newX, newY) => {
    setStampsOnPdf((prevStamps) =>
      prevStamps.map((stamp) =>
        stamp.id === stampId ? { ...stamp, x: newX, y: newY } : stamp
      )
    );
  };

  /**
   * Zoom logic (UI only)
   */
  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.1, 3));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.1, 0.5));

  /**
   * Track current page based on scroll
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
   * Build an unzoomed PDF with all stamps
   */
  const buildFinalPdf = () => {
    const doc = new jsPDF({
      unit: "pt",
      format: [A4_WIDTH, A4_HEIGHT],
    });
    pages.forEach((pageImage, pageIndex) => {
      // create an in-memory canvas
      const canvasEl = document.createElement("canvas");
      canvasEl.width = A4_WIDTH;
      canvasEl.height = A4_HEIGHT;
      const ctx = canvasEl.getContext("2d");

      // draw page
      ctx.drawImage(pageImage, 0, 0, A4_WIDTH, A4_HEIGHT);

      // draw stamps on this page
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
   * Draw a single stamp on the canvas 2D context (unzoomed)
   */
  const drawStampOnCanvas = (ctx, stamp) => {
    const size = 120; // match StampComponent
    const { shape, shape_color, text_color, date_color } = stamp;
    const { x, y } = stamp;

    // star helper
    const drawStar = (ctx, cx, cy, outerR, innerR, spikes = 5) => {
      let rot = Math.PI / 2 * 3;
      let step = Math.PI / spikes;
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

    ctx.save();
    ctx.strokeStyle = "#000";
    ctx.lineWidth = 2;
    ctx.fillStyle = shape_color || "#ddd";

    // outer shape
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
      drawStar(ctx, x + size / 2, y + size / 2, size / 2, size / 4, 5);
      ctx.fill();
      ctx.stroke();
    }

    // inner shape (white)
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
      drawStar(ctx, x + size / 2, y + size / 2, innerSize / 2, innerSize / 4, 5);
      ctx.fill();
    }

    // text
    ctx.fillStyle = text_color || "#000";
    ctx.font = "bold 14px Arial";
    ctx.textAlign = "center";

    if (stamp.top_text) {
      ctx.fillText(stamp.top_text, x + size / 2, y + size * 0.2);
    }

    if (stamp.date) {
      ctx.fillStyle = date_color || "#888";
      ctx.font = "12px Arial";
      ctx.fillText(stamp.date, x + size / 2, y + size * 0.55);
    }

    if (stamp.bottom_text) {
      ctx.fillStyle = text_color || "#000";
      ctx.font = "bold 14px Arial";
      ctx.fillText(stamp.bottom_text, x + size / 2, y + size * 0.8);
    }
    ctx.restore();
  };

  /** Download the final PDF with stamps */
  const handleDownload = () => {
    const finalDoc = buildFinalPdf();
    finalDoc.save("document.pdf");
  };

  /** Download + save to backend */
  const handleDownloadAndSave = () => {
    const finalDoc = buildFinalPdf();
    const pdfBlob = finalDoc.output("blob");
    saveAs(pdfBlob, "document.pdf");
    // Optionally upload to backend
    // sendDocumentToBackend(pdfBlob);
  };

  const saveDocument = () => {
    console.log("Saving pages + stamps...", stampsOnPdf);
    // or call handleDownloadAndSave()
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

      {/* The StampModal to choose existing, general, or simple stamp */}
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

      {/* The PDF preview area */}
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
                  {/* Render page */}
                  <Image
                    image={pageImage}
                    width={A4_WIDTH * zoom}
                    height={A4_HEIGHT * zoom}
                    x={0}
                    y={pageIndex * A4_HEIGHT * zoom}
                  />

                  {/* Render placed stamps for this page */}
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