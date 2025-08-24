import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  PhotoIcon, 
  DocumentTextIcon, 
  EyeIcon,
  EyeSlashIcon,
  ArrowPathIcon,
  DocumentArrowDownIcon,
  XMarkIcon,
  CheckIcon
} from '@heroicons/react/24/outline';
import Button from './Button';
import { useAuthStore } from '@/store/authStore';
import { formatFileSize, buildApiUrl } from '@/utils/formatters';
import toast from 'react-hot-toast';

interface WatermarkOptions {
  type: 'text' | 'image';
  text: string;
  font: string;
  fontSize: number;
  fontColor: string;
  backgroundColor: string;
  position: string;
  opacity: number;
  size: number;
  margin: number;
  rotation: number;
  blendMode: string;
}

interface WatermarkResult {
  id: string;
  filename: string;
  downloadUrl: string;
  originalSize: number;
  optimizedSize: number;
  compressionRatio: number;
  processingTime: number;
}

const WatermarkUploader: React.FC = () => {
  const { user, token } = useAuthStore();
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [watermarkImage, setWatermarkImage] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentFile, setCurrentFile] = useState('');
  const [results, setResults] = useState<WatermarkResult[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const watermarkInputRef = useRef<HTMLInputElement>(null);
  
  const [watermarkOptions, setWatermarkOptions] = useState<WatermarkOptions>({
    type: 'text',
    text: 'PixelSqueeze',
    font: 'Arial',
    fontSize: 48,
    fontColor: '#ffffff',
    backgroundColor: 'rgba(0,0,0,0.5)',
    position: 'bottom-right',
    opacity: 0.8,
    size: 1.0,
    margin: 20,
    rotation: 0,
    blendMode: 'over'
  });

  const fonts = [
    'Arial', 'Helvetica', 'Times New Roman', 'Georgia', 'Verdana', 
    'Courier New', 'Impact', 'Comic Sans MS', 'Tahoma', 'Trebuchet MS'
  ];

  const positions = [
    'top-left', 'top-center', 'top-right',
    'center-left', 'center', 'center-right',
    'bottom-left', 'bottom-center', 'bottom-right'
  ];

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const imageFiles = files.filter(file => 
      file.type.startsWith('image/') && 
      ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.type)
    );
    
    if (imageFiles.length === 0) {
      toast.error('Please select valid image files (JPEG, PNG, WebP)');
      return;
    }
    
    setSelectedFiles(prev => [...prev, ...imageFiles]);
    toast.success(`Added ${imageFiles.length} image(s)`);
  }, []);

  const handleWatermarkImageSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setWatermarkImage(file);
      setWatermarkOptions(prev => ({ ...prev, type: 'image' }));
      toast.success('Watermark image selected');
    } else {
      toast.error('Please select a valid image file');
    }
  }, []);

  const removeFile = useCallback((index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  }, []);

  const removeWatermarkImage = useCallback(() => {
    setWatermarkImage(null);
    setWatermarkOptions(prev => ({ ...prev, type: 'text' }));
  }, []);

  const handleOptionChange = useCallback((key: keyof WatermarkOptions, value: any) => {
    setWatermarkOptions(prev => ({ ...prev, [key]: value }));
  }, []);

  const generatePreview = useCallback(async () => {
    if (selectedFiles.length === 0) {
      toast.error('Please select at least one image first');
      return;
    }

    if (watermarkOptions.type === 'text' && !watermarkOptions.text.trim()) {
      toast.error('Please enter watermark text');
      return;
    }

    if (watermarkOptions.type === 'image' && !watermarkImage) {
      toast.error('Please select a watermark image');
      return;
    }

    try {
      setShowPreview(true);
      // For now, we'll show a placeholder preview
      // In a real implementation, you'd send a sample image to the backend
      setPreviewImage(URL.createObjectURL(selectedFiles[0]));
    } catch (error) {
      toast.error('Failed to generate preview');
    }
  }, [selectedFiles, watermarkOptions, watermarkImage]);

  const processWatermarks = useCallback(async () => {
    if (selectedFiles.length === 0) {
      toast.error('Please select at least one image');
      return;
    }

    if (watermarkOptions.type === 'text' && !watermarkOptions.text.trim()) {
      toast.error('Please enter watermark text');
      return;
    }

    if (watermarkOptions.type === 'image' && !watermarkImage) {
      toast.error('Please select a watermark image');
      return;
    }

    setIsProcessing(true);
    setProgress(0);
    setResults([]);

    try {
      const formData = new FormData();
      
      // Add images
      selectedFiles.forEach(file => {
        formData.append('images', file);
      });

      // Add watermark image if applicable
      if (watermarkOptions.type === 'image' && watermarkImage) {
        formData.append('watermark', watermarkImage);
      }

      // Add watermark options
      Object.entries(watermarkOptions).forEach(([key, value]) => {
        formData.append(key, value.toString());
      });

      const response = await fetch(buildApiUrl('api/advanced/watermark'), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
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
              
              if (data.error) {
                toast.error(`Error processing ${data.currentFile}: ${data.error}`);
              } else if (data.result) {
                setProgress(data.percentage);
                setCurrentFile(data.currentFile);
                setResults(prev => [...prev, data.result]);
              } else if (data.completed) {
                setProgress(100);
                setCurrentFile('');
                toast.success(`Successfully processed ${data.totalProcessed} images!`);
              }
            } catch (e) {
              console.error('Error parsing SSE data:', e);
            }
          }
        }
      }

    } catch (error: any) {
      console.error('Watermark processing error:', error);
      toast.error(error.message || 'Failed to process watermarks');
    } finally {
      setIsProcessing(false);
    }
  }, [selectedFiles, watermarkOptions, watermarkImage, token]);

  const downloadAll = useCallback(() => {
    results.forEach(result => {
      const link = document.createElement('a');
      link.href = result.downloadUrl;
      link.download = result.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    });
    toast.success('Downloading all processed images');
  }, [results]);

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-surface-900 mb-4">
          Add Watermarks to Your Images
        </h1>
        <p className="text-lg text-surface-600 max-w-2xl mx-auto">
          Protect your images with custom text or logo watermarks. 
          Choose from multiple positions, styles, and apply to multiple images at once.
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Left Column - File Upload & Options */}
        <div className="space-y-6">
          {/* File Upload */}
          <div className="bg-white rounded-2xl shadow-soft border border-surface-200 p-6">
            <h3 className="text-lg font-semibold text-surface-900 mb-4 flex items-center">
              <PhotoIcon className="w-5 h-5 mr-2 text-primary-600" />
              Upload Images
            </h3>
            
            <div className="space-y-4">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              
              <Button
                onClick={() => fileInputRef.current?.click()}
                variant="secondary"
                className="w-full"
              >
                <PhotoIcon className="w-5 h-5 mr-2" />
                Select Images (Max 10)
              </Button>

              {selectedFiles.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-surface-700">
                    Selected Files ({selectedFiles.length})
                  </p>
                  {selectedFiles.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-surface-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <PhotoIcon className="w-5 h-5 text-primary-600" />
                        <div>
                          <p className="text-sm font-medium text-surface-900">{file.name}</p>
                          <p className="text-xs text-surface-500">{formatFileSize(file.size)}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => removeFile(index)}
                        className="p-1 text-surface-400 hover:text-surface-600 transition-colors"
                      >
                        <XMarkIcon className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Watermark Options */}
          <div className="bg-white rounded-2xl shadow-soft border border-surface-200 p-6">
            <h3 className="text-lg font-semibold text-surface-900 mb-4 flex items-center">
              <DocumentTextIcon className="w-5 h-5 mr-2 text-primary-600" />
              Watermark Settings
            </h3>

            <div className="space-y-4">
              {/* Watermark Type */}
              <div>
                <label className="block text-sm font-medium text-surface-700 mb-2">
                  Watermark Type
                </label>
                <div className="flex space-x-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="text"
                      checked={watermarkOptions.type === 'text'}
                      onChange={(e) => handleOptionChange('type', e.target.value)}
                      className="mr-2"
                    />
                    Text
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="image"
                      checked={watermarkOptions.type === 'image'}
                      onChange={(e) => handleOptionChange('type', e.target.value)}
                      className="mr-2"
                    />
                    Image
                  </label>
                </div>
              </div>

              {/* Text Watermark Options */}
              {watermarkOptions.type === 'text' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-surface-700 mb-2">
                      Watermark Text
                    </label>
                    <input
                      type="text"
                      value={watermarkOptions.text}
                      onChange={(e) => handleOptionChange('text', e.target.value)}
                      placeholder="Enter watermark text"
                      className="w-full px-3 py-2 border border-surface-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-surface-700 mb-2">
                        Font
                      </label>
                      <select
                        value={watermarkOptions.font}
                        onChange={(e) => handleOptionChange('font', e.target.value)}
                        className="w-full px-3 py-2 border border-surface-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      >
                        {fonts.map(font => (
                          <option key={font} value={font}>{font}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-surface-700 mb-2">
                        Font Size
                      </label>
                      <input
                        type="number"
                        value={watermarkOptions.fontSize}
                        onChange={(e) => handleOptionChange('fontSize', parseInt(e.target.value))}
                        min="12"
                        max="200"
                        className="w-full px-3 py-2 border border-surface-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-surface-700 mb-2">
                        Font Color
                      </label>
                      <input
                        type="color"
                        value={watermarkOptions.fontColor}
                        onChange={(e) => handleOptionChange('fontColor', e.target.value)}
                        className="w-full h-10 border border-surface-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-surface-700 mb-2">
                        Background Color
                      </label>
                      <input
                        type="color"
                        value={watermarkOptions.backgroundColor}
                        onChange={(e) => handleOptionChange('backgroundColor', e.target.value)}
                        className="w-full h-10 border border-surface-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Image Watermark Options */}
              {watermarkOptions.type === 'image' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-surface-700 mb-2">
                      Watermark Image
                    </label>
                    <input
                      ref={watermarkInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleWatermarkImageSelect}
                      className="hidden"
                    />
                    
                    <div className="space-y-3">
                      <Button
                        onClick={() => watermarkInputRef.current?.click()}
                        variant="secondary"
                        className="w-full"
                      >
                        <PhotoIcon className="w-5 h-5 mr-2" />
                        Select Watermark Image
                      </Button>

                      {watermarkImage && (
                        <div className="flex items-center justify-between p-3 bg-surface-50 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <PhotoIcon className="w-5 h-5 text-primary-600" />
                            <div>
                              <p className="text-sm font-medium text-surface-900">{watermarkImage.name}</p>
                              <p className="text-xs text-surface-500">{formatFileSize(watermarkImage.size)}</p>
                            </div>
                          </div>
                          <button
                            onClick={removeWatermarkImage}
                            className="p-1 text-surface-400 hover:text-surface-600 transition-colors"
                          >
                            <XMarkIcon className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-surface-700 mb-2">
                        Size
                      </label>
                      <input
                        type="range"
                        min="0.1"
                        max="2.0"
                        step="0.1"
                        value={watermarkOptions.size}
                        onChange={(e) => handleOptionChange('size', parseFloat(e.target.value))}
                        className="w-full"
                      />
                      <p className="text-xs text-surface-500 mt-1">
                        {Math.round(watermarkOptions.size * 100)}% of image width
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-surface-700 mb-2">
                        Blend Mode
                      </label>
                      <select
                        value={watermarkOptions.blendMode}
                        onChange={(e) => handleOptionChange('blendMode', e.target.value)}
                        className="w-full px-3 py-2 border border-surface-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      >
                        <option value="over">Over</option>
                        <option value="multiply">Multiply</option>
                        <option value="screen">Screen</option>
                        <option value="overlay">Overlay</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Common Options */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-surface-700 mb-2">
                    Position
                  </label>
                  <select
                    value={watermarkOptions.position}
                    onChange={(e) => handleOptionChange('position', e.target.value)}
                    className="w-full px-3 py-2 border border-surface-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    {positions.map(pos => (
                      <option key={pos} value={pos}>
                        {pos.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-surface-700 mb-2">
                      Opacity
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={watermarkOptions.opacity}
                      onChange={(e) => handleOptionChange('opacity', parseFloat(e.target.value))}
                      className="w-full"
                    />
                    <p className="text-xs text-surface-500 mt-1">
                      {Math.round(watermarkOptions.opacity * 100)}%
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-surface-700 mb-2">
                      Rotation
                    </label>
                    <input
                      type="range"
                      min="-180"
                      max="180"
                      step="15"
                      value={watermarkOptions.rotation}
                      onChange={(e) => handleOptionChange('rotation', parseInt(e.target.value))}
                      className="w-full"
                    />
                    <p className="text-xs text-surface-500 mt-1">
                      {watermarkOptions.rotation}°
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-surface-700 mb-2">
                    Margin
                  </label>
                  <input
                    type="number"
                    value={watermarkOptions.margin}
                    onChange={(e) => handleOptionChange('margin', parseInt(e.target.value))}
                    min="0"
                    max="100"
                    className="w-full px-3 py-2 border border-surface-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Preview & Processing */}
        <div className="space-y-6">
          {/* Preview */}
          <div className="bg-white rounded-2xl shadow-soft border border-surface-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-surface-900 flex items-center">
                <EyeIcon className="w-5 h-5 mr-2 text-primary-600" />
                Preview
              </h3>
              <Button
                onClick={generatePreview}
                variant="secondary"
                size="sm"
                disabled={selectedFiles.length === 0}
              >
                <EyeIcon className="w-4 h-4 mr-2" />
                Generate Preview
              </Button>
            </div>

            {showPreview && previewImage ? (
              <div className="relative">
                <img
                  src={previewImage}
                  alt="Preview"
                  className="w-full h-64 object-cover rounded-lg border border-surface-200"
                />
                <div className="absolute inset-0 bg-black bg-opacity-20 rounded-lg flex items-center justify-center">
                  <div className="text-white text-center">
                    <p className="text-lg font-semibold">Watermark Preview</p>
                    <p className="text-sm opacity-90">
                      {watermarkOptions.type === 'text' ? watermarkOptions.text : 'Image Watermark'}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-64 bg-surface-50 rounded-lg border-2 border-dashed border-surface-300 flex items-center justify-center">
                <div className="text-center text-surface-500">
                  <EyeSlashIcon className="w-12 h-12 mx-auto mb-2" />
                  <p>Click &quot;Generate Preview&quot; to see how your watermark will look</p>
                </div>
              </div>
            )}
          </div>

          {/* Processing Controls */}
          <div className="bg-white rounded-2xl shadow-soft border border-surface-200 p-6">
            <h3 className="text-lg font-semibold text-surface-900 mb-4 flex items-center">
              <ArrowPathIcon className="w-5 h-5 mr-2 text-primary-600" />
              Process Images
            </h3>

            <div className="space-y-4">
              <Button
                onClick={processWatermarks}
                variant="primary"
                className="w-full"
                disabled={isProcessing || selectedFiles.length === 0}
                loading={isProcessing}
              >
                {isProcessing ? 'Processing...' : 'Add Watermarks'}
              </Button>

              {isProcessing && (
                <div className="space-y-3">
                  <div className="w-full bg-surface-200 rounded-full h-2">
                    <div
                      className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <p className="text-sm text-surface-600 text-center">
                    {progress}% Complete
                    {currentFile && ` - Processing: ${currentFile}`}
                  </p>
                </div>
              )}

              {results.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-surface-700">
                      Processed: {results.length} images
                    </p>
                    <Button
                      onClick={downloadAll}
                      variant="secondary"
                      size="sm"
                    >
                      <DocumentArrowDownIcon className="w-4 h-4 mr-2" />
                      Download All
                    </Button>
                  </div>

                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {results.map((result, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <CheckIcon className="w-5 h-5 text-green-600" />
                          <div>
                            <p className="text-sm font-medium text-surface-900">{result.filename}</p>
                            <p className="text-xs text-surface-500">
                              {formatFileSize(result.originalSize)} → {formatFileSize(result.optimizedSize)}
                            </p>
                          </div>
                        </div>
                        <Button
                          href={result.downloadUrl}
                          variant="secondary"
                          size="sm"
                          download
                        >
                          Download
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WatermarkUploader;
