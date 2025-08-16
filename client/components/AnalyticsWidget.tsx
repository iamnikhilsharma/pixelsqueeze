import React from 'react';
import { motion } from 'framer-motion';
import { 
  ArrowTrendingUpIcon, 
  ArrowTrendingDownIcon,
  MinusIcon
} from '@heroicons/react/24/outline';

interface AnalyticsWidgetProps {
  title: string;
  value: string | number;
  change?: {
    value: number;
    isPositive: boolean;
    period: string;
  };
  trend?: {
    data: number[];
    period: string;
  };
  icon?: React.ReactNode;
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info';
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const AnalyticsWidget: React.FC<AnalyticsWidgetProps> = ({
  title,
  value,
  change,
  trend,
  icon,
  color = 'primary',
  className = '',
  size = 'md'
}) => {
  const sizeClasses = {
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8'
  };

  const valueSizes = {
    sm: 'text-2xl',
    md: 'text-3xl',
    lg: 'text-4xl'
  };

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

  const getTrendIcon = (trendData: number[]) => {
    if (trendData.length < 2) return <MinusIcon className="h-4 w-4 text-gray-400" />;
    
    const recent = trendData.slice(-3);
    const previous = trendData.slice(-6, -3);
    
    if (recent.length === 0 || previous.length === 0) {
      return <MinusIcon className="h-4 w-4 text-gray-400" />;
    }
    
    const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
    const previousAvg = previous.reduce((a, b) => a + b, 0) / previous.length;
    
    if (recentAvg > previousAvg * 1.05) {
      return <ArrowTrendingUpIcon className="h-4 w-4 text-green-500" />;
    } else if (recentAvg < previousAvg * 0.95) {
      return <ArrowTrendingDownIcon className="h-4 w-4 text-red-500" />;
    } else {
      return <MinusIcon className="h-4 w-4 text-gray-400" />;
    }
  };

  const getTrendColor = (trendData: number[]) => {
    if (trendData.length < 2) return 'text-gray-500';
    
    const recent = trendData.slice(-3);
    const previous = trendData.slice(-6, -3);
    
    if (recent.length === 0 || previous.length === 0) {
      return 'text-gray-500';
    }
    
    const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
    const previousAvg = previous.reduce((a, b) => a + b, 0) / previous.length;
    
    if (recentAvg > previousAvg * 1.05) {
      return 'text-green-500';
    } else if (recentAvg < previousAvg * 0.95) {
      return 'text-red-500';
    } else {
      return 'text-gray-500';
    }
  };

  return (
    <motion.div
      whileHover={{ y: -2 }}
      className={`relative overflow-hidden rounded-xl bg-white shadow-lg transition-all duration-300 hover:shadow-xl ${sizeClasses[size]} ${className}`}
    >
      {/* Gradient border */}
      <div className={`absolute inset-0 bg-gradient-to-r ${colorClasses[color]} opacity-10`} />
      
      {/* Content */}
      <div className="relative z-10">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className={`mt-2 font-bold text-gray-900 ${valueSizes[size]}`}>{value}</p>
            
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

            {trend && (
              <div className="mt-2 flex items-center">
                {getTrendIcon(trend.data)}
                <span className={`ml-1 text-sm font-medium ${getTrendColor(trend.data)}`}>
                  {trend.period} trend
                </span>
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

export default AnalyticsWidget;
