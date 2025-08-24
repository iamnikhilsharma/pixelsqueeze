import React from 'react';
import { motion } from 'framer-motion';
import { 
  Line, 
  Bar, 
  Doughnut
} from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    borderColor?: string;
    backgroundColor?: string | string[];
    fill?: boolean;
    tension?: number;
    borderWidth?: number;
  }[];
}

interface AdminChartProps {
  type: 'line' | 'bar' | 'doughnut';
  data: ChartData;
  title: string;
  subtitle?: string;
  height?: number;
  className?: string;
  showLegend?: boolean;
  showGrid?: boolean;
  animate?: boolean;
}

const AdminChart: React.FC<AdminChartProps> = ({
  type,
  data,
  title,
  subtitle,
  height = 300,
  className = '',
  showLegend = true,
  showGrid = true,
  animate = true
}) => {
  const baseOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: showLegend,
        position: 'bottom' as const,
        labels: {
          padding: 20,
          usePointStyle: true,
          font: {
            size: 12
          }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: true
      }
    },
    scales: showGrid ? {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
          drawBorder: false
        },
        ticks: {
          font: {
            size: 11
          },
          color: '#6B7280'
        }
      },
      x: {
        grid: {
          display: false
        },
        ticks: {
          font: {
            size: 11
          },
          color: '#6B7280'
        }
      }
    } : undefined
  };

  const renderChart = () => {
    switch (type) {
      case 'line':
        return (
          <Line 
            data={data} 
            options={{
              ...baseOptions,
              elements: {
                point: {
                  radius: animate ? 4 : 0,
                  hoverRadius: 6,
                  backgroundColor: '#ffffff',
                  borderWidth: 2
                },
                line: {
                  tension: 0.4
                }
              }
            }}
          />
        );
      
      case 'bar':
        return (
          <Bar 
            data={data} 
            options={{
              ...baseOptions,
              elements: {
                bar: {
                  borderRadius: 4
                }
              }
            }}
          />
        );
      
      case 'doughnut':
        return (
          <Doughnut 
            data={data} 
            options={{
              ...baseOptions,
              cutout: '60%',
              elements: {
                arc: {
                  borderWidth: 2,
                  borderColor: '#ffffff'
                }
              }
            }}
          />
        );
      
      default:
        return null;
    }
  };

  return (
    <motion.div
      initial={animate ? { opacity: 0, y: 20 } : { opacity: 1, y: 0 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-xl bg-white p-6 shadow-lg ${className}`}
    >
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        {subtitle && (
          <p className="text-sm text-gray-600 mt-1">{subtitle}</p>
        )}
      </div>
      
      <div style={{ height }}>
        {renderChart()}
      </div>
    </motion.div>
  );
};

export default AdminChart;
