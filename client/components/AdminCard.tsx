import React from 'react';
import { motion } from 'framer-motion';

interface AdminCardProps {
  title: string;
  value: string | number;
  change?: {
    value: number;
    isPositive: boolean;
    period: string;
  };
  icon?: React.ReactNode;
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info';
  className?: string;
}

const AdminCard: React.FC<AdminCardProps> = ({
  title,
  value,
  change,
  icon,
  color = 'primary',
  className = ''
}) => {
  const colorClasses = {
    primary: 'from-blue-500 to-purple-600',
    secondary: 'from-gray-500 to-gray-700',
    success: 'from-green-500 to-emerald-600',
    warning: 'from-yellow-500 to-orange-600',
    danger: 'from-red-500 to-pink-600',
    info: 'from-cyan-500 to-blue-600'
  };

  const iconColors = {
    primary: 'text-blue-600',
    secondary: 'text-gray-600',
    success: 'text-green-600',
    warning: 'text-yellow-600',
    danger: 'text-red-600',
    info: 'text-cyan-600'
  };

  return (
    <motion.div
      whileHover={{ y: -2 }}
      className={`relative overflow-hidden rounded-xl bg-white p-6 shadow-lg transition-all duration-300 hover:shadow-xl ${className}`}
    >
      {/* Gradient border */}
      <div className={`absolute inset-0 bg-gradient-to-r ${colorClasses[color]} opacity-10`} />
      
      {/* Content */}
      <div className="relative z-10">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="mt-2 text-3xl font-bold text-gray-900">{value}</p>
            
            {change && (
              <div className="mt-2 flex items-center">
                <span
                  className={`inline-flex items-center text-sm font-medium ${
                    change.isPositive ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {change.isPositive ? '↗' : '↘'} {Math.abs(change.value)}%
                </span>
                <span className="ml-1 text-sm text-gray-500">vs {change.period}</span>
              </div>
            )}
          </div>
          
          {icon && (
            <div className={`ml-4 flex h-12 w-12 items-center justify-center rounded-lg bg-gray-50 ${iconColors[color]}`}>
              {icon}
            </div>
          )}
        </div>
      </div>
      
      {/* Decorative elements */}
      <div className={`absolute -right-4 -top-4 h-24 w-24 rounded-full bg-gradient-to-br ${colorClasses[color]} opacity-5`} />
    </motion.div>
  );
};

export default AdminCard;
