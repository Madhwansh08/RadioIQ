// src/components/CircularLoader.jsx
import React from 'react';
import { RingLoader } from 'react-spinners';

const CircularLoader = ({ progress }) => {
  return (
    <div className="relative inline-flex">
      {/* Spinner */}
      <RingLoader
        size={60}
        color="#5c60c6"
        // you can optionally pause the spinner when progress hits 100
        // by toggling `loading={progress < 100}`
        loading={true}
      />
      {/* Percentage Overlay */}
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-xs font-bold text-[#030811] dark:text-[#fdfdfd]">
          {Math.round(progress)}%
        </span>
      </div>
    </div>
  );
};

export default CircularLoader;
