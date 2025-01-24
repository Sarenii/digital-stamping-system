import React, { useState, useEffect, useRef, useImperativeHandle, forwardRef } from "react";
import { Stage, Layer, Image } from "react-konva";
import * as pdfjsLib from "pdfjs-dist";
import pdfWorker from "pdfjs-dist/legacy/build/pdf.worker.min.js";
import StampComponent from "./StampComponent"; // Import Stamp Component
import StampSelectionModal from "./StampSelectionModal"; // Import Modal

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

const A4_WIDTH = 595; // A4 width in px at 72 DPI
const A4_HEIGHT = 842; // A4 height in px at 72 DPI

const KonvaCanvas = forwardRef((props, ref) => {
  const [pages, setPages] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [zoom, setZoom] = useState(1);
  const [stamps, setStamps] = useState([]);
  const [isAddingStamp, setIsAddingStamp] = useState(false);
  const [selectedStamp, setSelectedStamp] = useState(null); // Selected stamp
  const [showModal, setShowModal] = useState(false); // Show modal flag
  const stageRef = useRef(null);
  const scrollContainerRef = useRef(null);

  useEffect(() => {
    if (ref) {
      ref.current = {
        uploadDocument: async (file) => {
          const fileType = file.type;

          if (fileType.startsWith("image/")) {
            const reader = new FileReader();
            reader.onload = (e) => {
              const img = new window.Image();
              img.src = e.target.result;
              img.onload = () => {
                setPages([img]);
              };
            };
            reader.readAsDataURL(file);
          } else if (fileType === "application/pdf") {
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

                const scale = Math.min(A4_WIDTH / viewport.width, A4_HEIGHT / viewport.height);
                const scaledViewport = page.getViewport({ scale });

                canvasEl.width = scaledViewport.width;
                canvasEl.height = scaledViewport.height;

                await page.render({ canvasContext: context, viewport: scaledViewport }).promise;

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
            };
            reader.readAsArrayBuffer(file);
          } else {
            alert("Unsupported file type.");
          }
        },
        handleAddStamp: () => {
          setShowModal(true); // Open the modal
        },
      };
    }
  }, [ref]);

  const handleScroll = () => {
    const container = scrollContainerRef.current;
    if (container) {
      const scrollTop = container.scrollTop;
      const pageHeight = A4_HEIGHT * zoom;
      const pageNumber = Math.floor(scrollTop / pageHeight) + 1;
      setCurrentPage(pageNumber);
    }
  };

  const handleZoomIn = () => {
    setZoom((prevZoom) => Math.min(prevZoom + 0.1, 3));
  };

  const handleZoomOut = () => {
    setZoom((prevZoom) => Math.max(prevZoom - 0.1, 0.5));
  };

  const handleSelectStamp = (stamp) => {
    setSelectedStamp(stamp); // Set selected stamp
    setShowModal(false); // Close the modal
    setIsAddingStamp(true); // Enable stamp placement mode
  };
  const handleCloseModal = () => {
    setShowModal(false); // Close the modal
  };
  const handleStageClick = (e) => {
    if (isAddingStamp && selectedStamp) {
      const { x, y } = e.target.getStage().getPointerPosition();
      setStamps((prevStamps) => [
        ...prevStamps,
        { x, y, text: selectedStamp, pageIndex: currentPage - 1 },
      ]);
      setIsAddingStamp(false);
    }
  };

  return (
    <div className="flex-1 p-4 border-dotted border-4 border-gray-400 flex justify-center items-center flex-col">
      {pages.length === 0 ? (
        <div className="text-center text-gray-500">
          <p>Upload a document to view here.</p>
        </div>
      ) : (
        <div
          ref={scrollContainerRef}
          className="overflow-y-auto max-h-[80vh] w-full"
          onScroll={handleScroll}
        >
          <Stage
            width={A4_WIDTH * zoom}
            height={pages.length * A4_HEIGHT * zoom}
            ref={stageRef}
            onClick={handleStageClick}
            style={{
              cursor: isAddingStamp ? "crosshair" : "default", // Change cursor when adding stamp
            }}
          >
            <Layer>
              {pages.map((page, index) => {
                const centerX = (A4_WIDTH * zoom - page.width * zoom) / 2;
                const centerY = index * A4_HEIGHT * zoom + (A4_HEIGHT * zoom - page.height * zoom) / 2;

                return (
                  <React.Fragment key={index}>
                    <Image
                      image={page}
                      width={page.width * zoom}
                      height={page.height * zoom}
                      x={centerX}
                      y={centerY}
                    />
                    {stamps
                      .filter((stamp) => stamp.pageIndex === index)
                      .map((stamp, stampIndex) => (
                        <StampComponent
                          key={stampIndex}
                          pageIndex={stamp.pageIndex}
                          zoom={zoom}
                          x={stamp.x}
                          y={stamp.y}
                          text={stamp.text}
                        />
                      ))}
                  </React.Fragment>
                );
              })}
            </Layer>
          </Stage>
        </div>
      )}
      <div className="flex justify-between items-center mt-4 w-full px-4 text-sm">
        <div className="text-gray-500">
          Page {currentPage} / {pages.length}
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={handleZoomOut}
            className="px-3 py-1 bg-gray-300 hover:bg-gray-400 rounded"
          >
            -
          </button>
          <button
            onClick={handleZoomIn}
            className="px-3 py-1 bg-gray-300 hover:bg-gray-400 rounded"
          >
            +
          </button>
        </div>
      </div>

      {/* Modal for selecting stamp */}
      {showModal && (
        <StampSelectionModal onSelect={handleSelectStamp} onClose={handleCloseModal} />
      )}
    </div>
  );
});

export default KonvaCanvas;
