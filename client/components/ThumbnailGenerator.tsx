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
  CheckIcon,
  CogIcon,
  Square3Stack3DIcon
} from '@heroicons/react/24/outline';
import Button from './Button';
import { useAuthStore } from '@/store/authStore';
import { formatFileSize, buildApiUrl } from '@/utils/formatters';
import toast from 'react-hot-toast';

interface ThumbnailPreset {
  id: string;
  name: string;
  width: number;
  height: number;
  description: string;
  category: 'square' | 'portrait' | 'landscape' | 'responsive';
}

interface ThumbnailResult {
  originalName: string;
  thumbnails: Array<{
    name: string;
    type: string;
    width: number;
    height: number;
    format: string;
    size: number;
    filename: string;
    downloadUrl: string;
    error?: string;
  }>;
  zipUrl?: string;
  totalThumbnails: number;
  totalErrors: number;
}

const ThumbnailGenerator: React.FC = () => {
  const { user, token } = useAuthStore();
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentFile, setCurrentFile] = useState('');
  const [results, setResults] = useState<ThumbnailResult[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [thumbnailOptions, setThumbnailOptions] = useState({
    presets: ['small', 'medium', 'large'],
    customSizes: [] as Array<{ width: number; height: number }>,
    quality: 80,
    format: 'auto',
    preserveAspectRatio: true,
    fit: 'inside',
    background: '#ffffff',
    createZip: true
  });

  const availablePresets: ThumbnailPreset[] = [
    // Square presets
    { id: 'xs', name: 'Extra Small', width: 150, height: 150, description: '150x150px', category: 'square' },
    { id: 'small', name: 'Small', width: 300, height: 300, description: '300x300px', category: 'square' },
    { id: 'medium', name: 'Medium', width: 600, height: 600, description: '600x600px', category: 'square' },
    { id: 'large', name: 'Large', width: 1200, height: 1200, description: '1200x1200px', category: 'square' },
    { id: 'xl', name: 'Extra Large', width: 1920, height: 1920, description: '1920x1920px', category: 'square' },
    
    // Portrait presets
    { id: 'portrait-300', name: 'Portrait Small', width: 300, height: 450, description: '300x450px', category: 'portrait' },
    { id: 'portrait-600', name: 'Portrait Medium', width: 600, height: 900, description: '600x900px', category: 'portrait' },
    
    // Landscape presets
    { id: 'landscape-400', name: 'Landscape Small', width: 600, height: 400, description: '600x400px', category: 'landscape' },
    { id: 'landscape-800', name: 'Landscape Medium', width: 1200, height: 800, description: '1200x800px', category: 'landscape' },
    
    // Responsive presets
    { id: 'square-150', name: 'Square 150', width: 150, height: 150, description: '150x150px', category: 'responsive' },
    { id: 'square-300', name: 'Square 300', width: 300, height: 300, description: '300x300px', category: 'responsive' },
    { id: 'square-600', name: 'Square 600', width: 600, height: 600, description: '600x600px', category: 'responsive' }
  ];

  const formatOptions = [
    { value: 'auto', label: 'Auto (Original)' },
    { value: 'jpeg', label: 'JPEG' },
    { value: 'png', label: 'PNG' },
    { value: 'webp', label: 'WebP' }
  ];

  const fitOptions = [
    { value: 'inside', label: 'Fit Inside (Preserve aspect ratio)' },
    { value: 'cover', label: 'Cover (Crop to fit)' },
    { value: 'fill', label: 'Fill (Stretch to fit)' },
    { value: 'outside', label: 'Outside (Allow overflow)' }
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

  const removeFile = useCallback((index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  }, []);

  const togglePreset = useCallback((presetId: string) => {
    setThumbnailOptions(prev => ({
      ...prev,
      presets: prev.presets.includes(presetId)
        ? prev.presets.filter(p => p !== presetId)
        : [...prev.presets, presetId]
    }));
  }, []);

  const addCustomSize = useCallback(() => {
    setThumbnailOptions(prev => ({
      ...prev,
      customSizes: [...prev.customSizes, { width: 300, height: 300 }]
    }));
  }, []);

  const updateCustomSize = useCallback((index: number, field: 'width' | 'height', value: number) => {
    setThumbnailOptions(prev => ({
      ...prev,
      customSizes: prev.customSizes.map((size, i) => 
        i === index ? { ...size, [field]: value } : size
      )
    }));
  }, []);

  const removeCustomSize = useCallback((index: number) => {
    setThumbnailOptions(prev => ({
      ...prev,
      customSizes: prev.customSizes.filter((_, i) => i !== index)
    }));
  }, []);

  const generatePreview = useCallback(async () => {
    if (selectedFiles.length === 0) {
      toast.error('Please select at least one image first');
      return;
    }

    if (thumbnailOptions.presets.length === 0 && thumbnailOptions.customSizes.length === 0) {
      toast.error('Please select at least one preset or add custom sizes');
      return;
    }

    try {
      setShowPreview(true);
      setPreviewImage(URL.createObjectURL(selectedFiles[0]));
    } catch (error) {
      toast.error('Failed to generate preview');
    }
  }, [selectedFiles, thumbnailOptions]);

  const generateThumbnails = useCallback(async () => {
    if (selectedFiles.length === 0) {
      toast.error('Please select at least one image');
      return;
    }

    if (thumbnailOptions.presets.length === 0 && thumbnailOptions.customSizes.length === 0) {
      toast.error('Please select at least one preset or add custom sizes');
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

      // Add thumbnail options
      formData.append('presets', thumbnailOptions.presets.join(','));
      formData.append('customSizes', JSON.stringify(thumbnailOptions.customSizes));
      formData.append('quality', thumbnailOptions.quality.toString());
      formData.append('format', thumbnailOptions.format);
      formData.append('preserveAspectRatio', thumbnailOptions.preserveAspectRatio.toString());
      formData.append('fit', thumbnailOptions.fit);
      formData.append('background', thumbnailOptions.background);
      formData.append('createZip', thumbnailOptions.createZip.toString());

      const response = await fetch(buildApiUrl('api/advanced/thumbnails'), {
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
                toast.success(`Successfully generated thumbnails for ${data.totalProcessed} images!`);
              }
            } catch (e) {
              console.error('Error parsing SSE data:', e);
            }
          }
        }
      }

    } catch (error: any) {
      console.error('Thumbnail generation error:', error);
      toast.error(error.message || 'Failed to generate thumbnails');
    } finally {
      setIsProcessing(false);
    }
  }, [selectedFiles, thumbnailOptions, token]);

  const downloadAll = useCallback(() => {
    results.forEach(result => {
      if (result.zipUrl) {
        // Download ZIP file
        const link = document.createElement('a');
        link.href = result.zipUrl;
        link.download = `thumbnails_${result.originalName.split('.')[0]}.zip`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        // Download individual thumbnails
        result.thumbnails.forEach(thumbnail => {
          if (!thumbnail.error) {
            const link = document.createElement('a');
            link.href = thumbnail.downloadUrl;
            link.download = thumbnail.filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
          }
        });
      }
    });
    toast.success('Downloading all thumbnails');
  }, [results]);

  const getPresetCategory = (category: string) => {
    switch (category) {
      case 'square': return 'Square';
      case 'portrait': return 'Portrait';
      case 'landscape': return 'Landscape';
      case 'responsive': return 'Responsive';
      default: return category;
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-surface-900 mb-4">
          Generate Multiple Thumbnail Sizes
        </h1>
        <p className="text-lg text-surface-600 max-w-2xl mx-auto">
          Create multiple thumbnail sizes for your images with preset dimensions, 
          custom sizes, and batch processing. Perfect for responsive websites and apps.
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

          {/* Thumbnail Options */}
          <div className="bg-white rounded-2xl shadow-soft border border-surface-200 p-6">
            <h3 className="text-lg font-semibold text-surface-900 mb-4 flex items-center">
              <CogIcon className="w-5 h-5 mr-2 text-primary-600" />
              Thumbnail Settings
            </h3>

            <div className="space-y-6">
              {/* Preset Sizes */}
              <div>
                <h4 className="font-medium text-surface-900 mb-3">Preset Sizes</h4>
                <div className="grid grid-cols-2 gap-3">
                  {availablePresets.map(preset => (
                    <label key={preset.id} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={thumbnailOptions.presets.includes(preset.id)}
                        onChange={() => togglePreset(preset.id)}
                        className="rounded border-surface-300 text-primary-600 focus:ring-primary-500"
                      />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-surface-900">{preset.name}</p>
                        <p className="text-xs text-surface-500">{preset.description}</p>
                        <span className="inline-block px-2 py-1 bg-surface-100 text-xs text-surface-600 rounded mt-1">
                          {getPresetCategory(preset.category)}
                        </span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Custom Sizes */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-surface-900">Custom Sizes</h4>
                  <Button
                    onClick={addCustomSize}
                    variant="secondary"
                    size="sm"
                  >
                    <Square3Stack3DIcon className="w-4 h-4 mr-2" />
                    Add Size
                  </Button>
                </div>
                
                {thumbnailOptions.customSizes.length > 0 && (
                  <div className="space-y-3">
                    {thumbnailOptions.customSizes.map((size, index) => (
                      <div key={index} className="flex items-center space-x-3 p-3 bg-surface-50 rounded-lg">
                        <div className="flex-1 grid grid-cols-2 gap-2">
                          <input
                            type="number"
                            value={size.width}
                            onChange={(e) => updateCustomSize(index, 'width', parseInt(e.target.value) || 0)}
                            placeholder="Width"
                            className="px-3 py-2 border border-surface-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          />
                          <input
                            type="number"
                            value={size.height}
                            onChange={(e) => updateCustomSize(index, 'height', parseInt(e.target.value) || 0)}
                            placeholder="Height"
                            className="px-3 py-2 border border-surface-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          />
                        </div>
                        <button
                          onClick={() => removeCustomSize(index)}
                          className="p-2 text-surface-400 hover:text-surface-600 transition-colors"
                        >
                          <XMarkIcon className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Quality & Format */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-surface-700 mb-2">
                    Quality
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="100"
                    value={thumbnailOptions.quality}
                    onChange={(e) => setThumbnailOptions(prev => ({ ...prev, quality: parseInt(e.target.value) }))}
                    className="w-full"
                  />
                  <p className="text-xs text-surface-500 mt-1">
                    {thumbnailOptions.quality}%
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-surface-700 mb-2">
                    Format
                  </label>
                  <select
                    value={thumbnailOptions.format}
                    onChange={(e) => setThumbnailOptions(prev => ({ ...prev, format: e.target.value }))}
                    className="w-full px-3 py-2 border border-surface-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    {formatOptions.map(option => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Advanced Options */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-surface-700 mb-2">
                    Fit Mode
                  </label>
                  <select
                    value={thumbnailOptions.fit}
                    onChange={(e) => setThumbnailOptions(prev => ({ ...prev, fit: e.target.value }))}
                    className="w-full px-3 py-2 border border-surface-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    {fitOptions.map(option => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={thumbnailOptions.preserveAspectRatio}
                        onChange={(e) => setThumbnailOptions(prev => ({ ...prev, preserveAspectRatio: e.target.checked }))}
                        className="rounded border-surface-300 text-primary-600 focus:ring-primary-500"
                      />
                      <span className="text-sm font-medium text-surface-700">Preserve Aspect Ratio</span>
                    </label>
                  </div>

                  <div>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={thumbnailOptions.createZip}
                        onChange={(e) => setThumbnailOptions(prev => ({ ...prev, createZip: e.target.checked }))}
                        className="rounded border-surface-300 text-primary-600 focus:ring-primary-500"
                      />
                      <span className="text-sm font-medium text-surface-700">Create ZIP</span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-surface-700 mb-2">
                    Background Color
                  </label>
                  <input
                    type="color"
                    value={thumbnailOptions.background}
                    onChange={(e) => setThumbnailOptions(prev => ({ ...prev, background: e.target.value }))}
                    className="w-full h-10 border border-surface-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
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
                    <p className="text-lg font-semibold">Thumbnail Preview</p>
                    <p className="text-sm opacity-90">
                      {thumbnailOptions.presets.length + thumbnailOptions.customSizes.length} sizes will be generated
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-64 bg-surface-50 rounded-lg border-2 border-dashed border-surface-300 flex items-center justify-center">
                <div className="text-center text-surface-500">
                  <EyeSlashIcon className="w-12 h-12 mx-auto mb-2" />
                  <p>Click &quot;Generate Preview&quot; to see your image</p>
                </div>
              </div>
            )}
          </div>

          {/* Processing Controls */}
          <div className="bg-white rounded-2xl shadow-soft border border-surface-200 p-6">
            <h3 className="text-lg font-semibold text-surface-900 mb-4 flex items-center">
              <ArrowPathIcon className="w-5 h-5 mr-2 text-primary-600" />
              Generate Thumbnails
            </h3>

            <div className="space-y-4">
              <Button
                onClick={generateThumbnails}
                variant="primary"
                className="w-full"
                disabled={isProcessing || selectedFiles.length === 0}
                loading={isProcessing}
              >
                {isProcessing ? 'Generating...' : 'Generate Thumbnails'}
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
                      Generated: {results.length} images
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
                      <div key={index} className="p-3 bg-green-50 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-sm font-medium text-surface-900">{result.originalName}</h4>
                          <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded">
                            {result.totalThumbnails} thumbnails
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2 text-xs text-surface-600">
                          <div>
                            <span className="font-medium">Success:</span> {result.totalThumbnails - result.totalErrors}
                          </div>
                          <div>
                            <span className="font-medium">Errors:</span> {result.totalErrors}
                          </div>
                        </div>

                        {result.zipUrl && (
                          <Button
                            href={result.zipUrl}
                            variant="secondary"
                            size="sm"
                            className="mt-2 w-full"
                            download
                          >
                            <DocumentArrowDownIcon className="w-4 h-4 mr-2" />
                            Download ZIP
                          </Button>
                        )}
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

export default ThumbnailGenerator;
