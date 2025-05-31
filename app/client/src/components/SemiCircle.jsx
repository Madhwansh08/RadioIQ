import React from "react";

const SemiCircle = ({ percentage }) => {
  const radius = 50; // Radius of the semi-circle
  const circumference = Math.PI * radius; // Circumference for the semi-circle

  // Determine criticality level based on the percentage
  const getCriticalityLevel = (percentage) => {
    if (percentage <= 30) return { label: "Low", color: "#10b981" }; // Green for low
    if (percentage > 30 && percentage <= 70) return { label: "Medium", color: "#facc15" }; // Yellow for medium
    if (percentage > 70 && percentage <= 90) return { label: "High", color: "#f59e0b" }; // Orange for high
    return { label: "High", color: "#ef4444" }; // Red for critical
  };

  const { label, color } = getCriticalityLevel(percentage); // Get label and color based on the percentage

  return (
    <div className="w-64 h-32 flex flex-col items-center">
      <svg
        width="140"
        height="80"
        viewBox="0 0 140 80"
        xmlns="http://www.w3.org/2000/svg"
        className="relative"
      >
        {/* Static white trail */}
        <path
          d="M20,70 A50,50 0 1,1 120,70"
          fill="none"
          stroke="#e5e7eb" // White trail color
          strokeWidth="10"
        />
        {/* Animated blue trail */}
        <path
          d="M20,70 A50,50 0 1,1 120,70"
          fill="none"
          stroke={color} // Color changes based on criticality level
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference} // Start with full offset (hidden)
          style={{
            animation: `dashAnimation 2s ease-out forwards`,
          }}
        />
      </svg>
      <div className="text-center mt-2">
        <p className="text-lg font-bold" style={{ color }}>
          {label} {/* Display the criticality label */}
        </p>
      </div>
      {/* Inline keyframes for the animation */}
      <style>
        {`
          @keyframes dashAnimation {
            from {
              stroke-dashoffset: ${circumference};
            }
            to {
              stroke-dashoffset: ${(1 - percentage / 100) * circumference};
            }
          }
        `}
      </style>
    </div>
  );
};

export default SemiCircle;
