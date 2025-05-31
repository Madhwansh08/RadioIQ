import React from "react";
import ReactApexChart from "react-apexcharts";


const ChartSix = ({ data }) => {
  // Extracting dates, normal counts, and abnormal counts
  const categories = data.map((day) => day.date);
  const normalCounts = data.map((day) => day.normalCount);
  const abnormalCounts = data.map((day) => day.abnormalCount);

  // ApexCharts Options
  const options = {
    legend: {
      show: true,
      position: "top",
      horizontalAlign: "left",
    },
    colors: ["#10b981", "#ef4444"], // Green for Normal, Red for Abnormal
    chart: {
      fontFamily: "poppins",
      height: 335,
      type: "area",
      dropShadow: {
        enabled: true,
        color: "#623CEA14",
        top: 10,
        blur: 4,
        left: 0,
        opacity: 0.1,
      },
      toolbar: {
        show: false,
      },
    },
    fill: {
      type: "gradient",
      gradient: {
        shade: "dark",
        type: "vertical",
        shadeIntensity: 0.5,
        gradientToColors: ["#34d399", "#f87171"], // Light Green & Light Red
        inverseColors: false,
        opacityFrom: 0.7,
        opacityTo: 0.2,
        stops: [0, 100],
      },
    },
    responsive: [
      {
        breakpoint: 1024,
        options: {
          chart: {
            height: 300,
          },
        },
      },
      {
        breakpoint: 1366,
        options: {
          chart: {
            height: 350,
          },
        },
      },
    ],
    stroke: {
      width: [3, 3], // Line thickness
      curve: "smooth", // Smooth curves
    },
    grid: {
      xaxis: {
        lines: {
          show: true,
        },
      },
      yaxis: {
        lines: {
          show: true,
        },
      },
    },
    dataLabels: {
      enabled: false,
    },
    markers: {
      size: 4,
      colors: "#fff",
      strokeColors: ["#10b981", "#ef4444"],
      strokeWidth: 3,
      strokeOpacity: 0.9,
      strokeDashArray: 0,
      fillOpacity: 1,
      discrete: [],
      hover: {
        size: undefined,
        sizeOffset: 5,
      },
    },
    xaxis: {
      type: "category",
      categories: categories,
      title: {
        text: "Date",
      },
      axisBorder: {
        show: false,
      },
      axisTicks: {
        show: false,
      },
    },
    yaxis: {
      title: {
        text: "X-ray Count",
        style: {
          fontSize: "12px",
        },
      },
      min: 0,
    },
  };

  // Data Series (Two Parallel Line Charts)
  const series = [
    {
      name: "Normal X-rays",
      data: normalCounts,
      color: "#10b981", // Green
    },
    {
      name: "Abnormal X-rays",
      data: abnormalCounts,
      color: "#ef4444", // Red
    },
  ];


  

  return (
    <div className="col-span-12 rounded-sm border border-black/20 border-stroke bg-black dark:bg-white px-5 pt-7.5 pb-5 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5 xl:col-span-8">
      <div className="flex flex-wrap items-start justify-between gap-3 sm:flex-nowrap">
        <div className="flex w-full flex-wrap gap-3 sm:gap-5"></div>
        <div className="flex w-full max-w-45 justify-end mb-1"></div>
      </div>

      <div>
        <h1 className="font-semibold">Normal vs Abnormal X-ray</h1>
        <div id="chartSix" className="-ml-5">
          <ReactApexChart
            options={options}
            series={series}
            type="area"
            height={325}
          />
        </div>
      </div>
    </div>
  );
};

export default ChartSix;
