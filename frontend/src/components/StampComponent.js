import React from "react";
import { Group, Circle, Rect, Shape, Text, TextPath, Image as KonvaImage } from "react-konva";

// Stamp Dimensions
const STAMP_SIZE = 120;        // Base diameter/width
const BORDER_WIDTH = 1.5;      // Border thickness
const RING_GAP = 15;           // Gap between outer & inner border (for circle/square)
const ARC_PADDING = 8;         // Extra inset for arc text so it doesn't overlap lines
const STAR_SYMBOL = "★";       // Symbol used for the circle’s left/right stars

/**
 * Draw a star using raw canvas commands (for the Star shape).
 */
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
    // Outer vertex
    let xPos = centerX + Math.cos(rot) * outerRadius;
    let yPos = centerY + Math.sin(rot) * outerRadius;
    ctx.lineTo(xPos, yPos);
    rot += step;

    // Inner vertex
    xPos = centerX + Math.cos(rot) * innerRadius;
    yPos = centerY + Math.sin(rot) * innerRadius;
    ctx.lineTo(xPos, yPos);
    rot += step;
  }
  ctx.closePath();
}

/**
 * Build an arc path for <TextPath/>, using SVG arc commands.
 * - (cx, cy): circle center
 * - r: radius
 * - startAngle, endAngle: in radians
 */
function arcPath(cx, cy, r, startAngle, endAngle, clockwise = false) {
  const startX = cx + r * Math.cos(startAngle);
  const startY = cy + r * Math.sin(startAngle);
  const endX = cx + r * Math.cos(endAngle);
  const endY = cy + r * Math.sin(endAngle);
  const sweepFlag = clockwise ? 0 : 1;

  // "large-arc-flag=0" (never exceed 180°).
  // Format: M x1,y1 A rx,ry 0 0,sweepFlag x2,y2
  return `M ${startX},${startY} A ${r},${r} 0 0,${sweepFlag} ${endX},${endY}`;
}

const StampComponent = ({
  // Basic stamp props
  id,
  x,
  y,
  zoom,
  shape = "Circle",
  shape_color = "#0077B5",
  text_color = "#000000",
  date_color = "#434649",
  top_text = "",
  bottom_text = "",
  date = "",
  // For QR
  qrImage,             // A Konva-compatible image object for the QR
  // Event handlers
  onDelete,
  onDragEnd,
  // Position offset for multi-page
  pageY
}) => {
  //
  // Positioning / Scaling
  //
  const scaledX = x * zoom;
  const scaledY = y * zoom + pageY;
  const mainFontSize = 14 * zoom;
  const dateFontSize = 12 * zoom;
  const starFontSize = 16 * zoom;

  /**
   * Drag end → update parent with new (x,y)
   */
  const handleDragEnd = (e) => {
    const { x: newX, y: newY } = e.target.position();
    if (onDragEnd) {
      onDragEnd(id, newX / zoom, (newY - pageY) / zoom);
    }
  };

  /**
   * Delete stamp → call parent, stop event bubble
   */
  const handleDelete = (e) => {
    e.cancelBubble = true;
    onDelete(id);
  };

  return (
    <Group
      x={scaledX}
      y={scaledY}
      width={STAMP_SIZE}
      height={STAMP_SIZE}
      draggable
      onDragEnd={handleDragEnd}
    >
      {/** ============== QR CODE ============== **/}
      {shape === "QR" && qrImage && (
        <>
          {/* Render a Konva Image for the QR code */}
          <KonvaImage
            image={qrImage}
            width={STAMP_SIZE}
            height={STAMP_SIZE}
            listening={false}
          />
          {/* You could optionally add text below or above the QR */}
        </>
      )}

      {/** =============== CIRCLE =============== **/}
      {shape === "Circle" && (
        <>
          {/* Outer ring */}
          <Circle
            radius={STAMP_SIZE / 2}
            stroke={shape_color}
            strokeWidth={BORDER_WIDTH}
            fill="transparent"
            x={STAMP_SIZE / 2}
            y={STAMP_SIZE / 2}
          />
          {/* Inner ring */}
          <Circle
            radius={STAMP_SIZE / 2 - RING_GAP}
            stroke={shape_color}
            strokeWidth={BORDER_WIDTH}
            fill="transparent"
            x={STAMP_SIZE / 2}
            y={STAMP_SIZE / 2}
          />

          {/* Top text in arc (180°→360°) */}
          {top_text && (
            <TextPath
              fill={text_color}
              fontSize={mainFontSize}
              fontStyle="bold"
              data={arcPath(
                STAMP_SIZE / 2,
                STAMP_SIZE / 2,
                STAMP_SIZE / 2 - ARC_PADDING,
                Math.PI,       // startAngle: 180°
                2 * Math.PI    // endAngle: 360°
              )}
              text={top_text.toUpperCase()}
              align="center"
              listening={false}
            />
          )}

          {/* Bottom text in arc (0°→180°) */}
          {bottom_text && (
            <TextPath
              fill={text_color}
              fontSize={mainFontSize}
              fontStyle="bold"
              data={arcPath(
                STAMP_SIZE / 2,
                STAMP_SIZE / 2,
                STAMP_SIZE / 2 - ARC_PADDING,
                0,         // startAngle
                Math.PI    // endAngle
              )}
              text={bottom_text.toUpperCase()}
              align="center"
              listening={false}
            />
          )}

          {/* Left Star (π) */}
          <Text
            text={STAR_SYMBOL}
            fill={shape_color}
            fontSize={starFontSize}
            fontStyle="bold"
            offsetX={starFontSize / 2}
            offsetY={starFontSize / 2}
            x={
              (STAMP_SIZE / 2) +
              (STAMP_SIZE / 2 - RING_GAP / 2) * Math.cos(Math.PI)
            }
            y={
              (STAMP_SIZE / 2) +
              (STAMP_SIZE / 2 - RING_GAP / 2) * Math.sin(Math.PI)
            }
            listening={false}
          />

          {/* Right Star (0) */}
          <Text
            text={STAR_SYMBOL}
            fill={shape_color}
            fontSize={starFontSize}
            fontStyle="bold"
            offsetX={starFontSize / 2}
            offsetY={starFontSize / 2}
            x={
              (STAMP_SIZE / 2) +
              (STAMP_SIZE / 2 - RING_GAP / 2) * Math.cos(0)
            }
            y={
              (STAMP_SIZE / 2) +
              (STAMP_SIZE / 2 - RING_GAP / 2) * Math.sin(0)
            }
            listening={false}
          />

          {/* Centered date */}
          {date && (
            <Text
              text={date}
              fill={date_color}
              fontSize={dateFontSize}
              fontStyle="bold"
              width={STAMP_SIZE}
              align="center"
              x={0}
              y={STAMP_SIZE / 2 - dateFontSize / 2}
              listening={false}
            />
          )}
        </>
      )}

      {/** =============== SQUARE =============== **/}
      {shape === "Square" && (
        <>
          {/* Outer square */}
          <Rect
            width={STAMP_SIZE}
            height={STAMP_SIZE}
            stroke={shape_color}
            strokeWidth={BORDER_WIDTH}
            fill="transparent"
          />
          {/* Inner square */}
          <Rect
            width={STAMP_SIZE - RING_GAP * 2}
            height={STAMP_SIZE - RING_GAP * 2}
            x={RING_GAP}
            y={RING_GAP}
            stroke={shape_color}
            strokeWidth={BORDER_WIDTH}
            fill="transparent"
          />

          {/* Top text */}
          {top_text && (
            <Text
              text={top_text.toUpperCase()}
              fill={text_color}
              fontSize={mainFontSize}
              fontStyle="bold"
              width={STAMP_SIZE}
              align="center"
              x={0}
              y={RING_GAP + 5}
              listening={false}
            />
          )}
          {/* Bottom text */}
          {bottom_text && (
            <Text
              text={bottom_text.toUpperCase()}
              fill={text_color}
              fontSize={mainFontSize}
              fontStyle="bold"
              width={STAMP_SIZE}
              align="center"
              x={0}
              y={STAMP_SIZE - RING_GAP - mainFontSize - 5}
              listening={false}
            />
          )}
          {/* Centered Date */}
          {date && (
            <Text
              text={date}
              fill={date_color}
              fontSize={dateFontSize}
              fontStyle="bold"
              width={STAMP_SIZE}
              align="center"
              x={0}
              y={STAMP_SIZE / 2 - dateFontSize / 2}
              listening={false}
            />
          )}
        </>
      )}

      {/** =============== STAR =============== **/}
      {shape === "Star" && (
        <>
          {/* Outer star */}
          <Shape
            sceneFunc={(ctx, shapeRef) => {
              drawStar(ctx, STAMP_SIZE);
              ctx.stroke();
              ctx.fillStrokeShape(shapeRef);
            }}
            stroke={shape_color}
            strokeWidth={BORDER_WIDTH}
            fill="transparent"
          />
          {/* Inner star */}
          <Shape
            sceneFunc={(ctx, shapeRef) => {
              drawStar(ctx, STAMP_SIZE - RING_GAP * 2);
              ctx.stroke();
              ctx.fillStrokeShape(shapeRef);
            }}
            x={RING_GAP}
            y={RING_GAP}
            stroke={shape_color}
            strokeWidth={BORDER_WIDTH}
            fill="transparent"
          />

          {/* Top text */}
          {top_text && (
            <Text
              text={top_text.toUpperCase()}
              fill={text_color}
              fontSize={mainFontSize}
              fontStyle="bold"
              width={STAMP_SIZE}
              align="center"
              x={0}
              y={RING_GAP * 0.5}
              listening={false}
            />
          )}
          {/* Bottom text */}
          {bottom_text && (
            <Text
              text={bottom_text.toUpperCase()}
              fill={text_color}
              fontSize={mainFontSize}
              fontStyle="bold"
              width={STAMP_SIZE}
              align="center"
              x={0}
              y={STAMP_SIZE - mainFontSize - RING_GAP * 0.5}
              listening={false}
            />
          )}
          {/* Centered date */}
          {date && (
            <Text
              text={date}
              fill={date_color}
              fontSize={dateFontSize}
              fontStyle="bold"
              width={STAMP_SIZE}
              align="center"
              x={0}
              y={STAMP_SIZE / 2 - dateFontSize / 2}
              listening={false}
            />
          )}
        </>
      )}

      {/** ============== DELETE (X) ============== **/}
      <Text
        text="X"
        fontSize={16 * zoom}
        fill="red"
        width={16 * zoom}
        height={16 * zoom}
        x={STAMP_SIZE - 20 * zoom}
        y={4 * zoom}
        align="center"
        verticalAlign="middle"
        onClick={handleDelete}
        style={{ cursor: "pointer" }}
      />
    </Group>
  );
};

export default StampComponent;
