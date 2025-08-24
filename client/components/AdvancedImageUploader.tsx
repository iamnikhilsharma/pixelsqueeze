import React, { useState, useCallback, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CloudArrowUpIcon, 
  PhotoIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowDownTrayIcon,
  Cog6ToothIcon
} from '@heroicons/react/24/outline';
import Button from './Button';
import { formatBytes, buildApiUrl } from '@/utils/formatters';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/store/authStore';

interface ImageFile {
  id: string;
  file: File;
  preview: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  progress?: number;
  result?: any;
  error?: string;
}

interface AdvancedImageUploaderProps {
  onImagesProcessed?: (results: any[]) => void;
}

export default function AdvancedImageUploader({ onImagesProcessed }: AdvancedImageUploaderProps) {
  const [images, setImages] = useState<ImageFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const presets = {
    'web-optimized': { quality: 85, format: 'webp', width: 1920, height: 1080 },
    'social-media': { quality: 90, format: 'jpeg', width: 1200, height: 630 },
    'thumbnail': { quality: 75, format: 'jpeg', width: 300, height: 300 },
    'print-ready': { quality: 100, format: 'tiff', preserveMetadata: true },
    'mobile-optimized': { quality: 80, format: 'webp', width: 800, height: 600 }
  } as const;

  type PresetKey = keyof typeof presets;
  
  const [selectedPreset, setSelectedPreset] = useState<PresetKey>('web-optimized');
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);

  // Advanced options state
  const [advancedOptions, setAdvancedOptions] = useState({
    quality: 80,
    format: 'auto',
    width: '',
    height: '',
    preserveMetadata: false,
    progressive: true,
    mozjpeg: true,
    blur: 0,
    sharpen: 0,
    grayscale: false,
    flip: false,
    flop: false,
    rotate: 0,
    brightness: 1,
    contrast: 1,
    saturation: 1,
    gamma: 1
  });

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newImages: ImageFile[] = acceptedFiles.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      preview: URL.createObjectURL(file),
      status: 'pending'
    }));

    setImages(prev => [...prev, ...newImages]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp', '.avif', '.tiff', '.gif']
    },
    multiple: true
  });

  const removeImage = (id: string) => {
    setImages(prev => {
      const image = prev.find(img => img.id === id);
      if (image) {
        URL.revokeObjectURL(image.preview);
      }
      return prev.filter(img => img.id !== id);
    });
  };

  const processImages = async () => {
    if (images.length === 0) {
      toast.error('Please select images to process');
      return;
    }

    setIsProcessing(true);
    setProcessingProgress(0);

    try {
      const formData = new FormData();
      images.forEach(image => {
        formData.append('images', image.file);
      });

      // Add optimization options
      const options = presets[selectedPreset] || {};
      Object.entries(options).forEach(([key, value]) => {
        formData.append(key, value.toString());
      });

      // Add advanced options if enabled
      if (showAdvancedOptions) {
        Object.entries(advancedOptions).forEach(([key, value]) => {
          formData.append(key, value.toString());
        });
      }

      const authData = localStorage.getItem('pixelsqueeze-auth');
      const token = authData ? JSON.parse(authData).state.token : '';
      
      const response = await fetch(buildApiUrl('/api/advanced/batch-optimize'), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error('Failed to process images');
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response body');

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              
              if (data.type === 'complete') {
                // Update images with results
                setImages(prev => prev.map((img, index) => ({
                  ...img,
                  status: 'completed',
                  result: data.results[index]
                })));
                
                if (onImagesProcessed) {
                  onImagesProcessed(data.results);
                }
                
                toast.success(`Successfully processed ${images.length} images`);
              } else {
                // Update progress
                setProcessingProgress(data.percentage);
                
                // Update individual image progress
                setImages(prev => prev.map(img => {
                  if (img.file.name === data.currentFile) {
                    return {
                      ...img,
                      status: data.error ? 'error' : 'processing',
                      progress: data.percentage,
                      error: data.error
                    };
                  }
                  return img;
                }));
              }
            } catch (e) {
              console.error('Error parsing SSE data:', e);
            }
          }
        }
      }

    } catch (error) {
      console.error('Error processing images:', error);
      toast.error('Failed to process images');
      
      setImages(prev => prev.map(img => ({
        ...img,
        status: 'error',
        error: 'Processing failed'
      })));
    } finally {
      setIsProcessing(false);
      setProcessingProgress(0);
    }
  };

  const downloadAll = () => {
    const completedImages = images.filter(img => img.status === 'completed' && img.result);
    
    completedImages.forEach(image => {
      if (image.result?.downloadUrl) {
        const link = document.createElement('a');
        // Construct the full URL for download
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5002';
        const cleanBaseUrl = baseUrl.replace(/\/$/, ''); // Remove trailing slash
        link.href = `${cleanBaseUrl}${image.result.downloadUrl}`;
        link.download = `optimized_${image.file.name}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        console.error('No download URL found for image:', image);
      }
    });
  };

  const clearAll = () => {
    images.forEach(image => {
      URL.revokeObjectURL(image.preview);
    });
    setImages([]);
  };

  return (
    <div className="space-y-6">
      {/* Preset Selection */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Optimization Preset</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {Object.entries(presets).map(([key, preset]) => (
            <button
              key={key}
              onClick={() => setSelectedPreset(key as PresetKey)}
              className={`p-3 rounded-lg border text-sm font-medium transition-colors ${
                selectedPreset === key
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 hover:border-gray-300 text-gray-700'
              }`}
            >
              {key.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </button>
          ))}
        </div>
        
        <button
          onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
          className="mt-4 flex items-center text-sm text-gray-600 hover:text-gray-900"
        >
          <Cog6ToothIcon className="h-4 w-4 mr-2" />
          {showAdvancedOptions ? 'Hide' : 'Show'} Advanced Options
        </button>
      </div>

      {/* Advanced Options */}
      {showAdvancedOptions && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="bg-white rounded-lg border border-gray-200 p-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Advanced Options</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Quality</label>
              <input
                type="range"
                min="1"
                max="100"
                value={advancedOptions.quality}
                onChange={(e) => setAdvancedOptions(prev => ({ ...prev, quality: parseInt(e.target.value) }))}
                className="w-full"
              />
              <span className="text-sm text-gray-500">{advancedOptions.quality}%</span>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Format</label>
              <select
                value={advancedOptions.format}
                onChange={(e) => setAdvancedOptions(prev => ({ ...prev, format: e.target.value }))}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
              >
                <option value="auto">Auto</option>
                <option value="jpeg">JPEG</option>
                <option value="png">PNG</option>
                <option value="webp">WebP</option>
                <option value="avif">AVIF</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Width</label>
              <input
                type="number"
                placeholder="Auto"
                value={advancedOptions.width}
                onChange={(e) => setAdvancedOptions(prev => ({ ...prev, width: e.target.value }))}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Height</label>
              <input
                type="number"
                placeholder="Auto"
                value={advancedOptions.height}
                onChange={(e) => setAdvancedOptions(prev => ({ ...prev, height: e.target.value }))}
                className="w-full border border-gray-300 rounded-md px-3 py-2"
              />
            </div>
          </div>
        </motion.div>
      )}

      {/* Drop Zone */}
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          isDragActive
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400'
        }`}
      >
        <input {...getInputProps()} />
        <CloudArrowUpIcon className="mx-auto h-12 w-12 text-gray-400" />
        <p className="mt-2 text-sm text-gray-600">
          {isDragActive
            ? 'Drop the images here...'
            : 'Drag & drop images here, or click to select files'}
        </p>
        <p className="text-xs text-gray-500 mt-1">
          Supports JPEG, PNG, WebP, AVIF, TIFF, GIF (max 20 files, 50MB each)
        </p>
      </div>

      {/* Image List */}
      {images.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Selected Images ({images.length})
            </h3>
            <div className="flex space-x-2">
              <Button
                onClick={clearAll}
                variant="outline"
                size="sm"
                disabled={isProcessing}
              >
                <XCircleIcon className="h-4 w-4 mr-2" />
                Clear All
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {images.map((image) => (
              <motion.div
                key={image.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative border border-gray-200 rounded-lg overflow-hidden"
              >
                <div className="aspect-square bg-gray-100">
                  <img
                    src={image.preview}
                    alt={image.file.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                
                <div className="p-3">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {image.file.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatBytes(image.file.size)}
                  </p>
                  
                  {/* Status and Progress */}
                  <div className="mt-2">
                    {image.status === 'pending' && (
                      <div className="flex items-center text-sm text-gray-500">
                        <PhotoIcon className="h-4 w-4 mr-1" />
                        Ready
                      </div>
                    )}
                    
                    {image.status === 'processing' && (
                      <div className="space-y-1">
                        <div className="flex items-center text-sm text-blue-600">
                          <ArrowDownTrayIcon className="h-4 w-4 mr-1 animate-spin" />
                          Processing...
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-1">
                          <div
                            className="bg-blue-600 h-1 rounded-full transition-all"
                            style={{ width: `${image.progress || 0}%` }}
                          />
                        </div>
                      </div>
                    )}
                    
                    {image.status === 'completed' && (
                      <div className="space-y-1">
                        <div className="flex items-center text-sm text-green-600">
                          <CheckCircleIcon className="h-4 w-4 mr-1" />
                          Completed
                        </div>
                        {image.result && (
                          <div className="text-xs text-gray-500">
                            <div>Original: {formatBytes(image.result.originalSize)}</div>
                            <div>Optimized: {formatBytes(image.result.optimizedSize)}</div>
                            <div>Saved: {image.result.compressionRatio}%</div>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {image.status === 'error' && (
                      <div className="flex items-center text-sm text-red-600">
                        <XCircleIcon className="h-4 w-4 mr-1" />
                        {image.error || 'Error'}
                      </div>
                    )}
                  </div>
                </div>
                
                <button
                  onClick={() => removeImage(image.id)}
                  className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                  disabled={isProcessing}
                >
                  <XCircleIcon className="h-3 w-3" />
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      {images.length > 0 && (
        <div className="flex items-center justify-between">
          <div className="flex space-x-3">
            <Button
              onClick={processImages}
              disabled={isProcessing || images.length === 0}
              loading={isProcessing}
              size="lg"
            >
              {isProcessing ? 'Processing...' : 'Process Images'}
            </Button>
            
            {images.some(img => img.status === 'completed') && (
              <Button
                onClick={downloadAll}
                variant="secondary"
                size="lg"
              >
                <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
                Download All
              </Button>
            )}
          </div>
          
          {isProcessing && (
            <div className="text-sm text-gray-600">
              Progress: {processingProgress}%
            </div>
          )}
        </div>
      )}
    </div>
  );
} 