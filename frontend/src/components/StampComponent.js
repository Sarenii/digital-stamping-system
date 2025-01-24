import React from "react";
import { Text, Rect, Group } from "react-konva";

const StampComponent = ({ x, y, text, zoom }) => {
  return (
    <Group x={x} y={y} draggable>
      <Rect
        width={200 * zoom} // Adjust width based on zoom
        height={50 * zoom} // Adjust height based on zoom
        fill="rgba(255, 0, 0, 0.5)" // Red background to represent the stamp
        cornerRadius={10} // Rounded corners
        shadowBlur={5}
      />
      <Text
        text={text}
        fontSize={20 * zoom} // Adjust font size based on zoom
        fontFamily="Arial"
        fill="white" // White text color
        stroke="black"
        strokeWidth={1}
        padding={10}
      />
    </Group>
  );
};

export default StampComponent;
