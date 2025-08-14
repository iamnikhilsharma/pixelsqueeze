import React, { useEffect, useState } from 'react';
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
  PaintBrushIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import Layout from '@/components/Layout';
import Button from '@/components/Button';
import AdvancedImageUploader from '@/components/AdvancedImageUploader';
import { useAuthStore } from '@/store/authStore';
import { formatFileSize, formatNumber, buildApiUrl } from '@/utils/formatters';
import { useRouter } from 'next/router';
import toast from 'react-hot-toast';

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
    status: 'available'
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
      'Print quality',
      'Social media',
      'E-commerce'
    ],
    status: 'premium'
  }
];

const SegmentedControl = ({
  value,
  options,
  onChange
}: { value: string; options: Array<{ label: string; value: string }>; onChange: (v: string) => void }) => (
  <div className="inline-flex rounded-md shadow-sm border overflow-hidden">
    {options.map((opt, idx) => (
      <button
        key={opt.value}
        type="button"
        onClick={() => onChange(opt.value)}
        className={
          `px-3 py-1.5 text-xs whitespace-nowrap focus:outline-none transition-colors ${
            value === opt.value
              ? 'bg-indigo-600 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-50'
          } ${idx !== options.length - 1 ? 'border-r border-gray-200' : ''}`
        }
      >
        {opt.label}
      </button>
    ))}
  </div>
);

export default function AdvancedTools() {
  const router = useRouter();
  const { user, token, isAuthenticated, isLoading, checkAuth, hasRehydrated } = useAuthStore();
  const [selectedTool, setSelectedTool] = useState<string | null>(null);
  const [processedResults, setProcessedResults] = useState<any[]>([]);

  // Image watermark state
  const [wmImage, setWmImage] = useState<File | null>(null);
  const [wmFile, setWmFile] = useState<File | null>(null);
  const [wmPosition, setWmPosition] = useState('bottom-right');
  const [wmOpacity, setWmOpacity] = useState(0.7);
  const [wmSize, setWmSize] = useState(0.2);
  const [wmStyle, setWmStyle] = useState<'single'|'tiled'|'diagonal'>('single');
  const [wmResultUrl, setWmResultUrl] = useState<string | null>(null);
  const [wmSavedUrl, setWmSavedUrl] = useState<string | null>(null);
  const [wmLoading, setWmLoading] = useState(false);
  const [wmMargin, setWmMargin] = useState(20);

  // Text watermark state
  const [twImage, setTwImage] = useState<File | null>(null);
  const [twText, setTwText] = useState('PixelSqueeze');
  const [twPosition, setTwPosition] = useState('bottom-right');
  const [twOpacity, setTwOpacity] = useState(0.7);
  const [twSize, setTwSize] = useState(0.15);
  const [twMargin, setTwMargin] = useState(20);
  const [twStyle, setTwStyle] = useState<'single'|'tiled'|'diagonal'>('single');
  const [twColor, setTwColor] = useState('#ffffff');
  const [twFontSize, setTwFontSize] = useState(48);
  const [twResultUrl, setTwResultUrl] = useState<string | null>(null);
  const [twSavedUrl, setTwSavedUrl] = useState<string | null>(null);
  const [twLoading, setTwLoading] = useState(false);

  // Watermark tab state
  const [wmActiveTab, setWmActiveTab] = useState<'image'|'text'>('image');

  useEffect(() => {
    (async () => {
      if (!hasRehydrated) return;
      if (!token) { router.replace('/login'); return; }
      await checkAuth();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, hasRehydrated]);

  const isPremiumUser = user?.subscription?.plan !== 'free';

  const canUseTool = (tool: Tool) => {
    if (tool.status === 'available') return true;
    if (tool.status === 'premium' && isPremiumUser) return true;
    return false;
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

  const handleImagesProcessed = (results: any[]) => setProcessedResults(results);

  const positions = ['top-left','top-right','bottom-left','bottom-right','center'];
  const styleOptions: Array<{label: string; value: 'single'|'tiled'|'diagonal'}> = [
    { label: 'Single', value: 'single' },
    { label: 'Tiled', value: 'tiled' },
    { label: 'Diagonal', value: 'diagonal' }
  ];
  const positionOptions = [
    { label: 'TL', value: 'top-left' },
    { label: 'TR', value: 'top-right' },
    { label: 'BL', value: 'bottom-left' },
    { label: 'BR', value: 'bottom-right' },
    { label: 'C', value: 'center' },
  ];

  return (
    <Layout>
      {/* Loading and authentication states */}
      {!hasRehydrated && <div className="min-h-screen"/>}
      {!token && null}
      {isLoading && <div className="min-h-screen flex items-center justify-center text-gray-500">Checking session...</div>}
      {!isAuthenticated && null}
      
      {/* Main content - only render when authenticated */}
      {hasRehydrated && token && !isLoading && isAuthenticated && (
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
            className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-indigo-100 rounded-lg">
                  {React.createElement(tools.find(t => t.id === selectedTool)?.icon || PhotoIcon, { className: "h-6 w-6 text-indigo-600" })}
                </div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {tools.find(t => t.id === selectedTool)?.name}
                </h2>
              </div>
              <button
                onClick={() => setSelectedTool(null)}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            {/* Watermark Tool Interface */}
            {selectedTool === 'watermarking' && (
              <div className="space-y-6">
                <div className="text-center py-12">
                  <div className="w-24 h-24 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <PaintBrushIcon className="w-12 h-12 text-indigo-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">
                    Professional Watermarking Tool
                  </h3>
                  <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
                    Add custom text or logo watermarks to your images with precise control over positioning, 
                    opacity, size, and styling. Perfect for protecting your content and adding branding.
                  </p>
                  
                  <div className="grid md:grid-cols-2 gap-6 mb-8 max-w-4xl mx-auto">
                    <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                      <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                        <DocumentTextIcon className="w-5 h-5 mr-2 text-indigo-600" />
                        Text Watermarks
                      </h4>
                      <ul className="text-sm text-gray-600 space-y-2">
                        <li>• Custom text with font selection</li>
                        <li>• Color and background options</li>
                        <li>• Size and opacity control</li>
                        <li>• 9 positioning presets</li>
                        <li>• Rotation and margin settings</li>
                      </ul>
                    </div>
                    
                    <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                      <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                        <PhotoIcon className="w-5 h-5 mr-2 text-indigo-600" />
                        Image Watermarks
                      </h4>
                      <ul className="text-sm text-gray-600 space-y-2">
                        <li>• Logo and image watermarks</li>
                        <li>• Automatic size scaling</li>
                        <li>• Blend mode options</li>
                        <li>• Batch processing</li>
                        <li>• High-quality output</li>
                      </ul>
                    </div>
                  </div>

                  <Button
                    href="/watermark"
                    variant="primary"
                    size="lg"
                    className="text-lg px-8 py-4"
                  >
                    <PaintBrushIcon className="w-6 h-6 mr-3" />
                    Open Watermark Tool
                  </Button>
                </div>
              </div>
            )}

            {/* Batch Processing Tool Interface */}
            {selectedTool === 'batch-processing' && (
              <div>
              <AdvancedImageUploader onImagesProcessed={handleImagesProcessed} />
                <p className="mt-4 text-sm text-gray-500">When processing completes, visit <a className="text-blue-600 underline" href="/images">My Images</a> to view and download your results.</p>
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
            className="mt-8 bg-white rounded-lg border border-gray-200 p-6 shadow-sm"
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
                      href={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5002'}${result.downloadUrl}`}
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
      )}
    </Layout>
  );
} 