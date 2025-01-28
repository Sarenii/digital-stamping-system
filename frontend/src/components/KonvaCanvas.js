// import React, { useState, useEffect, useRef, forwardRef } from "react";
// import { Stage, Layer, Image } from "react-konva";
// import * as pdfjsLib from "pdfjs-dist";
// import pdfWorker from "pdfjs-dist/legacy/build/pdf.worker.min.js";
// import { v4 as uuidv4 } from "uuid";
// import StampComponent from "./StampComponent";
// import StampSelectionModal from "./StampSelectionModal";
// import StampCreationModal from "./StampCreationModal";
// import { jsPDF } from "jspdf";
// import { saveAs } from "file-saver";

// pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

// const A4_WIDTH = 595;
// const A4_HEIGHT = 842;

// const KonvaCanvas = forwardRef((props, ref) => {
//   const [pages, setPages] = useState([]);
//   const [currentPage, setCurrentPage] = useState(1);
//   const [zoom, setZoom] = useState(1);
//   const [stamps, setStamps] = useState([]);
//   const [showModal, setShowModal] = useState(false);
//   const [showCreateModal, setShowCreateModal] = useState(false);
//   const [selectedStamp, setSelectedStamp] = useState(null);
//   const [isAddingStamp, setIsAddingStamp] = useState(false);
//   const [isDocumentUploaded, setIsDocumentUploaded] = useState(false);
//   const [showDownloadOptions, setShowDownloadOptions] = useState(false);
//   const [savedDocuments, setSavedDocuments] = useState([]);
//   const stageRef = useRef(null);
//   const scrollContainerRef = useRef(null);

//   useEffect(() => {
//     if (ref) {
//       ref.current = {
//         uploadDocument: async (file) => {
//           const fileType = file.type;
//           if (fileType.startsWith("image/")) {
//             const reader = new FileReader();
//             reader.onload = (e) => {
//               const img = new window.Image();
//               img.src = e.target.result;
//               img.onload = () => {
//                 setPages([img]);
//                 setIsDocumentUploaded(true);
//               };
//             };
//             reader.readAsDataURL(file);
//           } else if (fileType === "application/pdf") {
//             const reader = new FileReader();
//             reader.onload = async (e) => {
//               const pdf = await pdfjsLib.getDocument(e.target.result).promise;
//               const pageImages = [];
//               for (let i = 1; i <= pdf.numPages; i++) {
//                 const page = await pdf.getPage(i);
//                 const viewport = page.getViewport({ scale: 1 });
//                 const canvasEl = document.createElement("canvas");
//                 const context = canvasEl.getContext("2d");
//                 canvasEl.width = A4_WIDTH;
//                 canvasEl.height = A4_HEIGHT;
//                 const scale = Math.min(A4_WIDTH / viewport.width, A4_HEIGHT / viewport.height);
//                 const scaledViewport = page.getViewport({ scale });
//                 canvasEl.width = scaledViewport.width;
//                 canvasEl.height = scaledViewport.height;
//                 await page.render({ canvasContext: context, viewport: scaledViewport }).promise;
//                 const img = new window.Image();
//                 img.src = canvasEl.toDataURL();
//                 await new Promise((resolve) => {
//                   img.onload = () => {
//                     pageImages.push(img);
//                     resolve();
//                   };
//                 });
//               }
//               setPages(pageImages);
//               setIsDocumentUploaded(true);
//             };
//             reader.readAsArrayBuffer(file);
//           } else {
//             alert("Unsupported file type.");
//           }
//         },
//         handleAddStamp: () => {
//           setShowModal(true);
//         },
//       };
//     }
//   }, [ref]);

//   const handleDownload = () => {
//     const doc = new jsPDF();
//     pages.forEach((page, index) => {
//       doc.addImage(page.src, "JPEG", 0, 0, A4_WIDTH, A4_HEIGHT);
//       if (index < pages.length - 1) {
//         doc.addPage();
//       }
//     });
//     doc.save("document.pdf");
//     sendDocumentToBackend(doc);
//   };

//   const handleDownloadAndSave = () => {
//     const doc = new jsPDF();
//     pages.forEach((page, index) => {
//       doc.addImage(page.src, "JPEG", 0, 0, A4_WIDTH, A4_HEIGHT);
//       if (index < pages.length - 1) {
//         doc.addPage();
//       }
//     });

//     const pdfBlob = doc.output("blob");
//     saveAs(pdfBlob, "document.pdf");
//     sendDocumentToBackend(pdfBlob);
//   };

//   const sendDocumentToBackend = async (doc) => {
//     const token = localStorage.getItem("authToken");
//     if (!token) {
//       console.error("Authentication token is missing.");
//       return;
//     }

//     const pdfBlob = doc instanceof jsPDF ? doc.output("blob") : doc;
//     if (!(pdfBlob instanceof Blob)) {
//       console.error("Document is not a Blob.");
//       return;
//     }

//     const formData = new FormData();
//     formData.append("file", pdfBlob, "document.pdf");

//     try {
//       const response = await fetch("http://localhost:8000/stamps/documents/", {
//         method: "POST",
//         body: formData,
//         headers: {
//           Authorization: `Bearer ${token}`,
//         },
//       });

//       if (response.ok) {
//         console.log("Document successfully uploaded to the backend.");
//       } else {
//         console.error("Failed to upload document.");
//       }
//     } catch (error) {
//       console.error("Error uploading document:", error);
//     }
//   };

//   const saveDocument = () => {
//     const newDocument = { id: uuidv4(), pages, stamps };
//     setSavedDocuments((prevDocs) => [...prevDocs, newDocument]);
//     sendDocumentToBackend(newDocument);
//   };

//   const handleScroll = () => {
//     const container = scrollContainerRef.current;
//     if (container) {
//       const scrollTop = container.scrollTop;
//       const pageHeight = A4_HEIGHT * zoom;
//       const pageNumber = Math.floor(scrollTop / pageHeight) + 1;
//       setCurrentPage(pageNumber);
//     }
//   };

//   const handleZoomIn = () => {
//     setZoom((prevZoom) => Math.min(prevZoom + 0.1, 3));
//   };

//   const handleZoomOut = () => {
//     setZoom((prevZoom) => Math.max(prevZoom - 0.1, 0.5));
//   };

//   const handleSelectStamp = (stamp) => {
//     setSelectedStamp(stamp);
//     setShowModal(false);
//     setIsAddingStamp(true);
//   };

//   const handleCreateStamp = (stampData) => {
//     const newStamp = {
//       id: uuidv4(),
//       text: stampData.text,
//       x: 100,
//       y: 100,
//       pageIndex: currentPage - 1,
//       borderColor: stampData.borderColor,
//     };
//     setStamps((prevStamps) => [...prevStamps, newStamp]);
//     setShowCreateModal(false);
//   };

//   const handleDeleteStamp = (id) => {
//     setStamps(stamps.filter((stamp) => stamp.id !== id));
//   };

//   const handleStageClick = (e) => {
//     if (isAddingStamp && selectedStamp) {
//       const { x, y } = e.target.getStage().getPointerPosition();

//       const stampPadding = 20;
//       const pageStamps = stamps.filter((stamp) => stamp.pageIndex === currentPage - 1);
//       let newX = x;
//       let newY = y;

//       if (pageStamps.length > 0) {
//         const lastStamp = pageStamps[pageStamps.length - 1];
//         newX = lastStamp.x + stampPadding;
//         newY = lastStamp.y + stampPadding;
//       }

//       setStamps((prevStamps) => [
//         ...prevStamps,
//         {
//           id: uuidv4(),
//           x: newX,
//           y: newY,
//           text: selectedStamp.text,
//           pageIndex: currentPage - 1,
//           borderColor: selectedStamp.borderColor,
//         },
//       ]);
//       setIsAddingStamp(false);
//     }
//   };

//   return (
//     <div className="flex-1 p-4 border-dotted border-4 border-gray-400 flex justify-center items-center flex-col">
//       {isDocumentUploaded && (
//         <div className="w-full flex justify-between items-center bg-blue-100 p-4 rounded-t-lg shadow-md">
//           <button
//             onClick={() => setShowDownloadOptions(!showDownloadOptions)}
//             className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition duration-200"
//           >
//             Download Options
//           </button>
//           {showDownloadOptions && (
//             <div className="flex flex-col space-y-2 mt-2">
//               <button
//                 onClick={handleDownload}
//                 className="px-6 py-2 bg-white text-gray-700 border border-gray-300 rounded-md hover:bg-gray-100 transition duration-200"
//               >
//                 Download
//               </button>
//               <button
//                 onClick={handleDownloadAndSave}
//                 className="px-6 py-2 bg-white text-gray-700 border border-gray-300 rounded-md hover:bg-gray-100 transition duration-200"
//               >
//                 Download and Save
//               </button>
//               <button
//                 onClick={saveDocument}
//                 className="px-6 py-2 bg-white text-gray-700 border border-gray-300 rounded-md hover:bg-gray-100 transition duration-200"
//               >
//                 Save Document
//               </button>
//             </div>
//           )}
//         </div>
//       )}

//       {pages.length === 0 ? (
//         <div className="text-center text-gray-500">
//           <p>Upload a document to view here.</p>
//         </div>
//       ) : (
//         <div
//           ref={scrollContainerRef}
//           className="overflow-y-auto max-h-[80vh] w-full"
//           onScroll={handleScroll}
//         >
//           <Stage
//             width={A4_WIDTH * zoom}
//             height={pages.length * A4_HEIGHT * zoom}
//             ref={stageRef}
//             onClick={handleStageClick}
//             style={{ cursor: isAddingStamp ? "crosshair" : "default" }}
//           >
//             <Layer>
//               {pages.map((page, index) => {
//                 const centerX = (A4_WIDTH * zoom - page.width * zoom) / 2;
//                 const centerY = index * A4_HEIGHT * zoom + (A4_HEIGHT * zoom - page.height * zoom) / 2;

//                 return (
//                   <React.Fragment key={index}>
//                     <Image
//                       image={page}
//                       width={page.width * zoom}
//                       height={page.height * zoom}
//                       x={centerX}
//                       y={centerY}
//                     />
//                     {stamps
//                       .filter((stamp) => stamp.pageIndex === index)
//                       .map((stamp) => (
//                         <StampComponent
//                           key={stamp.id}
//                           id={stamp.id}
//                           pageIndex={stamp.pageIndex}
//                           zoom={zoom}
//                           x={stamp.x}
//                           y={stamp.y}
//                           text={stamp.text}
//                           borderColor={stamp.borderColor}
//                           onDelete={handleDeleteStamp}
//                         />
//                       ))}
//                   </React.Fragment>
//                 );
//               })}
//             </Layer>
//           </Stage>
//         </div>
//       )}

//       <div className="flex justify-between items-center mt-4 w-full px-4 text-sm">
//         <div className="text-gray-500">
//           Page {currentPage} / {pages.length}
//         </div>
//         <div className="flex items-center space-x-2">
//           <button
//             onClick={handleZoomOut}
//             className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300"
//           >
//             Zoom Out
//           </button>
//           <button
//             onClick={handleZoomIn}
//             className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300"
//           >
//             Zoom In
//           </button>
//         </div>
//       </div>

//       {showModal && (
//         <StampSelectionModal
//           onClose={() => setShowModal(false)}
//           onSelect={handleSelectStamp}
//         />
//       )}

//       {showCreateModal && (
//         <StampCreationModal
//           onClose={() => setShowCreateModal(false)}
//           onCreate={handleCreateStamp}
//         />
//       )}
//     </div>
//   );
// });

// export default KonvaCanvas;
import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle } from "react";
import { Stage, Layer, Image } from "react-konva";
import * as pdfjsLib from "pdfjs-dist";
import pdfWorker from "pdfjs-dist/legacy/build/pdf.worker.min.js";
import { v4 as uuidv4 } from "uuid";
import StampComponent from "./StampComponent";
import StampSelectionModal from "./StampSelectionModal";
import StampCreationModal from "./StampCreationModal";
import { jsPDF } from "jspdf";
import { saveAs } from "file-saver";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

const A4_WIDTH = 595;
const A4_HEIGHT = 842;

const KonvaCanvas = forwardRef((props, ref) => {
  const [pages, setPages] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [zoom, setZoom] = useState(1);
  const [stamps, setStamps] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedStamp, setSelectedStamp] = useState(null);
  const [isAddingStamp, setIsAddingStamp] = useState(false);
  const [isDocumentUploaded, setIsDocumentUploaded] = useState(false);
  const [showDownloadOptions, setShowDownloadOptions] = useState(false);
  const [savedDocuments, setSavedDocuments] = useState([]);
  const stageRef = useRef(null);
  const scrollContainerRef = useRef(null);

  useImperativeHandle(ref, () => ({
    uploadDocument: async (file) => {
      const fileType = file.type;
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
          setIsDocumentUploaded(true);
        };
        reader.readAsArrayBuffer(file);
      } else {
        alert("Unsupported file type.");
      }
    },
    handleAddStamp: () => {
      setShowModal(true);
    },
  }));

  const handleDownload = () => {
    const doc = new jsPDF();
    pages.forEach((page, index) => {
      doc.addImage(page.src, "JPEG", 0, 0, A4_WIDTH, A4_HEIGHT);
      if (index < pages.length - 1) {
        doc.addPage();
      }
    });
    doc.save("document.pdf");
    sendDocumentToBackend(doc);
  };

  const handleDownloadAndSave = () => {
    const doc = new jsPDF();
    pages.forEach((page, index) => {
      doc.addImage(page.src, "JPEG", 0, 0, A4_WIDTH, A4_HEIGHT);
      if (index < pages.length - 1) {
        doc.addPage();
      }
    });

    const pdfBlob = doc.output("blob");
    saveAs(pdfBlob, "document.pdf");
    sendDocumentToBackend(pdfBlob);
  };

  const sendDocumentToBackend = async (doc) => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      console.error("Authentication token is missing.");
      return;
    }

    const pdfBlob = doc instanceof jsPDF ? doc.output("blob") : doc;
    if (!(pdfBlob instanceof Blob)) {
      console.error("Document is not a Blob.");
      return;
    }

    const formData = new FormData();
    formData.append("file", pdfBlob, "document.pdf");

    try {
      const response = await fetch("http://localhost:8000/stamps/documents/", {
        method: "POST",
        body: formData,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        console.log("Document successfully uploaded to the backend.");
      } else {
        console.error("Failed to upload document.");
      }
    } catch (error) {
      console.error("Error uploading document:", error);
    }
  };

  const saveDocument = () => {
    const newDocument = { id: uuidv4(), pages, stamps };
    setSavedDocuments((prevDocs) => [...prevDocs, newDocument]);
    sendDocumentToBackend(newDocument);
  };

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
    console.log("Stamp selected:", stamp);
    setSelectedStamp(stamp);
    setShowModal(false);
    setIsAddingStamp(true);
  };

  const handleCreateStamp = (stampData) => {
    console.log("Stamp created:", stampData);
    const newStamp = {
      id: uuidv4(),
      text: stampData.text,
      x: 100,
      y: 100,
      pageIndex: currentPage - 1,
      borderColor: stampData.borderColor,
    };
    setStamps((prevStamps) => [...prevStamps, newStamp]);
    setShowCreateModal(false);
  };

  const handleDeleteStamp = (id) => {
    console.log("Stamp deleted:", id);
    setStamps(stamps.filter((stamp) => stamp.id !== id));
  };

  const handleStageClick = (e) => {
    console.log("handleStageClick called");
    if (isAddingStamp && selectedStamp) {
      const { x, y } = e.target.getStage().getPointerPosition();
      console.log("Stage clicked at:", { x, y });

      const stampPadding = 20;
      const pageStamps = stamps.filter((stamp) => stamp.pageIndex === currentPage - 1);
      let newX = x;
      let newY = y;

      if (pageStamps.length > 0) {
        const lastStamp = pageStamps[pageStamps.length - 1];
        newX = lastStamp.x + stampPadding;
        newY = lastStamp.y + stampPadding;
      }

      const newStamp = {
        id: uuidv4(),
        x: newX,
        y: newY,
        text: selectedStamp.text,
        pageIndex: currentPage - 1,
        borderColor: selectedStamp.borderColor,
      };

      console.log("Adding new stamp:", newStamp);
      setStamps((prevStamps) => [...prevStamps, newStamp]);
      setIsAddingStamp(false);
    }
  };

  return (
    <div className="flex-1 p-4 border-dotted border-4 border-gray-400 flex justify-center items-center flex-col">
      {isDocumentUploaded && (
        <div className="w-full flex justify-between items-center bg-blue-100 p-4 rounded-t-lg shadow-md">
          <button
            onClick={() => setShowDownloadOptions(!showDownloadOptions)}
            className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition duration-200"
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
        <div className="text-center text-gray-500">
          <p>Upload a document to view here.</p>
        </div>
      ) : (
        <div
          ref={scrollContainerRef}
          className="overflow-y-auto max-h-[80vh] w-full"
          onScroll={handleScroll}
          style={{ cursor: isAddingStamp ? "crosshair" : "default" }}
        >
          <Stage
            width={A4_WIDTH * zoom}
            height={pages.length * A4_HEIGHT * zoom}
            ref={stageRef}
            onClick={handleStageClick}
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
                      .map((stamp) => (
                        <StampComponent
                          key={stamp.id}
                          id={stamp.id}
                          pageIndex={stamp.pageIndex}
                          zoom={zoom}
                          x={stamp.x}
                          y={stamp.y}
                          text={stamp.text}
                          borderColor={stamp.borderColor}
                          onDelete={handleDeleteStamp}
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

      {showModal && (
        <StampSelectionModal
          onClose={() => setShowModal(false)}
          onSelect={handleSelectStamp}
        />
      )}

      {showCreateModal && (
        <StampCreationModal
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreateStamp}
        />
      )}
    </div>
  );
});

export default KonvaCanvas;