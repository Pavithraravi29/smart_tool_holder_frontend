import React, { useState, useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';
import ScatterNebulaGraph from './ScatterNebulaGraph';

const PlotPage = ({ selectedFile }) => {
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  const [selectedParameter, setSelectedParameter] = useState('Tension');
  const [streamIndex, setStreamIndex] = useState(0);
  const [streaming, setStreaming] = useState(false);


  const parseCSV = (csv) => {
    if (typeof csv !== 'string') {
      console.error('Invalid CSV data. Expected a string.');
      return { labels: [], data: [] };
    }
  
    const lines = csv.split('\n');
    if (lines.length < 2) {
      console.error('Invalid CSV data. Expected at least two lines.');
      return { labels: [], data: [] };
    }
  
    const headers = lines[0].split(';');
    const labels = [];
    const data = [];


    const dateIndex = headers.indexOf('Date/Time');
    const parameterIndex = headers.indexOf(selectedParameter);

    for (let i = 1; i < lines.length; i++) {
      const currentLine = lines[i].split(';');
      const dateTime = currentLine[dateIndex] ? currentLine[dateIndex].split(', ') : [];
      const time = dateTime.length > 1 ? dateTime[1].replace(/(am|pm)/i, '') : '';
      const value = parseFloat(currentLine[parameterIndex]);

      labels.push(time);
      data.push(value);
    }

    return { labels, data };
  };


  const streamData = () => {
    if (!selectedFile) return;
  
    const reader = new FileReader();
  
    reader.onload = (e) => {
      const csvData = e.target.result;
      const { labels, data } = parseCSV(csvData);
  
      const batchSize = 50;
      const totalPoints = labels.length;
  
      let currentIndex = 0;

      const timeDifferences = labels.map((label, index) => {
        if (index > 0) {
          const previousTime = new Date(`2000-01-01 ${labels[index - 1]}`);
          const currentTime = new Date(`2000-01-01 ${label}`);
          return (currentTime - previousTime) / 1000; // Convert milliseconds to seconds
        }
        return 0;
      });
  
      // Calculate the accumulated time differences
      const accumulatedDifferences = timeDifferences.reduce((acc, val, index) => {
        acc.push(index > 0 ? acc[index - 1] + val : val);
        return acc;
      }, []);
  
      // Convert accumulated differences to formatted time strings (HH:mm:ss)
      const formattedTimes = accumulatedDifferences.map((difference) => {
        const hours = Math.floor(difference / 3600);
        const minutes = Math.floor((difference % 3600) / 60);
        const seconds = Math.floor(difference % 60);
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
      });
  
      const x2Labels = [formattedTimes[0], ...formattedTimes.slice(1)]; // Define x2Labels here
      
  
      // Destroy the existing chart before creating a new one
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
  
      const ctx = chartRef.current.getContext('2d');
      chartInstance.current = new Chart(ctx, {
        type: 'line',
        data: {
          labels: [],
          datasets: [
            {
              label: selectedParameter,
              data: [],
              borderColor: 'rgba(255, 0, 0, 1)',
              borderWidth: 2,
              fill: false,
              pointRadius: 0,
            },
          ],
        },
        options: {
          scales: {
            x: {
              type: 'category',
              position: 'top',
              title: {
                display: true,
                text: 'Date/Time',
              },
              ticks: {
                maxTicksLimit: 5,
              },
            },
            x2: {
              type: 'category',
              position: 'bottom',
              title: {
                display: true,
                text: 'Running Time',
              },
              labels: x2Labels,
              ticks: {
                maxTicksLimit: 5,
              },
            },
            y: {
              title: {
                display: true,
                text: selectedParameter,
              },
            },
          },
        },
      });
  
      
  
      const streamInterval = setInterval(() => {
        const endIndex = Math.min(currentIndex + batchSize, totalPoints);
  
        const slicedLabels = labels.slice(currentIndex, endIndex);
        const slicedData = data.slice(currentIndex, endIndex);
  
        chartInstance.current.data.labels.push(...slicedLabels);
        chartInstance.current.data.datasets[0].data.push(...slicedData);
  
        chartInstance.current.update();
  
        currentIndex += batchSize;
  
        if (currentIndex >= totalPoints) {
          clearInterval(streamInterval);
          setStreaming(false);
          console.log('Streaming completed.');
        }
      }, 1000); // 1-second delay
    };
  
    reader.readAsText(selectedFile);
  };
  
  



  useEffect(() => {
    

    const reader = new FileReader();
    reader.onload = (e) => {
      const csvData = e.target.result;
      const { labels, data } = parseCSV(csvData);

      const timeDifferences = labels.map((label, index) => {
        if (index > 0) {
          const previousTime = new Date(`2000-01-01 ${labels[index - 1]}`);
          const currentTime = new Date(`2000-01-01 ${label}`);
          return (currentTime - previousTime) / 1000; // Convert milliseconds to seconds
        }
        return 0;
      });
      

    // Calculate the accumulated time differences
    const accumulatedDifferences = timeDifferences.reduce((acc, val, index) => {
      acc.push(index > 0 ? acc[index - 1] + val : val);
      return acc;
    }, []);

    // Convert accumulated differences to formatted time strings (HH:mm:ss)
    const formattedTimes = accumulatedDifferences.map((difference) => {
      const hours = Math.floor(difference / 3600);
      const minutes = Math.floor((difference % 3600) / 60);
      const seconds = Math.floor(difference % 60);
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    });

    // Set the x2 axis labels to start at 0:00:00
    const x2Labels = [formattedTimes[0], ...formattedTimes.slice(1)];

    // Destroy the existing chart before creating a new one
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    const ctx = chartRef.current.getContext('2d');
    chartInstance.current = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [
          {
            label: selectedParameter,
            data: data,
            borderColor: 'rgba(255, 0, 0, 1)',
            borderWidth: 2,
            fill: false,
            pointRadius: 0,
          },
        ],
      },
      options: {
        scales: {
          x: {
            type: 'category',
            position: 'top',
            title: {
              display: true,
              text: 'Date/Time',
            },
            ticks: {
              maxTicksLimit: 5,
            },
          },
          x2: {
            type: 'category',
            position: 'bottom',
            title: {
              display: true,
              text: 'Running Time',
            },
            labels: x2Labels,
            ticks: {
              maxTicksLimit: 5,
            },
          },
          y: {
            title: {
              display: true,
              text: selectedParameter,
            },
          },
        },
      },
    });

      // Update the x2 axis ticks
      const maxDifference = Math.max(...timeDifferences);
      const stepSize = maxDifference > 0 ? maxDifference : 1;

      chartInstance.current.options.scales.x2.ticks = {
        stepSize: stepSize,
        callback: (value, index, values) => x2Labels[index], // Use x2Labels as tick labels
        max: x2Labels[x2Labels.length - 1],
      };
    };

    reader.readAsText(selectedFile);
   if (streaming) {
      streamData();
    }
  }, [selectedFile, selectedParameter, streaming, streamIndex]);

  const startStream = () => {
    setStreamIndex(0);
    setStreaming(true);
  };



  return (
    <div className="plot-container" >
       <button onClick={startStream} disabled={streaming} style={{ border: '1px solid #000', padding: '5px 10px', marginRight: '10px', backgroundColor:'#1292d6'}}>
          {streaming ? 'Streaming...' : 'Start Streaming'}
        </button>
      <h2 className='font-serif' style={{ fontSize: '22px', textAlign: 'center' }}>
        Set Trigger Limits {selectedParameter}
      </h2>
      <label className='font-serif' style={{ fontSize: '18px' }}>Signal:</label>
      <select
        value={selectedParameter}
        onChange={(e) => setSelectedParameter(e.target.value)}
        style={{ marginBottom: '20px', fontSize: '18px', marginTop: '40px' }}
      >
        <option value="Tension">Tension</option>
        <option value="Torsion">Torsion</option>
        <option value="Bending moment X">Bending moment X</option>
        <option value="Bending moment Y">Bending moment Y</option>
      </select>
      <div style={{ display: 'flex', flexDirection: 'row' , overflow: 'hidden', backgroundColor:'#f1f1f1' ,height:'650px'}} className='bg-slate-700'>
        <div style={{ width: '1200px',height:'600px' , overflow: 'hidden' , }} className='rounded-lg bg-white mt-8 ml-2'>
          <canvas ref={chartRef} />
        </div>
        <div style={{ overflow: 'hidden',height:'600px'}} className='rounded-lg bg-white mt-8 ml-4'>
        <ScatterNebulaGraph selectedFile={selectedFile}  isStreaming={streaming}/>
        </div>
      </div>
    </div>
  );
};

export default PlotPage;
