import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CloudArrowUpIcon, 
  PhotoIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowDownTrayIcon
} from '@heroicons/react/24/outline';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/store/authStore';
import { Button } from './Button';
import { formatBytes } from '@/utils/formatters';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

interface OptimizedImage {
  id: string;
  originalSize: number;
  optimizedSize: number;
  compressionRatio: number;
  downloadUrl: string;
  expiresAt: string;
}

export function ImageUploader() {
  const { user } = useAuthStore();
  const [isUploading, setIsUploading] = useState(false);
  const [optimizedImages, setOptimizedImages] = useState<OptimizedImage[]>([]);
  const [quality, setQuality] = useState(80);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (!user?.apiKey) {
      toast.error('Please log in to upload images');
      return;
    }

    setIsUploading(true);
    const newOptimizedImages: OptimizedImage[] = [];

    try {
      for (const file of acceptedFiles) {
        const formData = new FormData();
        formData.append('image', file);
        formData.append('quality', quality.toString());

        const response = await axios.post(`${API_URL}/api/optimize`, formData, {
          headers: {
            'Authorization': `Bearer ${user.apiKey}`,
            'Content-Type': 'multipart/form-data',
          },
        });

        if (response.data.success) {
          newOptimizedImages.push(response.data.data);
          toast.success(`${file.name} optimized successfully!`);
        }
      }

      setOptimizedImages(prev => [...newOptimizedImages, ...prev]);
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(error.response?.data?.error || 'Failed to optimize images');
    } finally {
      setIsUploading(false);
    }
  }, [user?.apiKey, quality]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp']
    },
    multiple: true,
    maxSize: 10 * 1024 * 1024, // 10MB
  });

  const downloadAll = async () => {
    if (optimizedImages.length === 0) return;

    try {
      const response = await axios.post(`${API_URL}/api/download-batch`, {
        imageIds: optimizedImages.map(img => img.id)
      }, {
        headers: {
          'Authorization': `Bearer ${user?.apiKey}`,
        },
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'optimized-images.zip');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.success('Download started!');
    } catch (error) {
      toast.error('Failed to download images');
    }
  };

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      <div
        {...getRootProps()}
        className={`
          relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
          transition-all duration-200 ease-in-out
          ${isDragActive 
            ? 'border-blue-500 bg-blue-50' 
            : 'border-gray-300 hover:border-gray-400'
          }
          ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        <input {...getInputProps()} />
        
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.2 }}
        >
          <CloudArrowUpIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          
          {isDragActive ? (
            <p className="text-lg font-medium text-blue-600">
              Drop your images here...
            </p>
          ) : (
            <div>
              <p className="text-lg font-medium text-gray-900 mb-2">
                Drag & drop images here
              </p>
              <p className="text-sm text-gray-500 mb-4">
                or click to select files (JPG, PNG, WebP up to 10MB)
              </p>
              <Button variant="secondary" disabled={isUploading}>
                {isUploading ? 'Uploading...' : 'Select Images'}
              </Button>
            </div>
          )}
        </motion.div>

        {isUploading && (
          <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <p className="text-sm text-gray-600">Optimizing images...</p>
            </div>
          </div>
        )}
      </div>

      {/* Quality Settings */}
      <div className="bg-white rounded-lg p-6 border border-gray-200">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Optimization Settings</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Quality: {quality}%
            </label>
            <input
              type="range"
              min="1"
              max="100"
              value={quality}
              onChange={(e) => setQuality(Number(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>Smaller file</span>
              <span>Better quality</span>
            </div>
          </div>
        </div>
      </div>

      {/* Optimized Images */}
      <AnimatePresence>
        {optimizedImages.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-white rounded-lg border border-gray-200"
          >
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">
                  Optimized Images ({optimizedImages.length})
                </h3>
                <Button onClick={downloadAll} variant="primary" size="sm">
                  <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
                  Download All
                </Button>
              </div>
            </div>

            <div className="divide-y divide-gray-200">
              {optimizedImages.map((image, index) => (
                <motion.div
                  key={image.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="p-6 flex items-center justify-between"
                >
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      <PhotoIcon className="h-8 w-8 text-gray-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        Image #{image.id}
                      </p>
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span>Original: {formatBytes(image.originalSize)}</span>
                        <span>Optimized: {formatBytes(image.optimizedSize)}</span>
                        <span className="text-green-600 font-medium">
                          {image.compressionRatio}% smaller
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <CheckCircleIcon className="h-5 w-5 text-green-500" />
                    <Button
                      href={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}${image.downloadUrl}`}
                      variant="secondary"
                      size="sm"
                      download
                    >
                      Download
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
} 