import React, { useEffect, useImperativeHandle, forwardRef, useState } from "react";
import { Canvas, Image as FabricImage } from "fabric";
import * as pdfjsLib from "pdfjs-dist";

// Set up the worker for pdfjs-dist
import { GlobalWorkerOptions } from 'pdfjs-dist';
import workerSrc from 'pdfjs-dist/build/pdf.worker.entry';
GlobalWorkerOptions.workerSrc = workerSrc;

const FabricCanvas = forwardRef((props, ref) => {
  const canvasRef = React.useRef(null);
  const [fabricCanvas, setFabricCanvas] = useState(null);

  useEffect(() => {
    const canvas = new Canvas(canvasRef.current, {
      height: 500,
      width: 800,
      backgroundColor: "#F5F5F5",
    });
    setFabricCanvas(canvas);

    // Expose methods to the parent component through the ref
    if (ref) {
      ref.current = {
        uploadDocument: async (file) => {
          const fileType = file.type;

          if (fileType.startsWith("image/")) {
            // Handle image files
            const reader = new FileReader();
            reader.onload = (e) => {
              console.log("Image loaded:", e.target.result);  // Log the image URL
              FabricImage.fromURL(e.target.result, (img) => {
                console.log("Fabric image:", img);  // Log the image object

                // Scale the image to fit the canvas (90% of canvas size)
                img.scaleToWidth(fabricCanvas.width * 0.9);
                img.scaleToHeight(fabricCanvas.height * 0.9);
                fabricCanvas.add(img);
                fabricCanvas.renderAll();  // Ensure the canvas is re-rendered
              });
            };
            reader.readAsDataURL(file);
          } else if (fileType === "application/pdf") {
            // Handle PDF files
            const reader = new FileReader();
            reader.onload = async (e) => {
              const pdf = await pdfjsLib.getDocument(e.target.result).promise;
              const firstPage = await pdf.getPage(1);
              const viewport = firstPage.getViewport({ scale: 1 });

              const canvasEl = document.createElement("canvas");
              const context = canvasEl.getContext("2d");
              canvasEl.width = viewport.width;
              canvasEl.height = viewport.height;

              await firstPage.render({ canvasContext: context, viewport }).promise;

              // Convert the rendered PDF page to an image
              FabricImage.fromURL(canvasEl.toDataURL(), (img) => {
                console.log("Fabric image from PDF:", img);  // Log the image object

                // Scale the image to fit the canvas (90% of canvas size)
                img.scaleToWidth(fabricCanvas.width * 0.9);
                img.scaleToHeight(fabricCanvas.height * 0.9);
                fabricCanvas.add(img);
                fabricCanvas.renderAll();  // Ensure the canvas is re-rendered
              });
            };
            reader.readAsArrayBuffer(file);
          } else if (fileType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
            // Handle Word documents (convert to PDF or images)
            alert("Word document support will be added in the next iteration.");
          } else {
            alert("Unsupported file type.");
          }
        },
      };
    }

    return () => canvas.dispose();
  }, [ref]);

  return (
    <div className="flex-1 p-4">
      <div className="w-full h-full border-dashed border-2 border-accent rounded-lg bg-neutral flex items-center justify-center">
        <canvas ref={canvasRef}></canvas>
      </div>
    </div>
  );
});

export default FabricCanvas;
