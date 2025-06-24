import React from 'react';
import ApexCharts from 'react-apexcharts';

const ChartFive = ({ abnormalityLocationCount }) => {
  // Check if data is available
  if (!abnormalityLocationCount || Object.keys(abnormalityLocationCount).length === 0) {
    return <div>Loading...</div>; // Show loading message until data is ready
  }

  // Extract locations and all unique abnormalities
  const locations = Object.keys(abnormalityLocationCount);
  const allAbnormalities = [
    ...new Set(
      Object.values(abnormalityLocationCount).flatMap(locationData =>
        locationData.map(item => item.name)
      )
    ),
  ];

  // Prepare series data for the heatmap
  const series = allAbnormalities.map(abnormality => ({
    name: abnormality,
    data: locations.map(location => {
      const locationData = abnormalityLocationCount[location].find(
        item => item.name === abnormality
      );
      return {
        x: location,
        y: locationData ? locationData.count : 0, // Default to 0 if no data
      };
    }),
  }));

  // Chart configuration
  const chartOptions = {
    chart: {
      type: 'heatmap',
      height: '100%',
      fontFamily: 'poppins',
      toolbar: {
          show: false, // Show toolbar for user interaction
        },
    },
    plotOptions: {
      heatmap: {
        shadeIntensity: 0.5,
        colorScale: {
          ranges: [
            { from: 0, to: 1, color: '#f2ebe9', name: 'Low' },
            { from: 2, to: 3, color: '#F56c17', name: 'Medium' },
            { from: 4, to: 10, color: '#FF1D58', name: 'High' },
          ],
        },
      },
    },
    dataLabels: {
      enabled: false,
    },
    xaxis: {
      type: 'category',
      title: {
        text: 'Locations',
      },
    },
    yaxis: {
      title: {
        text: 'Abnormalities',
      },
    },
    legend: {
      position: 'top',
    },
    tooltip: {
      shared: false,
      y: {
        formatter: value => `${value} case(s)`,
      },
    },
  };

  return (
    <div>
        <h1 className='text-xl font-semibold'>Graph View</h1>
        <div>
      <ApexCharts
        options={chartOptions}
        series={series}
        type="heatmap"
        height={500}
      />
      </div>
    </div>
  );
};

export default ChartFive;
