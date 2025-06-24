import React from 'react';
import ApexCharts from 'react-apexcharts';

const ChartFour = ({ abnoramlityAgeCount }) => {
  // Check if data is available
  if (!abnoramlityAgeCount || Object.keys(abnoramlityAgeCount).length === 0) {
    return <div>Loading...</div>; // Show loading message until data is ready
  }

  // Extract abnormalities and their counts for each age group
  const ageGroups = Object.keys(abnoramlityAgeCount);
  const allAbnormalities = [
    ...new Set(
      Object.values(abnoramlityAgeCount).flatMap(ageGroup =>
        ageGroup.map(item => item.name)
      )
    ),
  ];

  // Prepare series data for the chart
  const series = allAbnormalities.map(abnormality => ({
    name: abnormality,
    data: ageGroups.map(ageGroup => {
      const ageData = abnoramlityAgeCount[ageGroup].find(
        item => item.name === abnormality
      );
      return ageData ? ageData.count : 0; // Default to 0 if no count is available
    }),
  }));

  // Chart configuration
  const chartOptions = {
    chart: {
      type: 'bar',
      stacked: true,
      height: '100%',
      fontFamily: 'poppins',
      toolbar: {
          show: false, // Show toolbar for user interaction
        },
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: '60%',
      },
    },
    xaxis: {
      categories: ageGroups,
      title: {
        text: 'Age Groups',
      },
    },
    yaxis: {
      title: {
        text: 'Count',
      },
    },
    legend: {
      position: 'top',
      horizontalAlign: 'center',
    },
    fill: {
      opacity: 1,
    },
    dataLabels: {
      enabled: false,
    },
    tooltip: {
      shared: true,
      intersect: false,
    },
  };

  return (
    <div>
        <h1 className='text-xl font-semibold'>Abnormality By Age Range <span className='text-sm font-medium'>(Top 3 abnormalities)</span></h1>
      <ApexCharts
        options={chartOptions}
        series={series}
        type="bar"
        height={400}
      />
    </div>
  );
};

export default ChartFour;
