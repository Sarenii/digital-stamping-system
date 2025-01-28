import React from "react";

const StampComponent = ({ id, x, y, text, borderColor, onDelete }) => {
  return (
    <React.Fragment>
      <text
        x={x}
        y={y}
        fill={borderColor || "black"}
        fontSize={24}
        fontFamily="Arial"
        fontWeight="bold"
      >
        {text}
      </text>
      <circle
        x={x + 50} // Offset for text placement
        y={y + 20} // Offset for text placement
        radius={20}
        stroke={borderColor || "black"}
        strokeWidth={2}
        fill="white"
      />
      <text
        x={x + 30}
        y={y + 15}
        fill={borderColor || "black"}
        fontSize={14}
        fontFamily="Arial"
        textAnchor="middle"
      >
        {text}
      </text>
      <foreignObject x={x + 50} y={y + 40} width={100} height={50}>
        <div
          onClick={() => onDelete(id)}
          className="bg-red-500 text-white rounded px-2 py-1 cursor-pointer"
        >
          Delete
        </div>
      </foreignObject>
    </React.Fragment>
  );
};

export default StampComponent;
