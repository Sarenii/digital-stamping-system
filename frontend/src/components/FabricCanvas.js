import React, { useEffect, useImperativeHandle, forwardRef, useState } from "react";
import { Canvas, Image as FabricImage } from "fabric";
import * as pdfjsLib from "pdfjs-dist";

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
              FabricImage.fromURL(e.target.result, (img) => {
                img.scaleToWidth(canvas.width * 0.9);
                canvas.add(img);
                canvas.renderAll();
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

              FabricImage.fromURL(canvasEl.toDataURL(), (img) => {
                img.scaleToWidth(canvas.width * 0.9);
                canvas.add(img);
                canvas.renderAll();
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
