import React, { useState, useEffect } from 'react';
import Papa from 'papaparse'; // Import the CSV parser
import './App.css';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

// --- YOUR GOOGLE SHEET URL ---
const YOUR_GOOGLE_SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRlGd0_jKM_2Hho01f3R2-SzbQzYLmGGlQuo-BupC8Q-p_EPxv0IUBaQSPjCDDrpLa9LJwraWN29BZ_/pub?gid=565688224&single=true&output=csv';
// -----------------------------


// --- Dropdown Selector (No Change) ---
function MangoSelector({ mangoNumbers, selectedMango, onChange }) {
  return (
    <div className="mango-selector">
      <label htmlFor="mango-select">Select a Mango:</label>
      <select 
        id="mango-select" 
        value={selectedMango} 
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">-- Select a Mango --</option>
        {mangoNumbers.map(num => (
          <option key={num} value={num}>
            Mango #{num}
          </option>
        ))}
      </select>
    </div>
  );
}

// --- Chart Component (No Change) ---
function WeightChart({ entries }) {
  // Helper function to parse dates
  const parseDate = (dateString) => {
    const parts = dateString.split('-'); // [DD, MM, YYYY]
    return new Date(parts[2], parts[1] - 1, parts[0]);
  };

  // Sort the entries by date (oldest first)
  const chartData = [...entries].sort((a, b) => parseDate(a.date) - parseDate(b.date));

  // Get the mango number (it will be the same for all entries)
  const mangoNum = chartData.length > 0 ? chartData[0].mango_no : 'N/A';
  
  // Create the labels (X-axis) from the dates
  const labels = chartData.map(entry => entry.date);

  // Create a single dataset for this mango
  const data = {
    labels: labels,
    datasets: [
      {
        label: `Weight (g) - Mango #${mangoNum}`,
        data: chartData.map(entry => entry.weight), // Y-axis data
        fill: false,
        backgroundColor: '#1f77b4', // Blue
        borderColor: '#1f77b4',
        tension: 0.1,
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false, // For fullscreen
    plugins: {
      title: { display: true, text: `Weight Loss for Mango #${mangoNum}` },
      legend: {
        display: false // Hide legend, since there is only one line
      }
    },
    scales: {
      x: {
        title: { display: true, text: 'Date' },
        ticks: { autoSkip: true, maxRotation: 0 }
      },
      y: {
        title: { display: true, text: 'Weight (g)' },
        min: 50,
        max: 600,
        ticks: { stepSize: 50 }
      }
    }
  };

  return <Line options={options} data={data} />;
}


// --- UPDATED APP COMPONENT ---
// Now calculates the percentage loss
function App() {
  const [allData, setAllData] = useState([]);
  const [allMangoNumbers, setAllMangoNumbers] = useState([]);
  const [selectedMango, setSelectedMango] = useState('');
  const [displayData, setDisplayData] = useState([]);
  const [weightLossPercent, setWeightLossPercent] = useState(0);

  // 1. This effect runs once on load to get all data
  useEffect(() => {
    Papa.parse(YOUR_GOOGLE_SHEET_CSV_URL, {
      download: true,
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      complete: (results) => {
        // --- THIS IS THE CHANGE ---
        // A list of mango numbers to exclude
        const excludeList = [0, 33, 34];
        // -------------------------
        
        const parsedData = results.data
          .filter(row => row.Timestamp && row['Weight (g)'] !== null && row['Weight (g)'] !== undefined)
          .map((row, index) => ({ 
            id: `${row.Timestamp}-${row.mango_no}-${index}`, 
            mango_no: row.mango_no,
            date: row.Timestamp,
            weight: row['Weight (g)'] 
          }))
          // --- ADDED THIS FILTER ---
          .filter(row => !excludeList.includes(row.mango_no));
        
        // Save the filtered data
        setAllData(parsedData);

        // Find all unique mango numbers from the filtered data
        const mangoNos = [...new Set(parsedData.map(e => e.mango_no))].sort((a, b) => a - b);
        setAllMangoNumbers(mangoNos);
      },
      error: (err) => {
        console.error("Error fetching or parsing data:", err);
      }
    });
  }, []);

  // Helper function to parse dates (needed for sorting)
  const parseDate = (dateString) => {
    const parts = dateString.split('-'); // [DD, MM, YYYY]
    return new Date(parts[2], parts[1] - 1, parts[0]);
  };

  // 2. This effect runs whenever the user picks a new mango
  useEffect(() => {
    if (selectedMango === '') {
      setDisplayData([]);
      setWeightLossPercent(0); // Reset percentage
    } else {
      // Filter data for the selected mango
      const filtered = allData.filter(entry => entry.mango_no === parseInt(selectedMango));
      setDisplayData(filtered);
      
      // Calculation
      if (filtered.length > 1) {
        // Sort the data by date
        const sortedData = [...filtered].sort((a, b) => parseDate(a.date) - parseDate(b.date));
        
        // Get start and end weights
        const startWeight = sortedData[0].weight;
        const endWeight = sortedData[sortedData.length - 1].weight;
        
        // Calculate percentage
        const percent = ((startWeight - endWeight) / startWeight) * 100;
        setWeightLossPercent(percent);
      } else {
        setWeightLossPercent(0); // Not enough data
      }
    }
  }, [selectedMango, allData]); // Re-run when selectedMango or allData changes

  return (
    <div className="App">
      <header>
        <h1>Weight Tracker</h1>
        <MangoSelector 
          mangoNumbers={allMangoNumbers}
          selectedMango={selectedMango}
          onChange={(newMango) => setSelectedMango(newMango)}
        />
      </header>
      <main>
        {/* Stats Display */}
        {displayData.length > 0 && (
          <div className="stats-container">
            <h2>Total Weight Loss: {weightLossPercent.toFixed(2)}%</h2>
          </div>
        )}
        
        <div className="chart-container">
          {displayData.length > 0 ? (
            <WeightChart entries={displayData} />
          ) : (
            <p className="chart-placeholder">Please select a mango to see its graph and stats.</p>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;