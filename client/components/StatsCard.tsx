import React from 'react';
import { motion } from 'framer-motion';

interface StatsCardProps {
  title: string;
  value: string | number;
  total?: number;
  unit?: string;
  color?: 'primary' | 'secondary' | 'success' | 'warning';
  icon?: React.ComponentType<{ className?: string }> | string;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
}

const colorClasses = {
  primary: 'bg-blue-50 text-blue-600 border-blue-200',
  secondary: 'bg-gray-50 text-gray-600 border-gray-200',
  success: 'bg-green-50 text-green-600 border-green-200',
  warning: 'bg-yellow-50 text-yellow-600 border-yellow-200',
};

export function StatsCard({ 
  title, 
  value, 
  total, 
  unit, 
  color = 'primary',
  icon: Icon,
  change,
  changeType
}: StatsCardProps) {
  const percentage = total ? Math.round((Number(value) / total) * 100) : 0;
  const isOverLimit = total && Number(value) > total;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-lg border border-gray-200 p-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <div className="mt-2 flex items-baseline">
            <p className="text-2xl font-semibold text-gray-900">
              {typeof value === 'number' ? value.toLocaleString() : value}
            </p>
            {unit && (
              <p className="ml-1 text-sm text-gray-500">{unit}</p>
            )}
          </div>
          {change && (
            <div className="mt-1 flex items-center">
              <span className={`text-sm font-medium ${
                changeType === 'positive' ? 'text-green-600' : 
                changeType === 'negative' ? 'text-red-600' : 
                'text-gray-600'
              }`}>
                {change}
              </span>
            </div>
          )}
          {total && (
            <p className="text-sm text-gray-500 mt-1">
              of {total.toLocaleString()} {unit}
            </p>
          )}
        </div>
        
        {Icon && (
          <div className={`p-3 rounded-lg border ${colorClasses[color]}`}>
            {typeof Icon === 'string' ? (
              <span className="text-2xl">{Icon}</span>
            ) : (
              <Icon className="h-6 w-6" />
            )}
          </div>
        )}
      </div>

      {total && (
        <div className="mt-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Usage</span>
            <span className={`font-medium ${isOverLimit ? 'text-red-600' : 'text-gray-900'}`}>
              {percentage}%
            </span>
          </div>
          <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(percentage, 100)}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className={`h-2 rounded-full ${
                isOverLimit 
                  ? 'bg-red-500' 
                  : percentage > 80 
                    ? 'bg-yellow-500' 
                    : 'bg-blue-500'
              }`}
            />
          </div>
        </div>
      )}
    </motion.div>
  );
} 