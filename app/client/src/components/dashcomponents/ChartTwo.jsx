import React from "react";
import ReactApexChart from "react-apexcharts";

const ChartTwo = ({ commonAbnormalities }) => {
  const labels = commonAbnormalities.map((item) => item.name);
  const series = commonAbnormalities.map((item) => item.count);

  const options = {
    chart: {
      type: "donut",
      height: 350,
      width: 400,
    }, 
    colors: ["#030811", "#5c60c6", "#030562"],
    labels: labels,
    legend: {
      show: true,
      position: "bottom",
    },
    plotOptions: {
      pie: {
        donut: {
          size: "65%",
        },
      },
    },
    dataLabels: {
      enabled: false,
    },
    responsive: [
      {
        breakpoint: 2600,
        options: {
          chart: {
            width: 380,
          },
        },
      },
      {
        breakpoint: 640,
        options: {
          chart: {
            width: 200,
          },
        },
      },
    ],
  };

  return (
    <div className="sm:px-7.5 col-span-12 rounded-sm border border-black/20 border-stroke bg-black dark:bg-white px-5 pb-5 pt-7.5 shadow-default dark:border-strokedark dark:bg-boxdark xl:col-span-5">
      <div className="mb-3">
        <h5 className="text-xl font-semibold text-white dark:text-black">
          Top 3 Common Abnormalities
        </h5>
      </div>
      <div
        id="chartThree"
        className="mx-auto flex justify-center items-center"
        style={{ width: 400, height: 350, background: "#f0f0f0" }}
      >
        <ReactApexChart
          options={options}
          series={series}
          type="donut"
          height={350}
        />
      </div>
    </div>
  );
};

export default ChartTwo;
