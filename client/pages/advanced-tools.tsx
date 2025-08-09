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
  PaintBrushIcon
} from '@heroicons/react/24/outline';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/Button';
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
          `px-3 py-1.5 text-xs whitespace-nowrap focus:outline-none ${
            value === opt.value
              ? 'bg-indigo-600 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-50'
          } ${idx !== options.length - 1 ? 'border-r' : ''}`
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
    if (tool.status === 'premium' && isPremiumUser) return 'Premium Only';
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
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-indigo-100 rounded-lg">
                  {React.createElement(tools.find(t => t.id === selectedTool)?.icon || PhotoIcon, { className: "h-6 w-6 text-indigo-600" })}
                </div>
                <h2 className="text-xl font-semibold text-gray-900">{tools.find(t => t.id === selectedTool)?.name}</h2>
              </div>
              <Button onClick={() => setSelectedTool(null)} variant="outline" size="sm">Close</Button>
            </div>

            {selectedTool === 'batch-processing' && (
              <div>
              <AdvancedImageUploader onImagesProcessed={handleImagesProcessed} />
                <p className="mt-4 text-sm text-gray-500">When processing completes, visit <a className="text-blue-600 underline" href="/images">My Images</a> to view and download your results.</p>
              </div>
            )}

            {selectedTool === 'watermarking' && (
              <div>
                <div className="mb-4">
                  <div className="inline-flex rounded-lg overflow-hidden border">
                    <button
                      className={`px-4 py-2 text-sm font-medium ${wmActiveTab==='image' ? 'bg-indigo-600 text-white' : 'hover:bg-gray-50'} border-r`}
                      onClick={() => { setWmActiveTab('image'); setTwResultUrl(null); setTwSavedUrl(null); }}
                    >
                      Image watermark
                    </button>
                    <button
                      className={`px-4 py-2 text-sm font-medium ${wmActiveTab==='text' ? 'bg-indigo-600 text-white' : 'hover:bg-gray-50'}`}
                      onClick={() => { setWmActiveTab('text'); setWmResultUrl(null); setWmSavedUrl(null); }}
                    >
                      Text watermark
                    </button>
                  </div>
                </div>

                <div className="grid lg:grid-cols-2 gap-6">
                  {/* Left: Controls */}
                  <div className="space-y-4">
                    {wmActiveTab === 'image' && (
                    <div className="bg-gray-50 rounded-lg p-4 border">
                      <h4 className="font-medium text-gray-900 mb-3">Image watermark</h4>
                      <div className="grid md:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Image</label>
                          <input id="wmImageInput" type="file" accept="image/*" className="hidden" onChange={(e) => setWmImage(e.target.files?.[0] || null)} />
                          <label htmlFor="wmImageInput" className="inline-flex items-center px-3 py-2 border rounded-md bg-white text-sm cursor-pointer hover:bg-gray-50">
                            <PhotoIcon className="h-4 w-4 mr-2 text-indigo-600" />
                            {wmImage ? wmImage.name : 'Choose file'}
                          </label>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Watermark (PNG)</label>
                          <input id="wmFileInput" type="file" accept="image/png" className="hidden" onChange={(e) => setWmFile(e.target.files?.[0] || null)} />
                          <label htmlFor="wmFileInput" className="inline-flex items-center px-3 py-2 border rounded-md bg-white text-sm cursor-pointer hover:bg-gray-50">
                            <DocumentTextIcon className="h-4 w-4 mr-2 text-indigo-600" />
                            {wmFile ? wmFile.name : 'Choose file'}
                          </label>
                        </div>
                      </div>
                      <div className="grid md:grid-cols-5 gap-3 mt-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Position</label>
                          <SegmentedControl value={wmPosition} onChange={(v) => setWmPosition(v)} options={positionOptions} />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Style</label>
                          <SegmentedControl
                            value={wmStyle}
                            onChange={(v) => setWmStyle(v as any)}
                            options={styleOptions}
                          />
                        </div>
                        <div>
                          <label className="flex items-center justify-between text-sm font-medium text-gray-700"><span>Opacity</span><span className="text-gray-500">{Math.round(wmOpacity*100)}%</span></label>
                          <input type="range" min="0.1" max="1" step="0.05" value={wmOpacity} onChange={(e) => setWmOpacity(parseFloat(e.target.value))} className="w-full accent-indigo-600" />
                        </div>
                        <div>
                          <label className="flex items-center justify-between text-sm font-medium text-gray-700"><span>Size</span><span className="text-gray-500">{Math.round(wmSize*100)}%</span></label>
                          <input type="range" min="0.05" max="0.5" step="0.05" value={wmSize} onChange={(e) => setWmSize(parseFloat(e.target.value))} className="w-full accent-indigo-600" />
                        </div>
                        <div>
                          <label className="flex items-center justify-between text-sm font-medium text-gray-700"><span>Margin</span><span className="text-gray-500">{wmMargin}px</span></label>
                          <input type="range" min="0" max="100" step="2" value={wmMargin} onChange={(e) => setWmMargin(parseInt(e.target.value))} className="w-full accent-indigo-600" />
                        </div>
                      </div>
                      <div className="mt-3">
                        <Button variant="primary" loading={wmLoading} onClick={async () => {
                          try {
                            if (!wmImage || !wmFile) { toast.error('Select image and watermark'); return; }
                            setWmLoading(true);
                            const authData = localStorage.getItem('pixelsqueeze-auth');
                            const token = authData ? JSON.parse(authData).state.token : '';
                            const form = new FormData();
                            form.append('image', wmImage);
                            form.append('watermark', wmFile);
                            form.append('position', wmPosition);
                            form.append('style', wmStyle);
                            form.append('opacity', String(wmOpacity));
                            form.append('size', String(wmSize));
                            form.append('margin', String(wmMargin));
                            const res = await fetch(buildApiUrl('/api/advanced/watermark'), { method: 'POST', headers: { 'Authorization': `Bearer ${token}` }, body: form });
                            const data = await res.json();
                            if (!data.success) throw new Error(data.error || 'Failed');
                            const savedUrl = data.data?.key ? buildApiUrl(`/uploads/${data.data.key}`) : (data.data?.url || null);
                            setWmSavedUrl(savedUrl);
                            setWmResultUrl(null);
                            toast.success('Watermark saved');
                          } catch (e: any) { toast.error(e.message || 'Failed'); } finally { setWmLoading(false); }
                        }}>Apply & Save</Button>
                      </div>
                    </div>
                    )}

                    {wmActiveTab === 'text' && (
                    <div className="bg-gray-50 rounded-lg p-4 border">
                      <h4 className="font-medium text-gray-900 mb-3">Text watermark</h4>
                      <div className="grid md:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Image</label>
                          <input id="twImageInput" type="file" accept="image/*" className="hidden" onChange={(e) => setTwImage(e.target.files?.[0] || null)} />
                          <label htmlFor="twImageInput" className="inline-flex items-center px-3 py-2 border rounded-md bg-white text-sm cursor-pointer hover:bg-gray-50">
                            <PhotoIcon className="h-4 w-4 mr-2 text-indigo-600" />
                            {twImage ? twImage.name : 'Choose file'}
                          </label>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Watermark text</label>
                          <input className="w-full border rounded px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500" value={twText} onChange={(e) => setTwText(e.target.value)} />
                        </div>
                      </div>
                      <div className="grid md:grid-cols-5 gap-3 mt-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Position</label>
                          <SegmentedControl value={twPosition} onChange={(v) => setTwPosition(v)} options={positionOptions} />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Style</label>
                          <SegmentedControl
                            value={twStyle}
                            onChange={(v) => setTwStyle(v as any)}
                            options={styleOptions}
                          />
                        </div>
                        <div>
                          <label className="flex items-center justify-between text-sm font-medium text-gray-700"><span>Opacity</span><span className="text-gray-500">{Math.round(twOpacity*100)}%</span></label>
                          <input type="range" min="0.1" max="1" step="0.05" value={twOpacity} onChange={(e) => setTwOpacity(parseFloat(e.target.value))} className="w-full accent-indigo-600" />
                        </div>
                        <div>
                          <label className="flex items-center justify-between text-sm font-medium text-gray-700"><span>Size</span><span className="text-gray-500">{Math.round(twSize*100)}%</span></label>
                          <input type="range" min="0.05" max="0.5" step="0.05" value={twSize} onChange={(e) => setTwSize(parseFloat(e.target.value))} className="w-full accent-indigo-600" />
                        </div>
                        <div>
                          <label className="flex items-center justify-between text-sm font-medium text-gray-700"><span>Margin</span><span className="text-gray-500">{Math.round(twMargin*100)}%</span></label>
                          <input type="range" min="0" max="100" step="2" value={twMargin} onChange={(e) => setTwMargin(parseInt(e.target.value))} className="w-full accent-indigo-600" />
                        </div>
                      </div>
                      <div className="grid md:grid-cols-3 gap-3 mt-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Color</label>
                          <input type="color" value={twColor} onChange={(e)=> setTwColor(e.target.value)} />
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700">Font size</label>
                          <input type="number" className="w-full border rounded px-2 py-1" value={twFontSize} onChange={(e)=> setTwFontSize(parseInt(e.target.value)||48)} />
                        </div>
                      </div>
                      <div className="grid md:grid-cols-4 gap-3 mt-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Shadow color</label>
                          <input type="color" defaultValue="#000000" onChange={(e)=> (e.target as HTMLInputElement).dataset.val = e.target.value} data-val="#000000" id="twShadowColor" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Shadow opacity</label>
                          <input type="number" step="0.05" min="0" max="1" defaultValue={0.35} className="w-full border rounded px-2 py-1" id="twShadowOpacity" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Shadow blur</label>
                          <input type="number" min="0" defaultValue={2} className="w-full border rounded px-2 py-1" id="twShadowBlur" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Shadow offset</label>
                          <div className="flex space-x-2">
                            <input type="number" defaultValue={2} className="w-full border rounded px-2 py-1" placeholder="X" id="twShadowOffsetX" />
                            <input type="number" defaultValue={2} className="w-full border rounded px-2 py-1" placeholder="Y" id="twShadowOffsetY" />
                          </div>
                        </div>
                      </div>
                      <div className="mt-3">
                        <Button variant="primary" loading={twLoading} onClick={async () => {
                          try {
                            if (!twImage) { toast.error('Select image'); return; }
                            setTwLoading(true);
                            const authData = localStorage.getItem('pixelsqueeze-auth');
                            const token = authData ? JSON.parse(authData).state.token : '';
                            const form = new FormData();
                            form.append('image', twImage);
                            form.append('text', twText);
                            form.append('position', twPosition);
                            form.append('style', twStyle);
                            form.append('opacity', String(twOpacity));
                            form.append('size', String(twSize));
                            form.append('margin', String(twMargin));
                            form.append('color', twColor);
                            form.append('fontSize', String(twFontSize));
                           // Shadow options
                           const getVal = (id: string) => (document.getElementById(id) as HTMLInputElement)?.value;
                           form.append('shadowColor', getVal('twShadowColor') || '#000000');
                           form.append('shadowOpacity', getVal('twShadowOpacity') || '0.35');
                           form.append('shadowBlur', getVal('twShadowBlur') || '2');
                           form.append('shadowOffsetX', getVal('twShadowOffsetX') || '2');
                           form.append('shadowOffsetY', getVal('twShadowOffsetY') || '2');
                            const res = await fetch(buildApiUrl('/api/advanced/watermark-text'), { method: 'POST', headers: { 'Authorization': `Bearer ${token}` }, body: form });
                            const data = await res.json();
                            if (!data.success) throw new Error(data.error || 'Failed');
                            const savedUrl = data.data?.key ? buildApiUrl(`/uploads/${data.data.key}`) : (data.data?.url || null);
                            setTwSavedUrl(savedUrl);
                            setTwResultUrl(null);
                            toast.success('Text watermark saved');
                          } catch (e: any) { toast.error(e.message || 'Failed'); } finally { setTwLoading(false); }
                        }}>Apply & Save</Button>
                      </div>
                    </div>
                    )}
                  </div>

                  {/* Right: Preview */}
                  <div className="bg-gray-50 rounded-lg p-4 border">
                    <h4 className="font-medium text-gray-900 mb-3">Preview</h4>
                    {wmSavedUrl || twSavedUrl ? (
                      <div className="aspect-video bg-white rounded-lg border overflow-hidden flex items-center justify-center">
                        <img
                          src={(wmSavedUrl || twSavedUrl) as string}
                          alt="Watermark preview"
                          className="max-w-full max-h-full object-contain"
                        />
                      </div>
                    ) : (
                      <div className="aspect-video bg-white rounded-lg border flex items-center justify-center text-gray-400">
                        <span>Preview will appear after applying. Saved URLs will show below.</span>
                      </div>
                    )}
                    {wmSavedUrl && (
                      <div className="mt-3">
                        <p className="text-sm text-gray-600">Image watermark URL:</p>
                        <a className="text-blue-600 underline break-all" href={wmSavedUrl} target="_blank" rel="noreferrer">{wmSavedUrl}</a>
                      </div>
                    )}
                    {twSavedUrl && (
                      <div className="mt-3">
                        <p className="text-sm text-gray-600">Text watermark URL:</p>
                        <a className="text-blue-600 underline break-all" href={twSavedUrl} target="_blank" rel="noreferrer">{twSavedUrl}</a>
                      </div>
                    )}
                  </div>
                </div>
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
      )}
    </Layout>
  );
} 