import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { EllipsisVerticalIcon } from '@heroicons/react/24/outline';

interface Column {
  key: string;
  label: string;
  render?: (value: any, row: any) => React.ReactNode;
  className?: string;
}

interface AdminTableProps {
  columns: Column[];
  data: any[];
  actions?: {
    label: string;
    onClick: (row: any) => void;
    className?: string;
    icon?: React.ReactNode;
  }[];
  onRowClick?: (row: any) => void;
  className?: string;
  emptyMessage?: string;
}

const AdminTable: React.FC<AdminTableProps> = ({
  columns,
  data,
  actions = [],
  onRowClick,
  className = '',
  emptyMessage = 'No data available'
}) => {
  const [hoveredRow, setHoveredRow] = useState<number | null>(null);
  const [openActions, setOpenActions] = useState<number | null>(null);

  const handleRowClick = (row: any) => {
    if (onRowClick) {
      onRowClick(row);
    }
  };

  const handleActionClick = (action: any, row: any, e: React.MouseEvent) => {
    e.stopPropagation();
    action.onClick(row);
    setOpenActions(null);
  };

  if (data.length === 0) {
    return (
      <div className={`rounded-lg bg-white p-8 text-center shadow-sm ${className}`}>
        <div className="text-gray-400">
          <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="mt-2 text-sm font-medium text-gray-900">{emptyMessage}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`overflow-hidden rounded-lg bg-white shadow-sm ${className}`}>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {columns.map((column, index) => (
                <th
                  key={column.key}
                  className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 ${
                    column.className || ''
                  }`}
                >
                  {column.label}
                </th>
              ))}
              {actions.length > 0 && (
                <th className="relative px-6 py-3">
                  <span className="sr-only">Actions</span>
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {data.map((row, rowIndex) => (
              <motion.tr
                key={rowIndex}
                className={`${
                  onRowClick ? 'cursor-pointer hover:bg-gray-50' : ''
                } ${rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}
                onMouseEnter={() => setHoveredRow(rowIndex)}
                onMouseLeave={() => setHoveredRow(null)}
                onClick={() => handleRowClick(row)}
                whileHover={{ backgroundColor: onRowClick ? '#f9fafb' : undefined }}
                transition={{ duration: 0.2 }}
              >
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className={`whitespace-nowrap px-6 py-4 text-sm text-gray-900 ${
                      column.className || ''
                    }`}
                  >
                    {column.render ? column.render(row[column.key], row) : row[column.key]}
                  </td>
                ))}
                
                {actions.length > 0 && (
                  <td className="relative whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                    <div className="relative">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenActions(openActions === rowIndex ? null : rowIndex);
                        }}
                        className="inline-flex items-center rounded-full p-1 text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                      >
                        <EllipsisVerticalIcon className="h-5 w-5" />
                      </button>
                      
                      {openActions === rowIndex && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95, y: -10 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95, y: -10 }}
                          className="absolute right-0 top-full z-10 mt-2 w-48 rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5"
                        >
                          {actions.map((action, actionIndex) => (
                            <button
                              key={actionIndex}
                              onClick={(e) => handleActionClick(action, row, e)}
                              className={`flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 ${
                                action.className || ''
                              }`}
                            >
                              {action.icon && <span className="mr-3">{action.icon}</span>}
                              {action.label}
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </div>
                  </td>
                )}
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminTable;
