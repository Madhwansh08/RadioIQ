import React from "react";
import Chart from "react-apexcharts";

const ChartSeven = ({ tbCategories }) => {
  const chartData = {
    series: [tbCategories.low, tbCategories.medium, tbCategories.high],
    options: {
      chart: {
        type: "pie",
        fontFamily: "poppins",
        background: "transparent", // Transparent background for a modern look
        foreColor: "#030811", // Text color
        toolbar: {
          show: false, // Show toolbar for user interaction
        },
      },
      labels: ["Low Possibility", "Medium Possibility", "High Possibility"],
      colors: ["#5c60c6", "#30346c", "#030811"], // Color scheme
      dataLabels: {
        enabled: true, // Show data labels
        style: {
          fontSize: "12px",
          fontFamily: "poppins",
          fontWeight: "bold",
          colors: ["#fdfdfd"], // White text for better contrast
        },
        // dropShadow: {
        //   enabled: true, // Add shadow to data labels
        //   blur: 3,
        //   opacity: 0.5,
        // },
      },
      stroke: {
        show: true,
        width: 2,
        colors: ["#ffffff"], // White border for slices
      },
      legend: {
        position: "bottom", // Position legend at the bottom
        horizontalAlign: "center", // Center-align legend
        fontSize: "12px",
        fontFamily: "poppins",
        fontWeight: 500,
        labels: {
          colors: "#030811", // Legend text color
        },
        markers: {
          width: 12,
          height: 12,
          radius: 12, // Rounded legend markers
        },
      },
      tooltip: {
        enabled: true, // Enable tooltips
        theme: "dark", // Dark theme for tooltips
        style: {
          fontSize: "14px",
          fontFamily: "poppins",
        },
      },
      plotOptions: {
        pie: {
          expandOnClick: true, // Expand slices on click
          donut: {
            labels: {
              show: false, // Hide donut labels (not needed for pie chart)
            },
          },
        },
      },
      responsive: [
        {
          breakpoint: 480, // Adjust for smaller screens
          options: {
            chart: {
              width: "100%", // Full width on small screens
            },
            legend: {
              position: "bottom", // Keep legend at the bottom
            },
          },
        },
      ],
    },
  };

  return (
    <div className="bg-white border border-black/20 border-stroke my-4 p-6 rounded-lg">
      <h2 className="text-2xl font-semibold mb-4 text-[#030811]">TB Cases Possibility</h2>
      <Chart
        options={chartData.options}
        series={chartData.series}
        type="pie"
        height={350}
      />
    </div>
  );
};

export default ChartSeven;