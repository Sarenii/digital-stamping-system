import React from "react";
import { Group, Shape, Rect, Circle, Text } from "react-konva";

const STAMP_WIDTH = 120;
const STAMP_HEIGHT = 120;

function drawStar(ctx, size) {
  // A 5-point star path
  const spikes = 5;
  const outerRadius = size / 2;
  const innerRadius = size / 4;
  let rot = Math.PI / 2 * 3;
  let x = size / 2;
  let y = size / 2;
  let step = Math.PI / spikes;

  ctx.beginPath();
  for (let i = 0; i < spikes; i++) {
    let xPos = x + Math.cos(rot) * outerRadius;
    let yPos = y + Math.sin(rot) * outerRadius;
    ctx.lineTo(xPos, yPos);
    rot += step;

    xPos = x + Math.cos(rot) * innerRadius;
    yPos = y + Math.sin(rot) * innerRadius;
    ctx.lineTo(xPos, yPos);
    rot += step;
  }
  ctx.lineTo(x, y - outerRadius);
  ctx.closePath();
  ctx.fillStrokeShape(this);
}

const StampComponent = ({
  id,
  x,
  y,
  zoom,
  shape = "Circle",
  shape_color = "#fff",
  date_color = "#888",
  text_color = "#000",
  top_text = "",
  bottom_text = "",
  date = "",
  onDelete,
  onDragEnd,
  pageY,
}) => {
  const scaledX = x * zoom;
  const scaledY = y * zoom + pageY;

  // When drag ends, tell parent new unscaled position
  const handleDragEnd = (e) => {
    const { x: newX, y: newY } = e.target.position();
    const unscaledX = newX / zoom;
    const unscaledY = (newY - pageY) / zoom;
    if (onDragEnd) {
      onDragEnd(id, unscaledX, unscaledY);
    }
  };

  const handleDelete = (e) => {
    e.cancelBubble = true;
    onDelete(id);
  };

  const scaledWidth = STAMP_WIDTH * zoom;
  const scaledHeight = STAMP_HEIGHT * zoom;

  return (
    <Group
      x={scaledX}
      y={scaledY}
      draggable
      onDragEnd={handleDragEnd}
      width={scaledWidth}
      height={scaledHeight}
    >
      {/* Outer shape */}
      {shape === "Square" && (
        <Rect
          width={scaledWidth}
          height={scaledHeight}
          fill={shape_color}
          stroke="#000"
          strokeWidth={2}
        />
      )}
      {shape === "Circle" && (
        <Circle
          radius={scaledWidth / 2}
          fill={shape_color}
          stroke="#000"
          strokeWidth={2}
          x={scaledWidth / 2}
          y={scaledHeight / 2}
        />
      )}
      {shape === "Star" && (
        <Shape
          sceneFunc={(ctx, shapeRef) => drawStar.call(shapeRef, ctx, scaledWidth)}
          fill={shape_color}
          stroke="#000"
          strokeWidth={2}
        />
      )}

      {/* Inner shape: replicate the manager's "white" center if desired */}
      <Group>
        {/* e.g. smaller shape with white fill */}
        {shape === "Square" && (
          <Rect
            x={scaledWidth / 6}
            y={scaledHeight / 6}
            width={(scaledWidth * 2) / 3}
            height={(scaledHeight * 2) / 3}
            fill="#fff"
          />
        )}
        {shape === "Circle" && (
          <Circle
            x={scaledWidth / 2}
            y={scaledHeight / 2}
            radius={scaledWidth / 3}
            fill="#fff"
          />
        )}
        {shape === "Star" && (
          <Shape
            x={scaledWidth / 6}
            y={scaledHeight / 6}
            sceneFunc={(ctx, shapeRef) =>
              drawStar.call(shapeRef, ctx, (scaledWidth * 2) / 3)
            }
            fill="#fff"
          />
        )}
      </Group>

      {/* Top text */}
      <Text
        text={top_text}
        x={0}
        y={scaledHeight * 0.1}
        width={scaledWidth}
        fontSize={14 * zoom}
        fill={text_color}
        fontStyle="bold"
        align="center"
        listening={false}
      />

      {/* Date (middle) */}
      <Text
        text={date}
        x={0}
        y={scaledHeight * 0.45}
        width={scaledWidth}
        fontSize={12 * zoom}
        fill={date_color}
        align="center"
        listening={false}
      />

      {/* Bottom text */}
      <Text
        text={bottom_text}
        x={0}
        y={scaledHeight * 0.75}
        width={scaledWidth}
        fontSize={14 * zoom}
        fill={text_color}
        fontStyle="bold"
        align="center"
        listening={false}
      />

      {/* 'X' button */}
      <Text
        text="X"
        fontSize={16 * zoom}
        fill="red"
        x={scaledWidth - 20 * zoom}
        y={4 * zoom}
        width={16 * zoom}
        height={16 * zoom}
        align="center"
        verticalAlign="middle"
        onClick={handleDelete}
        style={{ cursor: "pointer" }}
      />
    </Group>
  );
};

export default StampComponent;