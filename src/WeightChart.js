import React from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

function WeightChart({ entries }) {
  // 1. Sort by date, from newest to oldest
  const sortedEntries = [...entries].sort((a, b) => new Date(b.date) - new Date(a.date));
  
  // 2. Get the last 6
  const lastSix = sortedEntries.slice(0, 6);

  // 3. Reverse the array so the chart shows oldest to newest (left-to-right)
  const chartData = lastSix.reverse();

  const data = {
    labels: chartData.map(entry => entry.date), // X-axis labels
    datasets: [
      {
        label: 'Weight (kg)',
        data: chartData.map(entry => entry.weight), // Y-axis data
        fill: false,
        backgroundColor: '#4a90e2',
        borderColor: '#4a90e2',
        tension: 0.1
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Weight Trend (Last 6 Entries)',
      },
    },
  };

  return <Line options={options} data={data} />;
}

export default WeightChart;