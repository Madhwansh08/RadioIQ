import React from 'react';
import ApexCharts from 'react-apexcharts';

const ChartThree = ({ abnormalityGenderCount }) => {
  // Check if abnormalityGenderCount exists and is an object
  if (!abnormalityGenderCount) {
    return <div>Loading...</div>; // Show loading text until data is ready
  }

  // Ensure gender keys exist and have valid arrays, otherwise default to empty arrays
  const maleDataArray = Array.isArray(abnormalityGenderCount.male) ? abnormalityGenderCount.male : [];
  const femaleDataArray = Array.isArray(abnormalityGenderCount.female) ? abnormalityGenderCount.female : [];
  const unknownDataArray = Array.isArray(abnormalityGenderCount.unknown) ? abnormalityGenderCount.unknown : [];

  // Combine all unique abnormality names from male, female, and unknown
  const allAbnormalities = [
    ...new Set([
      ...maleDataArray.map(item => item.name),
      ...femaleDataArray.map(item => item.name),
      ...unknownDataArray.map(item => item.name),
    ]),
  ];

  // If there are no abnormalities, show a message instead of rendering the chart
  if (allAbnormalities.length === 0) {
    return <div>No abnormalities recorded.</div>;
  }

  // Helper function to get the count for a specific abnormality and gender
  const getCountForAbnormality = (genderData, abnormalityName) => {
    const abnormality = genderData.find(item => item.name === abnormalityName);
    return abnormality ? abnormality.count : 0;
  };

  // Map the abnormalities to get counts for each gender
  const maleData = allAbnormalities.map(abnormality => getCountForAbnormality(maleDataArray, abnormality));
  const femaleData = allAbnormalities.map(abnormality => getCountForAbnormality(femaleDataArray, abnormality));
  const unknownData = allAbnormalities.map(abnormality => getCountForAbnormality(unknownDataArray, abnormality));

  const chartData = {
    series: [
      {
        name: 'Male',
        data: maleData,
      },
      {
        name: 'Female',
        data: femaleData,
      },
      {
        name: 'Unknown',
        data: unknownData,
      },
    ],
    options: {
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
          horizontal: true,
        },
      },
      xaxis: {
        categories: allAbnormalities, // Use all unique abnormality names
      },
      fill: {
        opacity: 1,
      },
      legend: {
        position: 'top',
      },
    },
  };

  return (
    <div>
      <h1 className='text-xl font-semibold'>Abnormality By Gender <span className='text-sm font-medium'>(Top 3 abnormalities)</span></h1>
      <ApexCharts options={chartData.options} series={chartData.series} type="bar" height={350} />
    </div>
  );
};

export default ChartThree;
