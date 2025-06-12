import React from "react";

const abnormalitiesMap = {
  0: { name: "Lung Nodules", color: "orange" },
  1: { name: "Consolidation", color: "green" },
  2: { name: "Pleural Effusion", color: "blue" },
  3: { name: "Opacity", color: "pink" },
  4: { name: "Rib Fractures", color: "darkorange" },
  5: { name: "Pneumothorax", color: "cyan" },
  6: { name: "Cardiomegaly", color: "purple" },
  7: { name: "Lymphadenopathy", color: "red" },
  8: { name: "Cavity", color: "lightgreen" },
};

const AbnormalityBar = ({ abnormalities }) => {
  if (!abnormalities || abnormalities.length === 0) {
    return (
      <div className="mt-7 pt-9 text-center text-lg font-semibold dark:text-[#fdfdfd] text-[#030811]">
        No abnormalities found
      </div>
    );
  }

  // Sort abnormalities by score in descending order
  const sortedAbnormalities = abnormalities.sort((a, b) => b.score - a.score);

  // Get color by abnormality name using the map
  const getColorByAbnormalityName = (name) => {
    const match = Object.values(abnormalitiesMap).find(
      (item) => item.name === name
    );
    return match?.color || "gray"; // Fallback to gray if not found
  };

  return (
    <div className="mt-7 pt-9 w-full">
      <h2 className="text-2xl dark:text-[#fdfdfd] text-[#030811] font-bold">Abnormalities</h2>
      <span className="text-sm">
        (detected {
          abnormalities ? Array.from(new Set(abnormalities.map(a => a.name))).length : 0
        } out of 7)
      </span>
      <ul className="mt-4 space-y-4 h-60 overflow-y-auto custom-scrollbar">
        {sortedAbnormalities.map((abnormality) => {
          const scorePercentage = (abnormality.score * 100).toFixed(1);
          const barColor = getColorByAbnormalityName(abnormality.name);

          return (
            <li key={abnormality.id} className="flex flex-col space-y-1">
              <div className="flex justify-between dark:text-[#fdfdfd] text-[#030811] font-medium">
                <span>{abnormality.name}</span>
                <span>{scorePercentage}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700 overflow-hidden">
                <div
                  className="h-2.5 rounded-full"
                  style={{
                    backgroundColor: barColor,
                    width: "0%",
                    animation: `fillBar-${abnormality.id} 1s ease-out forwards`,
                  }}
                />
              </div>
              {/* Keyframe animation for each abnormality */}
              <style>
                {`
                  @keyframes fillBar-${abnormality.id} {
                    from {
                      width: 0%;
                    }
                    to {
                      width: ${scorePercentage}%;
                    }
                  }
                `}
              </style>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default AbnormalityBar;
