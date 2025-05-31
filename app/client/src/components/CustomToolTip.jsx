// src/components/common/CustomTooltip.jsx
import React, { useState } from "react";

const CustomTooltip = ({ title, children }) => {
  const [visible, setVisible] = useState(false);

  return (
    <div
      style={{ position: "relative", display: "inline-block" }}
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      {children}
      {visible && (
        <div
          style={{
            position: "absolute",
            bottom: "100%", // positions above the element
            left: "50%",
            transform: "translateX(-50%)",
            marginBottom: "8px",
            padding: "4px 8px",
            backgroundColor: "rgba(0, 0, 0, 0.8)",
            color: "#fff",
            borderRadius: "4px",
            whiteSpace: "nowrap",
            fontSize: "0.75rem",
            zIndex: 1000,
          }}
        >
          {title}
        </div>
      )}
    </div>
  );
};

export default CustomTooltip;
