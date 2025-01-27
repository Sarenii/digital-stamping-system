import React from "react";
import { Text, Ellipse, Group } from "react-konva";

const StampComponent = ({ x, y, text, zoom, shapeColor, textColor, dateColor }) => {
  // Define the size of the oval
  const ovalWidth = 200 * zoom;
  const ovalHeight = 60 * zoom;

  // Create the text node and measure the text size
  const textWidth = text.length * 8 * zoom; // Approximate width of the text
  const textHeight = 16 * zoom; // Approximate height of the text

  return (
    <Group x={x} y={y} draggable>
      {/* Outer Oval Border */}
      <Ellipse
        width={ovalWidth} // Width of the outer oval
        height={ovalHeight} // Height of the outer oval
        fill="white" // White background
        stroke={shapeColor || "blue"} // Border color
        strokeWidth={4} // Border thickness
        shadowBlur={5}
      />
      {/* Inner Oval Border */}
      <Ellipse
        width={ovalWidth - 20 * zoom} // Inner oval slightly smaller
        height={ovalHeight - 10 * zoom}
        fill="white"
        stroke={shapeColor || "blue"}
        strokeWidth={2}
        shadowBlur={3}
      />
      {/* Text inside the oval */}
      <Text
        text={text}
        fontSize={16 * zoom} // Font size of the text
        fontFamily="Arial"
        fill={textColor || "blue"} // Text color
        stroke="black"
        strokeWidth={1}
        padding={5}
        align="center" // Center the text horizontally
        verticalAlign="middle" // Center the text vertically
        x={(ovalWidth - textWidth) / 2} // Center the text horizontally inside the oval
        y={(ovalHeight - textHeight) / 2} // Center the text vertically inside the oval
      />
      {/* Date text */}
      <Text
        text={new Date().toLocaleDateString()}
        fontSize={12 * zoom} // Font size for the date
        fontFamily="Arial"
        fill={dateColor || "black"} // Date text color
        stroke="black"
        strokeWidth={1}
        padding={5}
        align="center" // Center the date horizontally
        verticalAlign="middle" // Center the date vertically
        x={(ovalWidth - textWidth) / 2} // Center the date horizontally inside the oval
        y={ovalHeight - textHeight / 2} // Position the date text at the bottom
      />
    </Group>
  );
};

export default StampComponent;
