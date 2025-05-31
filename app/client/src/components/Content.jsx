import React from "react";
import { useNavigate } from "react-router-dom";

const Content = () => {
  const navigate = useNavigate();

  return (
    <section className="py-16 dark:gradient-background  sm:py-20 lg:py-28">
      <div className="px-6 mx-auto sm:px-8 lg:px-10 max-w-7xl text-center">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-4xl font-extrabold leading-tight dark:text-[#fdfdfd] text-[#030811] sm:text-5xl lg:text-7xl mb-6">
            X-Ray Analysis
          </h2>
          <p className="text-lg sm:text-xl lg:text-2xl leading-relaxed dark:text-[#fdfdfd] text-[#030811]">
            Our system assists doctors by efficiently detecting anomalies in
            Chest X-rays and generating detailed reports to enhance their
            diagnostic decisions. It streamlines the interpretation process,
            offering greater speed and precision, ultimately supporting better
            patient care.{" "}
          </p>
        </div>
        <div className="mt-12">
          <button
            onClick={() => navigate("/analysis/upload")}
            className="cursor-pointer font-bold dark:bg-[#030811] bg-[#fdfdfd] border-2 shadow-lg border-[#231b6e] dark:text-[#fdfdfd] text-[#030811] py-8 px-24 rounded-full text-xl transition-all duration-300 hover:shadow-purple-500/50 hover:scale-105"
          >
            Analyse
          </button>
        </div>
      </div>
    </section>
  );
};

export default Content;
