import React from 'react';
import { motion } from 'framer-motion';
import { PhotoIcon, ArrowDownTrayIcon, TrashIcon } from '@heroicons/react/24/outline';
import { formatBytes, formatRelativeTime } from '@/utils/formatters';
import Button from './Button';

interface Image {
  id: string;
  originalSize: number;
  optimizedSize: number;
  compressionRatio: number;
  downloadUrl: string;
  expiresAt: string;
  createdAt: string;
}

interface RecentImagesProps {
  images?: Image[];
  isLoading?: boolean;
  onDelete?: (imageId: string) => void;
}

export function RecentImages({ images = [], isLoading = false, onDelete }: RecentImagesProps) {
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Images</h3>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="flex items-center space-x-4">
                <div className="bg-gray-200 rounded-lg h-12 w-12"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
                <div className="h-8 bg-gray-200 rounded w-20"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (images.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Images</h3>
        <div className="text-center py-8">
          <PhotoIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <p className="text-gray-500">No images optimized yet</p>
          <p className="text-sm text-gray-400 mt-1">
            Upload your first image to see it here
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">
          Recent Images ({images.length})
        </h3>
      </div>

      <div className="divide-y divide-gray-200">
        {images.map((image, index) => (
          <motion.div
            key={image.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="p-6 flex items-center justify-between hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center space-x-4">
              <div className="flex-shrink-0">
                <div className="h-12 w-12 bg-gray-100 rounded-lg flex items-center justify-center">
                  <PhotoIcon className="h-6 w-6 text-gray-400" />
                </div>
              </div>
              
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  Image #{image.id}
                </p>
                <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                  <span>Original: {formatBytes(image.originalSize)}</span>
                  <span>Optimized: {formatBytes(image.optimizedSize)}</span>
                  <span className="text-green-600 font-medium">
                    {image.compressionRatio}% smaller
                  </span>
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  {formatRelativeTime(image.createdAt)}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Button
                href={image.downloadUrl}
                variant="secondary"
                size="sm"
                download
              >
                <ArrowDownTrayIcon className="h-4 w-4 mr-1" />
                Download
              </Button>
              
              {onDelete && (
                <Button
                  onClick={() => onDelete(image.id)}
                  variant="ghost"
                  size="sm"
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <TrashIcon className="h-4 w-4" />
                </Button>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {images.length > 5 && (
        <div className="p-6 border-t border-gray-200">
          <Button href="/images" variant="outline" className="w-full">
            View All Images
          </Button>
        </div>
      )}
    </div>
  );
} 