import React, { useEffect, useImperativeHandle, forwardRef, useState } from "react";
import Konva from "konva";
import { Stage, Layer, Image } from "react-konva";
import * as pdfjsLib from "pdfjs-dist";

// Set up the worker for pdfjs-dist
import { GlobalWorkerOptions } from "pdfjs-dist";
import workerSrc from "pdfjs-dist/build/pdf.worker.entry";
GlobalWorkerOptions.workerSrc = workerSrc;

const KonvaCanvas = forwardRef((props, ref) => {
  const [image, setImage] = useState(null);
  const [pdfImage, setPdfImage] = useState(null);
  const stageRef = React.useRef(null);

  useEffect(() => {
    if (ref) {
      ref.current = {
        uploadDocument: async (file) => {
          const fileType = file.type;

          if (fileType.startsWith("image/")) {
            // Handle image files
            const reader = new FileReader();
            reader.onload = (e) => {
              const img = new window.Image();
              img.src = e.target.result;
              img.onload = () => {
                setImage(img); // Set the image to state
              };
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

              // Create image from canvas
              const pdfImg = new window.Image();
              pdfImg.src = canvasEl.toDataURL();
              pdfImg.onload = () => {
                setPdfImage(pdfImg); // Set PDF image to state
              };
            };
            reader.readAsArrayBuffer(file);
          } else {
            alert("Unsupported file type.");
          }
        },
      };
    }
  }, [ref]);

  return (
    <div className="flex-1 p-4">
      <Stage width={800} height={500} ref={stageRef}>
        <Layer>
          {image && (
            <Image
              image={image}
              width={800 * 0.9}
              height={500 * 0.9}
              x={50} // Adjust positioning if needed
              y={50}
            />
          )}
          {pdfImage && (
            <Image
              image={pdfImage}
              width={800 * 0.9}
              height={500 * 0.9}
              x={50} // Adjust positioning if needed
              y={50}
            />
          )}
        </Layer>
      </Stage>
    </div>
  );
});

export default KonvaCanvas;
