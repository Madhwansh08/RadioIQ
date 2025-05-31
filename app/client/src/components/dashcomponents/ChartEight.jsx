import React, { useState, useEffect } from "react";
import ClipLoader from "react-spinners/ClipLoader";


const ChartEight = ({ heatmapLink }) => {
  const [loading, setLoading] = useState(true);

  // reset loader when link changes
  useEffect(() => {
    setLoading(true);
  }, [heatmapLink]);

  return (
    <div className="relative bg-white p-4 shadow-md min-h-[600px]">
   
        {(!heatmapLink || loading) && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/75 z-10">
            <ClipLoader
          loading={loading}
          size={60} // px
          color="#5c60c6" // matches your teal
          aria-label="Loading heatmap..."
            />
            <p className="my-2 mx-2 font-semibold text-gray-600">{loading ? "Loading..." : "Processing..."}</p>
          </div>
        )}

        {/* once link is ready, show iframe */}
      {heatmapLink && (
        <iframe
          src={heatmapLink}
          title="Heatmap"
          className="w-full h-[600px] border-none"
          onLoad={() => setLoading(false)}
        />
      )}
    </div>
  );
};

export default ChartEight;
