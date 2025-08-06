import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  PhotoIcon,
  ArrowPathIcon,
  DocumentArrowDownIcon,
  EyeIcon,
  CogIcon,
  SparklesIcon,
  ChartBarIcon,
  CameraIcon,
  DocumentTextIcon,
  PaintBrushIcon
} from '@heroicons/react/24/outline';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/Button';
import AdvancedImageUploader from '@/components/AdvancedImageUploader';
import { useAuthStore } from '@/store/authStore';
import { formatFileSize, formatNumber } from '@/utils/formatters';

interface Tool {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<any>;
  features: string[];
  status: 'available' | 'premium' | 'coming-soon';
}

const tools: Tool[] = [
  {
    id: 'batch-processing',
    name: 'Batch Processing',
    description: 'Process multiple images simultaneously with progress tracking',
    icon: PhotoIcon,
    features: [
      'Upload up to 20 images at once',
      'Real-time progress tracking',
      'Custom optimization presets',
      'Bulk download functionality'
    ],
    status: 'available'
  },
  {
    id: 'format-conversion',
    name: 'Format Conversion',
    description: 'Convert images between different formats with quality control',
    icon: ArrowPathIcon,
    features: [
      'JPEG, PNG, WebP, AVIF, TIFF support',
      'Quality preservation',
      'Metadata handling',
      'Progressive encoding'
    ],
    status: 'available'
  },
  {
    id: 'watermarking',
    name: 'Watermarking',
    description: 'Add custom watermarks to protect your images',
    icon: PaintBrushIcon,
    features: [
      'Custom watermark positioning',
      'Opacity and size control',
      'Multiple watermark formats',
      'Batch watermarking'
    ],
    status: 'premium'
  },
  {
    id: 'image-analysis',
    name: 'Image Analysis',
    description: 'Get detailed insights about your images',
    icon: ChartBarIcon,
    features: [
      'Metadata extraction',
      'Color analysis',
      'Optimization suggestions',
      'Quality assessment'
    ],
    status: 'available'
  },
  {
    id: 'thumbnail-generation',
    name: 'Thumbnail Generation',
    description: 'Create multiple thumbnail sizes automatically',
    icon: CameraIcon,
    features: [
      'Multiple size presets',
      'Aspect ratio preservation',
      'Quality optimization',
      'Batch generation'
    ],
    status: 'available'
  },
  {
    id: 'advanced-presets',
    name: 'Advanced Presets',
    description: 'Pre-configured optimization settings for different use cases',
    icon: CogIcon,
    features: [
      'Web optimization',
      'Social media formats',
      'Print-ready settings',
      'Mobile optimization'
    ],
    status: 'available'
  }
];

export default function AdvancedTools() {
  const { user } = useAuthStore();
  const [selectedTool, setSelectedTool] = useState<string | null>(null);
  const [processedResults, setProcessedResults] = useState<any[]>([]);

  const isPremiumUser = user?.subscription?.plan !== 'free';

  const handleImagesProcessed = (results: any[]) => {
    setProcessedResults(results);
  };

  const getToolStatus = (tool: Tool) => {
    if (tool.status === 'available') return 'Available';
    if (tool.status === 'premium' && isPremiumUser) return 'Available';
    if (tool.status === 'premium' && !isPremiumUser) return 'Premium Only';
    return 'Coming Soon';
  };

  const getToolStatusColor = (tool: Tool) => {
    if (tool.status === 'available') return 'text-green-600 bg-green-100';
    if (tool.status === 'premium' && isPremiumUser) return 'text-green-600 bg-green-100';
    if (tool.status === 'premium' && !isPremiumUser) return 'text-orange-600 bg-orange-100';
    return 'text-gray-600 bg-gray-100';
  };

  const canUseTool = (tool: Tool) => {
    if (tool.status === 'available') return true;
    if (tool.status === 'premium' && isPremiumUser) return true;
    return false;
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <SparklesIcon className="h-6 w-6 text-indigo-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Advanced Tools</h1>
          </div>
          <p className="text-gray-600 max-w-3xl">
            Unlock powerful image processing capabilities with our advanced tools. 
            Process images in bulk, convert formats, add watermarks, and get detailed analytics.
          </p>
        </div>

        {/* Tools Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {tools.map((tool) => (
            <motion.div
              key={tool.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ y: -2 }}
              className={`bg-white rounded-lg border border-gray-200 p-6 cursor-pointer transition-all ${
                selectedTool === tool.id ? 'ring-2 ring-indigo-500' : 'hover:border-gray-300'
              } ${!canUseTool(tool) ? 'opacity-60' : ''}`}
              onClick={() => canUseTool(tool) && setSelectedTool(tool.id)}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="p-2 bg-indigo-100 rounded-lg">
                  <tool.icon className="h-6 w-6 text-indigo-600" />
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getToolStatusColor(tool)}`}>
                  {getToolStatus(tool)}
                </span>
              </div>
              
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{tool.name}</h3>
              <p className="text-sm text-gray-600 mb-4">{tool.description}</p>
              
              <ul className="space-y-1 mb-4">
                {tool.features.map((feature, index) => (
                  <li key={index} className="flex items-center text-sm text-gray-600">
                    <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full mr-2" />
                    {feature}
                  </li>
                ))}
              </ul>

              {!canUseTool(tool) && tool.status === 'premium' && (
                <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                  <p className="text-sm text-orange-800">
                    Upgrade to Pro or Enterprise to access this feature
                  </p>
                </div>
              )}
            </motion.div>
          ))}
        </div>

        {/* Selected Tool Interface */}
        {selectedTool && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-lg border border-gray-200 p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-indigo-100 rounded-lg">
                  {React.createElement(tools.find(t => t.id === selectedTool)?.icon || PhotoIcon, {
                    className: "h-6 w-6 text-indigo-600"
                  })}
                </div>
                <h2 className="text-xl font-semibold text-gray-900">
                  {tools.find(t => t.id === selectedTool)?.name}
                </h2>
              </div>
              <Button
                onClick={() => setSelectedTool(null)}
                variant="outline"
                size="sm"
              >
                Close
              </Button>
            </div>

            {/* Tool-specific interface */}
            {selectedTool === 'batch-processing' && (
              <AdvancedImageUploader onImagesProcessed={handleImagesProcessed} />
            )}

            {selectedTool === 'format-conversion' && (
              <div className="text-center py-12">
                <DocumentArrowDownIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Format Conversion</h3>
                <p className="text-gray-600 mb-4">
                  Convert your images to different formats with quality control
                </p>
                <Button variant="primary">
                  Coming Soon
                </Button>
              </div>
            )}

            {selectedTool === 'watermarking' && (
              <div className="text-center py-12">
                <PaintBrushIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Watermarking</h3>
                <p className="text-gray-600 mb-4">
                  Add custom watermarks to protect your images
                </p>
                <Button variant="primary">
                  Coming Soon
                </Button>
              </div>
            )}

            {selectedTool === 'image-analysis' && (
              <div className="text-center py-12">
                <ChartBarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Image Analysis</h3>
                <p className="text-gray-600 mb-4">
                  Get detailed insights about your images
                </p>
                <Button variant="primary">
                  Coming Soon
                </Button>
              </div>
            )}

            {selectedTool === 'thumbnail-generation' && (
              <div className="text-center py-12">
                <CameraIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Thumbnail Generation</h3>
                <p className="text-gray-600 mb-4">
                  Create multiple thumbnail sizes automatically
                </p>
                <Button variant="primary">
                  Coming Soon
                </Button>
              </div>
            )}

            {selectedTool === 'advanced-presets' && (
              <div className="text-center py-12">
                <CogIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Advanced Presets</h3>
                <p className="text-gray-600 mb-4">
                  Pre-configured optimization settings for different use cases
                </p>
                <Button variant="primary">
                  Coming Soon
                </Button>
              </div>
            )}
          </motion.div>
        )}

        {/* Processing Results */}
        {processedResults.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 bg-white rounded-lg border border-gray-200 p-6"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Processing Results</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {processedResults.map((result, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-900">
                      {result.originalName}
                    </span>
                    <span className="text-xs text-gray-500">
                      {result.format?.toUpperCase()}
                    </span>
                  </div>
                  
                  <div className="space-y-1 text-xs text-gray-600">
                    <div>Original: {formatFileSize(result.originalSize)}</div>
                    <div>Optimized: {formatFileSize(result.optimizedSize)}</div>
                    <div>Saved: {formatNumber(result.compressionRatio)}%</div>
                  </div>
                  
                  {result.downloadUrl && (
                    <Button
                      href={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}${result.downloadUrl}`}
                      variant="secondary"
                      size="sm"
                      className="mt-3 w-full"
                      download
                    >
                      <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Upgrade CTA */}
        {!isPremiumUser && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg p-6 text-white"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold mb-2">Unlock Premium Features</h3>
                <p className="text-indigo-100">
                  Upgrade to Pro or Enterprise to access watermarking, advanced analytics, and more.
                </p>
              </div>
              <Button
                href="/billing"
                variant="secondary"
                size="lg"
                className="bg-white text-indigo-600 hover:bg-gray-100"
              >
                Upgrade Now
              </Button>
            </div>
          </motion.div>
        )}
      </div>
    </Layout>
  );
} 